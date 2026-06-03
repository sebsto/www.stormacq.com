---
title: "Why Pure Swift Beats ARM Hardware CRC32 Instructions"
subtitle: "The most counter-intuitive result from the S3 archiving challenge: a table-based algorithm written in Swift is 19× faster than ARM's dedicated CRC32 instructions. Here's why."
date: 2026-06-03 00:00:00 +0100
tags: [swift, arm, lambda, performance, serverless]
author: Seb
background: /img/posts/20260603/banner.png
images: ['/img/posts/20260603/banner.png']
---

After publishing [Can Swift Match Rust on a Lambda Micro-Benchmark?](/2026/06/02/swift-vs-rust-s3-challenge/) I got a wave of questions about one specific result: the CRC32 decision. People couldn't believe it. Fair enough. I wouldn't have believed it either before measuring.

The question that kept coming back, from [a thread on Mastodon](https://mastodon.social/@JetForMe@geekstodon.com/116682710646700666): "I didn't know ARM had dedicated CRC instructions. Is it slow because you're on a vCPU? Would it be faster on my M1? And what do you mean by 'pure Swift'? Aren't those just shifts and adds?"

Good questions. Let me unpack.

### ARM does have hardware CRC32 instructions

Yes. The CRC32 instructions were introduced as an optional extension in ARMv8.0 and became mandatory in ARMv8.1. The relevant ones are `CRC32B`, `CRC32H`, `CRC32W`, `CRC32X` (the C intrinsic names are `__crc32b`, `__crc32h`, `__crc32w`, `__crc32d`). They compute CRC32 (IEEE polynomial) over 1, 2, 4, or 8 bytes respectively, using the previous CRC value as input. They're available on all Graviton cores (Graviton2 onward) and all Apple Silicon chips.

My initial assumption was straightforward: call into a tiny C shim that uses these intrinsics, and it should be faster than anything I could write in pure Swift.

I was wrong by a factor of 19.

### What "pure Swift" actually means here

Not shifts and adds. It's a [slicing-by-8](https://en.wikipedia.org/wiki/Cyclic_redundancy_check#Computation) table-based algorithm. About 125 lines of Swift, no C dependency, no platform-specific assembly. The core loop processes 8 bytes per iteration by splitting them into 8 independent table lookups (from a precomputed 8×256 table), XORing the results together. The table uses the standard reflected IEEE polynomial (`0xEDB88320`), same as ZIP and zlib.

So yes, it does become ARM instructions in the end: loads, XORs, shifts. But the key property is that those 8 table lookups are *independent of each other*. None of them needs the result of another to proceed.

### Why the hardware instruction loses: serial dependency chains

Here's the fundamental issue. Each `CRC32X` instruction takes two inputs: the data to fold in, and the previous CRC value. That second input is the output of the previous `CRC32X`. It's a read-after-write dependency. The CPU cannot start computing the next CRC step until the current one finishes.

On Neoverse N1 (the core inside Graviton2, which is what Lambda arm64 runs on), `CRC32X` has a latency of 2 cycles with a throughput of 1 per cycle. For a 5 MB file processed 8 bytes at a time, that's roughly 655,000 iterations × 2 cycles = ~1.3 million cycles of serial work, minimum. The out-of-order engine can't extract any parallelism from this dependency-limited loop because every single iteration depends on the one before it.

### Why slicing-by-8 wins: instruction-level parallelism

The slicing-by-8 approach processes the same 8 bytes per iteration, but differently. It splits the current 8-byte chunk into 8 separate byte positions and performs 8 independent table lookups. Each lookup is a load from an L1-cached table (the 8 KB table fits comfortably in L1). The CPU's out-of-order execution engine sees 8 independent memory operations and can issue them in parallel across multiple load/store ports.

This is instruction-level parallelism (ILP) at the load ports. While one lookup is waiting on its L1 cache access (~4 cycles), the other seven can proceed simultaneously on different ports. The final XOR chain to combine the results is trivial: a handful of cycles, and the CPU can overlap it with the next iteration's loads.

On an out-of-order core with 2 load AGUs (like Neoverse N1 in Graviton2) or 3+ (like Apple's M1 Firestorm cores), this is a big win. You're trading a serial 2-cycle-per-iteration chain for a parallel 8-load burst that the execution engine can spread across available ports.

### What about the vCPU angle?

This was the most common reader question: "Is it slow because you're on a vCPU?" At 512 MB Lambda memory, Lambda's [Firecracker microVM](https://github.com/firecracker-microvm/firecracker) is throttled via [the host kernel's cgroups cpu subsystem](https://github.com/firecracker-microvm/firecracker/blob/main/docs/design.md)). Your function shares a physical core with others. But this slows both algorithms proportionally, so it doesn't change the ratio: the 19× gap holds whether you're on Lambda or on a dedicated core.

The vCPU angle isn't why hardware CRC loses. The serial dependency chain is. The vCPU question is a red herring. Even on a full dedicated core (your Apple Silicon, for example), slicing-by-8 would likely still win or be competitive. The fundamental issue is instruction-level parallelism, not raw clock speed or CPU share.

The hardware instructions shine for small buffers where latency matters (a quick checksum of a 64-byte network header, say). For bulk throughput on an out-of-order core, like computing CRC32 over 5 MB of file data, the parallelism of slicing-by-8 wins.

### One more cost: the Swift-to-C boundary

There's a secondary overhead when calling into C from Swift. If the source `ByteBuffer` isn't perfectly contiguous (or if the compiler can't prove it is), there's a bridging cost to get a stable pointer into the data. With slicing-by-8 written directly in Swift, operating on `ByteBuffer.withUnsafeReadableBytes`, there's no boundary to cross. The compiler sees the whole loop and can inline, unroll, and optimize the memory access pattern. With the C shim path, optimization stops at the function call boundary.

On this workload, that boundary cost is small compared to the parallelism gap, but it adds up over 3,000 files.

### The numbers

| Approach | Time per 5 MB file | Total for 3,000 files |
|---|---|---|
| Pure Swift slicing-by-8 | ~4 ms | ~12 s |
| ARM hardware intrinsics via C shim | ~76 ms | ~228 s |

19×. Real, measured, reproducible.

### When would hardware CRC win?

The hardware instructions aren't useless. They just have a different sweet spot:

- Very small buffers (< 256 bytes) where the table-lookup overhead per iteration dominates.
- Scenarios where you can interleave multiple independent CRC streams (computing CRC on 2 or more different buffers simultaneously, feeding the dependency chain of each with independent data). Some implementations do this: process 2 streams in parallel, each using `CRC32X`, exploiting the 2-cycle latency by keeping both chains in flight to saturate the 1/cycle throughput.
- Contexts where L1 cache pressure matters. The 8 KB lookup table displaces other hot data. On a small embedded core without a generous L1D cache, the hardware instruction with zero table footprint might win.

None of those apply to our workload: large contiguous buffers, one file at a time, plenty of L1 for the table.

### Takeaway

"Hardware accelerated" doesn't automatically mean faster. It means the per-instruction cost is low. But if the instruction creates a serial dependency chain that starves the out-of-order engine, a software algorithm with more parallelism can win by a wide margin. Profile first. Assumptions about hardware vs software don't survive contact with a benchmark.

The full CRC32 implementation is [125 lines of Swift](https://github.com/sebsto/demo-s3-archiving/blob/main/contenders/swift/sebsto-soto/Sources/SwiftSebstoSoto/Zip/CRC32.swift). Give it a read. It's surprisingly straightforward for something that beats dedicated silicon.

### I might be wrong

Now, this is my current understanding of *why* the numbers are what they are. The measurements are solid (19× is 19×, that's not up for debate), but my explanation of the mechanism could be incomplete or off in places. Maybe the Swift-to-C boundary cost is larger than I think. Maybe someone has a pipelined multi-stream hardware CRC implementation that would close the gap.

I'd genuinely love to be proven wrong here. That's how I learn. If you see a flaw in my reasoning, or if you have a faster CRC implementation that proves the hardware path can win on this workload, please reach out on [Bluesky](https://bsky.app/profile/stormacq.com) or [Mastodon](https://awscommunity.social/@sebsto). I'll happily update this post with corrections and credit :-)

Happy hacking.

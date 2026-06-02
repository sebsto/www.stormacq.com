---
title: "Can Swift Match Rust on a Lambda Micro-Benchmark? Almost."
subtitle: "I accepted Jérémie Rodon's S3 archiving challenge: zip 15 GB in a single Lambda with 512 MB of RAM. My pure-Swift contender landed within 4% of Rust."
date: 2026-06-02 00:00:00 +0100
tags: [swift, aws, lambda, rust, serverless]
author: Seb
background: /img/posts/20260602/banner.png
images: ['/img/posts/20260602/banner.png']
---

A few weeks ago, Jérémie Rodon published [On-Demand Archives on S3](https://rustysl.com/en/blog/s3-on-demand-archive), a detailed write-up of a Rust Lambda that downloads 3,000 objects (15 GB) from S3, streams them into a ZIP archive, and uploads the result. All within a 512 MB arm64 Lambda, in about 215 seconds.

At the end of the article, he threw down the gauntlet: "do you think you can do better with your favorite language?" And in a footnote, he added: "Ok Seb, I'll grant you that Swift would probably do the job just fine!"

Challenge accepted.

### The Rules

Same Lambda configuration as the Rust reference: 512 MB RAM, arm64, 600-second timeout, `provided.al2023` runtime. Same 3,000-object bucket in eu-west-3. Same benchmark harness (a Step Function that runs both contenders side by side and reports wall-clock time and cost). No parallel fan-out tricks. One Lambda, one invocation, streaming end to end.

Paul Santus wrote [an interesting alternative](https://dev.to/aws-builders/s3-zipper-challenge-a-parallel-zip-assembly-that-beats-the-single-lambda-approach-37gf) that fans out across multiple Lambdas using Step Functions Distributed Map. That's a different (and valid) philosophy: trade simplicity for wall-clock speed. My goal was different. I wanted to see how close Swift could get to Rust on identical hardware, under the single-Lambda constraint.

### The Result

Ten sequential runs, Swift and Rust invoked back to back on the same configuration:

| | Min | Median | Max | Mean | σ |
|---|---|---|---|---|---|
| Swift (s) | 212.4 | 219.5 | 237.6 | 223.3 | 9.13 |
| Rust (s) | 210.4 | 211.6 | 211.9 | 211.3 | 0.52 |

The best Swift run was 0.7 seconds slower than its paired Rust run. The median is 1.04x Rust. Mean cost is about 5.7% higher.

Rust is metronomic (standard deviation of 0.52 seconds across 10 runs). Swift is more variable (9.13 seconds), and the variance correlates with sandbox cold-vs-warm placement. At 1024 MB, Swift's variance drops to 0.79 seconds and matches Rust. But 512 MB is the cost sweet spot, so that's where I stayed.

### What Made It Work

Three design decisions mattered most.

**Soto, not the official AWS SDK for Swift.** I measured both. Same application code, same pipeline, same everything. With [Soto](https://github.com/soto-project/soto) (community SDK built on SwiftNIO): 250 seconds. With [aws-sdk-swift](https://github.com/awslabs/aws-sdk-swift) (official SDK built on aws-crt-swift): it hits the 600-second timeout. The gap is at the HTTP transport layer. `S3.uploadPart` takes 200 ms per call on Soto versus 680 ms on the official SDK. With 1,500 parts per archive, that single difference is the entire budget.

**NIO ByteBuffer end to end.** `Foundation.Data` looks like "an array of bytes" but it reallocates on every append and forces copies at every SDK boundary. `ByteBuffer` gives you one contiguous allocation, reader/writer indices, and zero-copy upload via `AWSHTTPBody(buffer:)`. Switching from Data to ByteBuffer on the upload path alone eliminates about 15 GB of avoidable memcpys per run.

**Pure-Swift CRC32 instead of ARM hardware intrinsics.** Counter-intuitive, but the slicing-by-8 table lookup issues 8 parallel memory accesses per iteration. On a 0.29 vCPU Lambda where the out-of-order core has spare memory ports, that beats the serial dependency chain of `__crc32d` instructions. Measured: 4 ms per 5 MB file in pure Swift versus 76 ms with the intrinsic path.

### The Architecture

A three-stage streaming pipeline. Download, zip, upload. Three sibling `async let` children of one task. Backpressure via a 20 MiB byte semaphore on downloads, a 2-chunk ceiling on the producer buffer, and a 3-slot cap on concurrent uploads. Peak memory stays around 390 MB. The whole thing is about 1,200 lines of Swift 6 strict concurrency code, no C, no native dependencies beyond SwiftPM packages.

The ZIP encoder is hand-rolled (150 lines). ZIPFoundation needs a URL or full-Data backing, which is incompatible with streaming 15 GB that can't fit in /tmp.

Full design and code: [github.com/RustyServerless/demo-s3-archiving/tree/main/contenders/swift](https://github.com/RustyServerless/demo-s3-archiving/tree/main/contenders/swift)

### What I Learned

Swift is viable for this class of problem. Not "viable with caveats." Actually competitive. The 4% gap on median comes down to cold-start variance, not application-level performance.

The official AWS SDK for Swift is the bottleneck, not the language. If the SDK team ships a ByteBuffer-native upload path and moves off the CRT HTTP layer, the gap to Rust would likely close further. Until then, Soto is the right choice for high-throughput Lambda workloads.

Structured concurrency made the pipeline straightforward to write and reason about. TaskGroups for bounded fan-out, actors for shared state, AsyncStreams for inter-stage queues. No locks, no manual thread management.

And one more thing™️. The 42 commits on the PR tell the real story. This was not a clean first-try success. It was a weekend of measuring, reverting, probing, and iterating. I bumped the byte budget and OOM'd. I tried hardware CRC and it was slower. I switched SDKs halfway through. Performance work is never linear.

The [PR is here](https://github.com/RustyServerless/demo-s3-archiving/pull/1) if you want to see the full journey.

Happy hacking.

---
title: "One Swift Codebase for iOS and Android with Skip"
subtitle: "What I learned shipping the same SwiftUI app on eight screens from a single repository"
date: 2026-08-14
tags: ["Swift", "Android", "Skip", "SwiftUI", "Maxi 80"]
draft: false
author: Seb
background: /img/posts/20260814/banner.png
images: ['/img/posts/20260814/banner.png']
---

Maxi80 is a French radio station that plays 80s music. I wrote its first iOS app in 2010 in Objective C, then an Android version a few years later in Kotlin with [ExoPlayer](https://developer.android.com/media/media3/exoplayer). That gave me two codebases in two languages, with two sets of platform APIs to keep up with. This is a side project, and I never took the time to modernize either one. The last Android release was in 2021 and the last iOS release was in 2020.

Every feature meant writing it twice, on evenings I didn't have. So in June I started over with [Skip](https://skip.tools), which lets you run Swift and SwiftUI on Android. Two months later, both apps ship from one repository: about 9,300 lines of Swift, 5,300 lines of tests, and 820 lines of Kotlin for the Android activity lifecycle and media service. Eight screens come out of that: iPhone, iPad, Mac, Apple TV, CarPlay, Android phone, Android TV, and Android Auto.

You can install it from the [App Store](https://apps.apple.com/app/id335551519) or [Google Play](https://play.google.com/store/apps/details?id=com.stormacq.android.maxi80), and the code is open source at [maxi80-com/maxi80-app](https://github.com/maxi80-com/maxi80-app).

Polymarket [wrote about doing this at scale](https://forums.swift.org/t/our-android-app-is-written-in-swift/88778). This is the same story, told by one developer working evenings. Here's what worked and the three places where the abstraction leaked.

## How the code is split

The app is made of three modules, and each one uses a different Skip mode.

The SwiftUI views, the view model, and the coordinator compile natively on both platforms. The [Swift SDK for Android](https://www.swift.org/android-workgroup/) cross-compiles the same Swift into a native library that the Android app loads. The audio players use AVPlayer on Apple and ExoPlayer on Android. The Android side is written is Swift and transpiled to Kotlin. The Apple player compiles natively like the rest of the UI.

Between the two sits the model layer, which holds the data types, the JSON decoding, and the client that talks to the backend: the station name, the catchphrase, the audio stream URL, the recent history, and the album covers. On the other end of that client sits an AWS Lambda function, also written in Swift with the [AWS Lambda Runtime for Swift](https://github.com/awslabs/swift-aws-lambda-runtime) and open source at [maxi80-backend-swift](https://github.com/maxi80-com/maxi80-backend-swift). The entire stack from the lock screen to the API is written in one language.

The model layer is the part I'm happiest about. It shared data transfer objects between the client and the backend. These are the same structs, the same decoding, and the same tests run on iOS and Android, so a bug there is one bug in one place. The compromises live at the seam between native and transpiled code: there are no reactive bindings across that boundary. The consequence is that the audio players report song changes through plain old callbacks instead of data binding.

## What actually broke

There are a few things that caught me out of guard during the development:

**SwiftUI compiles on iOS and still breaks on Android.** Some modifiers are missing, some quietly expect a different type, and one of them crashed at launch instead of failing at build time. Icons have the same gaps: Skip maps a few dozen SF Symbols onto Material icons and draws the rest as a warning triangle, including the pause icon. The semantic text colors ignore a forced dark scheme, so my song titles spent a week rendered as dark gray on a dark background. Worse, the compilation condition (`#if SKIP_BRIDGE`)I used to hide Apple-only code isn't defined on Android, so every guard I trusted was letting that code through (tip: use `#if os(Android)` instead). A green build on iOS tells you nothing about Android, so I install on a simulator or real device before I call a screen done.

**Android's media stack is not AVFoundation with different names.** Android only publishes the lock screen player when playback goes through its media session, and I was driving the player object directly. The result was that the app showed the current song correctly while the phone's own lock screen and notification area showed nothing at all. Pause was a second surprise: pausing a live stream keeps buffering audio that nobody will ever hear. On Android, pause has to mean stop, while keeping enough state that the notification doesn't fall apart.

**Compose owns the frame and the layout, not me.** Two state changes I make together don't always land in the same frame, so a label that changes its text and its color at once can visibly tear. Animations that I start on the Swift side don't always carry across exactly the same to Android. A shadow behind nine album covers was costing 115 ms per frame on a cheap Samsung A07, so Android gets a much smaller shadow now.

The worst problem took three attempts to solve. Rotating the phone would reset my cover carousel to the oldest album instead of the current song. The carousel was built on a `ScrollView`, and Compose relayout on rotation is late and authoritative, so every fix that I wrote to restore the scroll offset afterwards the rotation got overwritten. Because of that, the Android app shipped for two weeks with rotation locked, which was my way to admit my defeat.

What eventually worked was deleting the scroll view entirely. Every cover's position is now computed from which album is selected, so the selection is centered by construction and a relayout simply recomputes it. The bug wasn't in Skip or Compose: it was me keeping UI state somewhere that Android is allowed to throw away.

## The feedback loop is better on iOS

On Apple platforms, the compiler tells me most of what I need to know. On Android, it tells me almost nothing.

Skip can run my test suite against the transpiled Kotlin using [Robolectric](https://robolectric.org/), but that harness has never worked in this project, and simulating Android isn't the same as running on it anyway. Everything real was found on a 120€ Samsung A07.

Two evenings went to problems that the build itself created. The first time, I added log lines to chase a bug, saw nothing new in the output, and went looking in the wrong place. Gradle's incremental build had decided that nothing changed and skipped the Skip transpile step, so my new Swift was never re-transpiled into Kotlin. The APK I installed still contained the previous transpiled code, and my log lines simply weren't in it.

The second time, the app crashed on launch, but only in the build I upload to Google Play. That build shrinks the app by deleting code that nothing appears to reference. Skip bridges Swift and Kotlin by looking classes up by name, written as plain strings, so the shrinker saw no reference and deleted one. Adding one line in the ProGuard rules fixed it. The debug build I'd tested all week never had this problem, because debug builds don't shrink. Testing the debug build is not the same as testing the app you ship.

## What this taught me about coding with agents

I built this with AI coding agents, using the same workflow I [described in March](https://stormacq.com/2026/03/31/what-i-learned-building-real-projects-with-ai-coding-agents/): a spec per feature, a plan, steering docs, and written memory.

The iOS app came up fast and was nearly bug-free. The Android side took days of experimentation for features I'd already shipped on Apple. I used the same tools and the same models in both cases, so the difference was my own experience. On iOS I knew what good looked like, so I caught bad architecture in the plan before it reached production. On Android I was learning, and it shows in the design decisions and the code quality of the early commits. Agents amplify what you know, but they don't replace it.

Would I do it again? Yes. The iOS app came together quickly, and Android followed shortly after from the same code. The challenges are real but they are countable. This isn't write-once-run-anywhere. You get the language, the model layer, the concurrency, and most of the UI, but you still have to learn Android app architecture and design.

The whole thing is on [GitHub](https://github.com/maxi80-com) if you want to see how it fits together. If you're on the Skip team, or if you're running Swift on Android too, I'd love to hear from you, especially about the parts I got wrong.

Happy coding.

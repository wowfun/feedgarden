---
publish: true
content_type: "post"
title: "MXC: A cross-platform sandboxed code execution system for untrusted code"
description: "MXC is an SDK-based sandboxed code execution system for running untrusted code — model output, plugins and tools — on Windows, Linux and macOS. It wraps multiple containment backends behind a unified containment model and typed SDKs, so ..."
date: "2026-10-09T05:51:29.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/microsoft/mxc"
discussion_url: "https://news.ycombinator.com/item?id=50016489"
tags: ["source/hackernews","topics/agents","topics/security-privacy","topics/open-source"]
---

## Article

MXC is an SDK-based sandboxed code execution system for running untrusted code — model output, plugins and tools — on Windows, Linux and macOS. It wraps multiple containment backends behind a unified containment model and typed SDKs, so an application can describe what it wants isolated rather than hand-rolling platform-specific isolation.

Applications specify three things: the container type, the containment rules, and the workload command. MXC validates the request, selects a backend, and launches the workload. Containers are created from versioned JSON container-creation requests and security policies, and support lifecycle operations — provision, start, execute, stop and deprovision — for persistent containers.

Supported backends include ProcessContainer &#40;the default&#41;, Windows Sandbox, LXC, Bubblewrap, Seatbelt, MicroVM &#40;Nanvix&#41;, Hyperlight, IsolationSession and WSLC. Defaults are platform-appropriate: ProcessContainer on Windows, Bubblewrap on Linux and Seatbelt on macOS; several Windows options &#40;windows&#95;sandbox, microvm, hyperlight&#41; are marked experimental.

Policy is organized into three areas: filesystem policy &#40;read-only, read-write and denied path lists&#41;, network policy &#40;proxy support, outbound controls and backend-dependent host filtering&#41; and UI policy &#40;clipboard, display and GUI access controls&#41;.

MXC ships Rust, .NET and Node SDKs with versioned APIs; the Node and .NET packages bundle native runtime assets, while the Rust crate builds the SDK, engine and selected backends into the consuming application. It is a dependency that builds into your app rather than a service. SDK packages are on crates.io, NuGet and npm, and you do not need to clone the repository. Platform-specific executor binaries such as wxc-exec.exe accept the same JSON requests for testing or when the SDK cannot be embedded.

Diagnostics include a --debug flag for MXC diagnostic output and a logging access-denied mode for safe deny-and-record analysis. The documentation warns that --audit turns off all sandbox security for the workload being analyzed and must never be used to run untrusted code; it exists to help policy authors reconstruct a ProcessContainer policy granting the files and capabilities a trusted tool actually needs. The source notes that applications will hit access issues until containment rules are tuned.

## HN discussion

Based on 10 selected comments and replies.

Commenters were broadly positive about the project. One called it decent even if it is essentially a frontend/SDK over Bubblewrap, Seatbelt and ProcessContainer, arguing that setting those up consistently is far from trivial and hand-rolling isolation is a bad idea; they also liked the learning mode, the MIT license, the telemetry disclosures and the readable docs.

Dissenting or qualifying notes focused on gaps and engineering costs. One commenter flagged that fine-grained networking — allow/deny by hostname or by IP, CIDR, port or protocol — exists for Windows and Linux but is missing on macOS, calling it the general challenge of abstracting over different technologies. Another asked whether any of these sandboxes supports dynamic, revocable permission grants starting from a minimal sandbox, and complained that harnesses block agent execution waiting for decisions; a reply pointed to nono.sh as partly addressing this after a sandboxed command ends.

Others questioned adoption and quality. One said they would stick with their own scripted approach &#40;smolvm launching an instance per task&#41;, though a reply claimed smol machines supports the same host and CIDR network controls cross-platform. On size, a commenter cited roughly 350,000 mostly-Rust SLOC as too much to grasp; a reply disputed the figure, saying the counting tool misparses Rust comments and the cited file is closer to 1,465 SLOC plus tests, while also criticizing a single-contributor alternative for basic tests and security bugs. A developer evaluating the Rust SDK said the API looks nice but flagged bundled binaries in the build script, Windows-exclusive build steps running on all platforms, backend feature-gating causing build-script work that may break on future Cargo versions, and heavy dependencies.

Selected comments: [dannyw](https://news.ycombinator.com/item?id=50017836) · [simonw](https://news.ycombinator.com/item?id=50019972) · [neobrain](https://news.ycombinator.com/item?id=50018893) · [LeBit](https://news.ycombinator.com/item?id=50018519) · [kernc](https://news.ycombinator.com/item?id=50018330) · [epage](https://news.ycombinator.com/item?id=50019358)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50016489>)

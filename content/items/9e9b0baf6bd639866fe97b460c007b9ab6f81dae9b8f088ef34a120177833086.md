---
publish: true
content_type: "post"
title: "Do Blackwell GPUs have PCIe 5 issues?"
description: "A user with a 3090, 4090 and 2080ti running long, stable compute-heavy workloads bought a 5070ti and found it worked reasonably well until a 6-hour CUDA job. Near the end of that job the system crashed with the journal message: \"NVRM: krcWa"
date: "2026-10-08T19:18:04.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0zzvg/blackwell_gpus_have_pcie5_issues/"
tags: ["source/reddit","topics/hardware","topics/inference","topics/security-privacy"]
---

A user with a 3090, 4090 and 2080ti running long, stable compute-heavy workloads bought a 5070ti and found it worked reasonably well until a 6-hour CUDA job. Near the end of that job the system crashed with the journal message: "NVRM: krcWatchdog&#95;IMPL: RC watchdog: GPU is probably locked&#33; Notify Timeout Seconds: 7".

They could not reproduce the failure, and consider their own code fine. Investigation pointed to a reported Blackwell problem, which they say is treated as something to accept. They cite an article about RTX 5070, 5080 and 5090 continuing to hang from an unknown PCIe Gen 5 fault, a Reddit thread on fighting Blackwell GSP timeouts, and a thread stating Nvidia acknowledged the Blackwell XID 79 "GPU fell off the bus" issue.

Their complaint is that despite prior mentions on Reddit, there is surprisingly little noise about the problem, and that Nvidia only acknowledged it officially in the last few months. The post reports one personal repro attempt that failed, not a systematic test.

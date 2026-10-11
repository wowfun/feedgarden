---
publish: true
content_type: "post"
title: "Blackwell 显卡有 PCIe 5 问题吗？"
description: "一位拥有 3090、4090 和 2080ti 并长期稳定运行高强度计算负载的用户购买了一块 5070ti，起初运行还算正常，直到一次长达 6 小时的 CUDA 任务。在任务接近结束时系统崩溃，系统日志显示：“NVRM: krcWatchdog_IMPL: RC watchdog: GPU is probably locked! Notify Timeout Seconds: 7”。 他无法复现该故障，并认为自己的代码没有问题。排查结果指向一个已知的 Blackwell 问题"
date: "2026-10-08T19:18:04.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0zzvg/blackwell_gpus_have_pcie5_issues/"
tags: ["source/reddit","topics/hardware","topics/inference","topics/security-privacy"]
---

一位拥有 3090、4090 和 2080ti 并长期稳定运行高强度计算负载的用户购买了一块 5070ti，起初运行还算正常，直到一次长达 6 小时的 CUDA 任务。在任务接近结束时系统崩溃，系统日志显示：“NVRM: krcWatchdog&#95;IMPL: RC watchdog: GPU is probably locked&#33; Notify Timeout Seconds: 7”。

他无法复现该故障，并认为自己的代码没有问题。排查结果指向一个已知的 Blackwell 问题，他称这个问题似乎只能被动接受。他引用了一篇关于 RTX 5070、5080 和 5090 因未知 PCIe Gen 5 故障持续卡死的文章、一个关于 Blackwell GSP 超时问题的 Reddit 讨论帖，以及一个称 Nvidia 已承认 Blackwell XID 79“GPU fell off the bus”问题的帖子。

他的不满在于：尽管 Reddit 上此前有人提及，但该问题的讨论热度出乎意料地低，而 Nvidia 直到最近几个月才正式承认。帖中所述仅是一次未能复现的尝试，并非系统性测试。

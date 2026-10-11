---
publish: true
content_type: "post"
title: "Show HN：面向 AI 编程智能体的 Crashlytics"
description: "xcrashlytics 是一款 macOS 命令行工具，让开发者和编程智能体都能访问 Firebase Crashlytics 以及本地 Xcode Organizer 的崩溃报告。其出发点是：仅有堆栈信息无法说明崩溃的影响范围或由哪个版本引入，而智能体也无法调查它没看到的证据。该工具支持 iOS、Android、macOS 及其他使用 Crashlytics 的应用；在 iOS 上还可读取 Xcode 已下载的报告。 预期的工作流程分为三步：定位问题、追踪堆栈、衡量影响。"
date: "2026-10-08T18:33:49.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/0xfirattamur/xcrashlytics"
discussion_url: "https://news.ycombinator.com/item?id=50009985"
tags: ["source/hackernews","topics/coding","topics/agents","topics/products"]
---

## 正文提炼

xcrashlytics 是一款 macOS 命令行工具，让开发者和编程智能体都能访问 Firebase Crashlytics 以及本地 Xcode Organizer 的崩溃报告。其出发点是：仅有堆栈信息无法说明崩溃的影响范围或由哪个版本引入，而智能体也无法调查它没看到的证据。该工具支持 iOS、Android、macOS 及其他使用 Crashlytics 的应用；在 iOS 上还可读取 Xcode 已下载的报告。

预期的工作流程分为三步：定位问题、追踪堆栈、衡量影响。可按功能、错误或版本检索问题。计数与排序只覆盖你选定的时间窗口，而非生命周期总量；配合 --by-day 与 JSON 输出，可从 Crashlytics 报告中获得每日事件数。也可以逐个检查事件，--app-frames-only 会把输出限制为应用自身的堆栈帧，包括配置文件中指定的第一方库。

安装方式包括：一段 curl 脚本，安装到 &#126;/.local/bin、校验 SHA-256 且无需 sudo；通过 tap 0xfirattamur/xcrashlytics 使用 Homebrew，因 Homebrew 默认拒绝不受信任的第三方 tap，每台机器需执行一次 brew trust；直接下载 macOS 通用压缩包及其配套的 .sha256 文件；或用 swift build -c release 从源码构建。此外还需要 Firebase CLI。初始化会先执行 firebase login，再运行 xcrashlytics init --scan，该命令会发现应用并写入 .xcrashlytics.json；当发现多个应用时，用 xcrashlytics use 选择配置。认证复用 Firebase CLI 的登录，而无需 gcloud。

作者明确限定了工具范围：CLI 只负责获取崩溃证据并导出 Markdown 报告或结构化 JSON 供团队共享，不会替你诊断或修复代码。还可以把一段说明粘贴给编程智能体，让它完成安装与配置、把使用指引写入仓库的智能体说明文件，并以 JSON 列出最主要的问题。这些命令在终端中直接使用同样可行，无需智能体。

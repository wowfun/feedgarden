---
publish: true
content_type: "post"
title: "MXC：面向不可信代码的跨平台沙箱化代码执行系统"
description: "MXC 是一套基于 SDK 的沙箱化代码执行系统，用于在 Windows、Linux 和 macOS 上运行不可信代码，例如模型输出、插件和工具。它把多种隔离后端统一到一套隔离模型和带类型的 SDK 之下，让应用只需描述需要隔离什么，而不必自行拼装各平台的隔离方案。 应用需要指定三件事：容器类型、隔离规则和工作负载命令。MXC 会校验请求、选择后端并启动工作负载。容器由带版本的 JSON 容器创建请求和安全策略生成，并支持持久容器的生命周期操作——创建、启动、执行、停止..."
date: "2026-10-09T05:51:29.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/microsoft/mxc"
discussion_url: "https://news.ycombinator.com/item?id=50016489"
tags: ["source/hackernews","topics/agents","topics/security-privacy","topics/open-source"]
---

## 正文提炼

MXC 是一套基于 SDK 的沙箱化代码执行系统，用于在 Windows、Linux 和 macOS 上运行不可信代码，例如模型输出、插件和工具。它把多种隔离后端统一到一套隔离模型和带类型的 SDK 之下，让应用只需描述需要隔离什么，而不必自行拼装各平台的隔离方案。

应用需要指定三件事：容器类型、隔离规则和工作负载命令。MXC 会校验请求、选择后端并启动工作负载。容器由带版本的 JSON 容器创建请求和安全策略生成，并支持持久容器的生命周期操作——创建、启动、执行、停止和销毁。

支持的后端包括 ProcessContainer（默认）、Windows Sandbox、LXC、Bubblewrap、Seatbelt、MicroVM（Nanvix）、Hyperlight、IsolationSession 和 WSLC。默认值随平台而定：Windows 上用 ProcessContainer，Linux 上用 Bubblewrap，macOS 上用 Seatbelt；其中若干 Windows 选项（windows&#95;sandbox、microvm、hyperlight）被标注为实验性。

策略分为三个方面：文件系统策略（只读、读写和拒绝的路径列表）、网络策略（代理支持、出站控制和依赖后端的主机过滤）以及 UI 策略（剪贴板、显示和 GUI 访问控制）。

MXC 提供 Rust、.NET 和 Node 三套带版本化 API 的 SDK；Node 和 .NET 包内置原生运行时资源，而 Rust crate 会把 SDK、引擎和所选后端一并编译进使用方应用。它是编译进应用的依赖，而不是一个服务。SDK 包发布在 crates.io、NuGet 和 npm 上，无需克隆仓库。像 wxc-exec.exe 这样的平台专用执行器二进制接受同样的 JSON 请求，可用于测试，或用于无法嵌入 SDK 的场景。

诊断方面提供 --debug 参数以输出 MXC 诊断信息，以及记录访问拒绝日志的模式用于安全的“拒绝并记录”分析。文档提醒：--audit 会关闭被分析工作负载的全部沙箱安全性，绝不能用来运行不可信代码；它的用途是帮助策略作者重建一份 ProcessContainer 策略，授予受信任工具真正需要的文件和能力。原文也指出，在隔离规则调优到位之前，应用会遇到访问问题。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者总体上持正面态度。一位评论者认为它相当不错，即使本质上只是 Bubblewrap、Seatbelt 和 ProcessContainer 的前端/SDK，因为一致地配置这些工具远非易事，而自行手搓隔离方案是糟糕的主意；他还欣赏其“学习”模式、MIT 许可证、明确的可选遥测披露以及尚可读的文档。

质疑与补充意见集中在功能缺口和工程成本上。一位评论者指出，细粒度网络控制——按主机名或按 IP、CIDR、端口、协议放行或拒绝——在 Windows 和 Linux 上已有，但在 macOS 上缺失，并称这是对多种技术做抽象层时普遍面临的难题。另一位询问是否有沙箱支持从最小权限起步、随后动态且可撤销地授予权限，并抱怨现有 harness 在等待决策时会阻塞智能体执行；有人回复称 nono.sh 部分朝这个方向努力，可在沙箱命令结束后补充权限。

也有人质疑采用价值与代码质量。一位评论者表示会继续用自己的脚本方案（用 smolvm 为每个任务启动实例），但有回复称 smol machines 已跨平台支持同样的主机与 CIDR 网络控制。关于体量，有人引用约 35 万行“以 Rust 为主”的代码，认为难以理解；回复者反驳该数字，称统计工具无法正确解析 Rust 注释，所指文件实际约 1,465 行 SLOC 加测试代码，同时批评某个单贡献者替代项目只有基础冒烟测试并存在安全问题。一位评估 Rust SDK 的开发者称其 API 看起来不错，但指出构建脚本中夹带二进制、Windows 专属构建步骤在所有平台执行、后端特性开关导致更多构建脚本工作（未来 Cargo 版本可能失效）以及依赖过重。

评论来源：[dannyw](https://news.ycombinator.com/item?id=50017836) · [simonw](https://news.ycombinator.com/item?id=50019972) · [neobrain](https://news.ycombinator.com/item?id=50018893) · [LeBit](https://news.ycombinator.com/item?id=50018519) · [kernc](https://news.ycombinator.com/item?id=50018330) · [epage](https://news.ycombinator.com/item?id=50019358)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50016489>)

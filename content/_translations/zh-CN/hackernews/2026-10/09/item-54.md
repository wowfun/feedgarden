---
publish: true
content_type: "post"
title: "Veda：用 Rust 从零构建的智能体原生操作系统"
description: "Veda 是一个把 AI 智能体当作系统一等公民、而非事后附加助手的操作系统。作者指出，操作系统的设计前提是“键盘前坐着一个人”，因此后来加上的助手往往只能读屏、模拟点击，或依赖少数提供 API 的应用，系统对其行为也无从约束。Veda 反其道而行：智能体是一个系统服务，开机即启动、崩溃即重启，在任务栏上表现为一个小圆环，处于休眠状态，直到被名字、点击或 Super+Space 唤起。 每个应用都与智能体原生通信。应用以带类型参数和风险等级的方式描述自己的动作，以结构化状态上"
date: "2026-10-08T19:35:13.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/vahmoh25/Veda"
discussion_url: "https://news.ycombinator.com/item?id=50010881"
tags: ["source/hackernews","topics/agents","topics/hardware","topics/coding"]
---

## 正文提炼

Veda 是一个把 AI 智能体当作系统一等公民、而非事后附加助手的操作系统。作者指出，操作系统的设计前提是“键盘前坐着一个人”，因此后来加上的助手往往只能读屏、模拟点击，或依赖少数提供 API 的应用，系统对其行为也无从约束。Veda 反其道而行：智能体是一个系统服务，开机即启动、崩溃即重启，在任务栏上表现为一个小圆环，处于休眠状态，直到被名字、点击或 Super+Space 唤起。

每个应用都与智能体原生通信。应用以带类型参数和风险等级的方式描述自己的动作，以结构化状态上报当前显示内容，并通过与键盘、鼠标相同的代码路径执行操作，因此窗口中的结果与用户亲自操作完全一致。内置应用合计提供 70 多个动作。整个系统用 Rust 从零编写并放在同一仓库中：UEFI 引导程序、基于能力的微内核、驱动、系统服务、窗口系统、工具包和应用。TCP/IP（smoltcp）、TLS（rustls）与密码学（RustCrypto）采用成熟 crate。系统可在 x86-64 PC、QEMU 和 VirtualBox 上运行。

授权由系统而非语言模型强制执行。每个动作被划分为常规、敏感或破坏性：常规动作直接执行，其余则等待用户确认。智能体服务会挂起调用直到用户作答，且只有桌面 shell 有权作答；系统通过 init 为每个程序的连接所附加的身份来识别程序。智能体在文档或应用中读到的任何内容都不能构成授权。

每段对话都以必要上下文开始：时间、屏幕上的窗口、每个应用的动作、用户告诉它的个人信息，以及上次对话如何结束。工作时它会读取应用的真实状态。记忆只保存用户明确告知的内容，绝不保存智能体自己的猜测；记忆保存在本机，用户可在设置中查看全部或全部遗忘。对话是实时且可打断的，配有回声消除和回声门，确保智能体不会听到自己，并在它说话时压低其他声音；休眠时由本机语音检测器监听，无人说话时数据不出本机。语音识别、语言模型和音色来自 Deepgram 的 Voice Agent 平台，音频已选择退出模型改进，模型、音色乃至智能体的名字都可在设置中选择。

## HN 热门讨论

根据 3 条选取的评论与回复整理。

评论者对这种“贴近底层”的做法很感兴趣，并将其与为特定 CLI 或代码仓库定制助手的思路作了对比。有人提问：既然项目面向 QEMU 这类环境，作者是否尝试过接入本地模型？该评论者认为，一个适度量化的模型（如 Qwen 3.8 Flash）或许就足以胜任启动应用、调度系统调用等工作。作者（vahmoh25）回应称这个观点很有道理，但自己才刚刚起步，并相信仍有很大的成长与成功空间。另有一条简短评论只是对项目表示赞赏。

评论来源：[tikimcfee](https://news.ycombinator.com/item?id=50018137) · [vahmoh25](https://news.ycombinator.com/item?id=50026314) · [xyzsparetimexyz](https://news.ycombinator.com/item?id=50019168)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50010881>)

## 图片与视频

- [图片: The Veda desktop, with the agent's window open](<https://github.com/vahmoh25/Veda/raw/main/docs/images/desktop.png>)
- [图片: The Text Editor with a Rust program](<https://github.com/vahmoh25/Veda/raw/main/docs/images/editor.png>)
- [图片: Files](<https://github.com/vahmoh25/Veda/raw/main/docs/images/files.png>)

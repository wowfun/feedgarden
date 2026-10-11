---
publish: true
content_type: "post"
title: "Show HN：Pocketty——iPhone 上的 SSH 终端，智能体被阻塞时通知你"
description: "Pocketty 是一款面向 iPhone 和 iPad 的 SSH 终端，围绕用于管理编程智能体会话的 herdr 构建。它的出发点是：不必守在桌前才能知道智能体什么时候需要你——应用会列出某台主机上的所有智能体和窗格（Pane），把每个标记为“工作中”“需要你”或“已完成”，并在某个窗格被阻塞或结束时通知你。 据作者介绍，客户端通过 SSH 直连你的电脑，中间没有服务器。隧道和密钥处理使用 Secure Enclave 与 Face ID，演示中出现了类似“pane w1"
date: "2026-10-08T18:11:52.000Z"
updated: "2026-10-10T06:16:53.378Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://pocketty.app/"
discussion_url: "https://news.ycombinator.com/item?id=50009634"
tags: ["source/hackernews","topics/agents","topics/products","topics/security-privacy"]
---

## 正文提炼

Pocketty 是一款面向 iPhone 和 iPad 的 SSH 终端，围绕用于管理编程智能体会话的 herdr 构建。它的出发点是：不必守在桌前才能知道智能体什么时候需要你——应用会列出某台主机上的所有智能体和窗格（Pane），把每个标记为“工作中”“需要你”或“已完成”，并在某个窗格被阻塞或结束时通知你。

据作者介绍，客户端通过 SSH 直连你的电脑，中间没有服务器。隧道和密钥处理使用 Secure Enclave 与 Face ID，演示中出现了类似“pane w1:p1 on studio”、经 Tailscale 连接的示例。通知由主机上的守护进程生成，用手机密钥以 HPKE（X25519 加 ChaCha20）封装，经 Cloudflare Worker 中转把封装后的字节转给 Apple 推送通知服务，最后在手机上解开。因此中转服务、Worker 和 Apple 都看不到窗格文本或终端输出，中转并不保存任何内容。通知功能是可选的。

终端本身是真实终端：屏幕键盘提供 Return、Esc、Ctrl 和方向键，智能体接收到的是真正的按键。文本模式可一次性发送整条消息，也支持听写和图片。从屏幕边缘滑入可查看当前智能体回合的 diff：守护进程会在智能体每次开始工作时对工作树做快照，因此你可以只看这一回合、整个会话或所有未提交改动（类似 git diff），后两种视图需要主机上的守护进程。应用还提供带语法着色的文件浏览器，支持 20 种配色方案；当某个窗格打开端口时，应用会通过 SSH 连接提供 localhost 预览，无需单独建立隧道。Pocketty 从 herdr 读取智能体状态，不会修改智能体的配置文件。若不使用 herdr，你仍能获得普通登录 shell，或用启动命令运行 tmux 和 zellij。

价格方面：14 天免费试用后，发布价为 99 美元，原价 129 美元。页面称该应用支持 herdr 认识的所有智能体；提交内容未包含独立测试数据或第三方安全审计。

## HN 热门讨论

根据 9 条选取的评论与回复整理。

评论者大多把 Pocketty 与其他方案作比较，而非评价其安全声明。一位说自己本来在找类似工具，先看到了 herdr-web-ui，称其免费、可自托管、能作为 PWA 安装并支持网页推送，且正在密集开发中。另一位推荐 Heeler，称它免费开源、适合 herdr 加 iOS 的组合，几周使用下来已经取代了手机上的 Blink Shell；同一讨论中有人附议这一推荐。一位曾用 tailscale 连到笔记本并用 TUI 的评论者说，这套方案一度很好用，但后来不再想让智能体没在工作时收到提醒。提交者回应说，现在主要用于散步、办事或突然冒出的想法，并且因为信任通知链路，不必再盯着智能体。有人问如何区分智能体是在思考还是被阻塞；提交者回答说，应用把智能体图标按状态着色：工作中为黄色、已完成绿色、被阻塞红色、闲置为灰色，还可以按状态筛选标签列表。还有一位把这一趋势概括为把智能体的聊天推送变成信息拉取式订阅，即由智能体主动联系用户，而不是用户去查看。以上只是小样本中的个人观点。

评论来源：[antoniomika](https://news.ycombinator.com/item?id=50014638) · [joshstrange](https://news.ycombinator.com/item?id=50022438) · [alyssassan](https://news.ycombinator.com/item?id=50017619) · [lukeed](https://news.ycombinator.com/item?id=50020596) · [sailfast](https://news.ycombinator.com/item?id=50014471) · [metamitya](https://news.ycombinator.com/item?id=50015729)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50009634>)

## 图片与视频

- [图片: The Changes tab with Last turn selected: one Rust file, 3 lines added and 2 removed.](<https://pocketty.app/_astro/changes.BuYlktL2_ZjWyKk.webp>)
- [图片: The diff of that file: a named constant replaces two copies of 60.](<https://pocketty.app/_astro/diff.BiXQR0GY_Z1gU4PG.webp>)
- [图片: The pocketty website, served on localhost, open in the preview.](<https://pocketty.app/_astro/preview.DTyLt12-_Z1W2Azm.webp>)

---
publish: true
content_type: "post"
title: "我几乎完全用 Claude Code 做了一个桌面应用，这是我的经历"
description: "一位同时运行多个 Claude Code 会话的开发者，老是找不到那个正等待他输入的会话，于是做了 Horadric：一款 Windows 和 macOS 应用，把每个会话显示为一个小方块，当 Claude 需要做决定时方块变成琥珀色。它免费、以 MIT 许可证发布，支持 Windows 10/11 和 macOS 11 及以上。 几乎全部代码都由 Claude Code 编写。在 Windows 上，Horadric 是纯 Rust 直接绘制到 Win32 和 Direct"
date: "2026-10-09T00:51:56.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x17tgx/i_built_a_desktop_app_almost_entirely_with_claude/"
tags: ["source/reddit","topics/coding","topics/products"]
---

一位同时运行多个 Claude Code 会话的开发者，老是找不到那个正等待他输入的会话，于是做了 Horadric：一款 Windows 和 macOS 应用，把每个会话显示为一个小方块，当 Claude 需要做决定时方块变成琥珀色。它免费、以 MIT 许可证发布，支持 Windows 10/11 和 macOS 11 及以上。

几乎全部代码都由 Claude Code 编写。在 Windows 上，Horadric 是纯 Rust 直接绘制到 Win32 和 Direct2D，不用 Electron，也不用任何 UI 框架；开着四个会话时体积约 45 MB，事件之间不占 CPU。作者表示自己不会手工接下原生 Win32 这套活。开发流程围绕每个项目的任务清单，一份纯 Markdown 勾选列表：点击某一项就针对它启动一个 Claude Code 会话，作者写下一条、会话接手、作者再审查返回结果。他把分工概括为产品该是什么由他拍板，让它存在的是 Claude。

该应用从 Claude Code 本身触发的 hooks 读取状态，而不是抓取终端来猜会话是忙还是等待，因此 Claude 一请求权限，方块状态立刻正确；保留真正的命令行作为界面，也意味着不必追着 Claude Code 自身的更新跑。目前功能包括：按项目分组的方块、Ctrl+Alt+Space（Mac 上为 Cmd+J）跳到等待最久的会话、会话开始等待时的 Windows 通知、与智能体并列的普通终端，以及在 Windows 上的浏览器面板、5 小时与每周限额显示、在多个 Claude 订阅之间切换并让会话在新订阅上恢复。Mac 版是 0.17.0 新增，具备方块、终端和可在应用退出后存活的会话，但尚无浏览器面板、任务清单和用量窗口。会话能在崩溃、更新或重启后继续存在。由于构建包尚未做代码签名，首次运行会有 SmartScreen 警告，Mac 版也尚未公证。

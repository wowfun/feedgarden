---
publish: true
content_type: "post"
title: "如果你让 Claude Code 清理智能电视，请先做这几件事"
description: "Reddit 用户针对近期“让 Claude Code 删除智能电视预装软件”的帖子，以及部分电视因此变砖的情况，整理了一份更安全的操作流程，适用于 Android 系统电视。核心要点：在手动模式下运行 Claude Code（claude --permission-mode default），逐条确认每条 adb 命令后再执行。操作前让其保存完整包列表、启用的包以及当前启动器，作为可恢复的备份。采用禁用而非卸载：pm disable-user --user 0 <pa..."
date: "2026-10-31T11:56:02.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:37:24.207Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1xk8apo/if_youre_letting_claude_code_clean_up_your_smart/"
tags: ["source/reddit","topics/agents","topics/hardware","topics/security-privacy"]
---

Reddit 用户针对近期“让 Claude Code 删除智能电视预装软件”的帖子，以及部分电视因此变砖的情况，整理了一份更安全的操作流程，适用于 Android 系统电视。核心要点：在手动模式下运行 Claude Code（claude --permission-mode default），逐条确认每条 adb 命令后再执行。操作前让其保存完整包列表、启用的包以及当前启动器，作为可恢复的备份。采用禁用而非卸载：pm disable-user --user 0 &lt;package&gt; 关闭应用，pm enable 可恢复；卸载系统包正是导致变砖的原因。用“绝不触碰”名单保护关键组件：System UI、设置、HDMI/电视输入、蓝牙与遥控配对、包安装器与 Play 商店，以及在新启动器真正可用前的当前启动器。在 Google TV 上，停用原启动器后设置向导可能抢占 Home 键，需先检查。提示词应明确型号、系统（Google TV/Android TV/Fire TV）、IP 地址和要保留的应用。对禁用无法去除的应用内广告，可在 Android 9+ 上用两条 adb settings 命令配置 Private DNS。完成后关闭 USB 与网络调试，避免在家用网络留后门。该方法适用于 Android 系列电视（Sony、TCL、Hisense、Philips、Xiaomi、onn、Chromecast）及部分 Fire TV；Samsung、LG、Roku、Vizio 无 adb 访问，Claude 只能协助设置与路由器级拦截。现成方案包括 cleanyourtv（Android/Google TV，100+ 型号列表，内置备份恢复）和 dumbtv（Fire TV）。完整步骤见 aiparabellum.com。

## 媒体

![图片: If you’re letting Claude Code clean up your smart TV, do these things first](<https://preview.redd.it/in2rj4cyksyh1.jpeg?width=640&crop=smart&auto=webp&s=4d15d4fe5e434936aa634c80796a23e41276f4e0>)

[图片: If you’re letting Claude Code clean up your smart TV, do these things first](<https://preview.redd.it/in2rj4cyksyh1.jpeg?width=640&crop=smart&auto=webp&s=4d15d4fe5e434936aa634c80796a23e41276f4e0>)

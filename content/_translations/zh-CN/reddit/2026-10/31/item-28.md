---
publish: true
content_type: "post"
title: "Claude Code 在廉价 Android 电视棒上发现 root 后门，随后通过 USB 将主线 Linux 移植到该设备，Sonnet 负责构建、Opus 负责审计，每一步在接触硬件前都经过审核"
description: "一名 Reddit 用户购买了一台基于 Allwinner H618 的无名 “DQ10” Android 电视棒，并让 Claude Code 将其重新刷写为干净固件并确保安全。大约两天后，该电视棒从自己的 eMMC 启动了主线 U-Boot 与 Armbian（内核 6.18.53），出厂 Android 被完全清除，原固件被证实含恶意软件；Wi-Fi 可用，SSH 仅允许密钥登录。用户没有焊接，也没有串口控制台，只负责插拔线缆、按住按钮和读取电视画面，技术工作由 ..."
date: "2026-10-30T22:49:05.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:38:28.082Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1xjtuwx/claude_code_found_a_root_backdoor_on_my_cheap/"
tags: ["source/reddit","topics/coding","topics/hardware","topics/linux"]
---

一名 Reddit 用户购买了一台基于 Allwinner H618 的无名 “DQ10” Android 电视棒，并让 Claude Code 将其重新刷写为干净固件并确保安全。大约两天后，该电视棒从自己的 eMMC 启动了主线 U-Boot 与 Armbian（内核 6.18.53），出厂 Android 被完全清除，原固件被证实含恶意软件；Wi-Fi 可用，SSH 仅允许密钥登录。用户没有焊接，也没有串口控制台，只负责插拔线缆、按住按钮和读取电视画面，技术工作由 Claude Code 完成。脚本、设备树、刷写器、运行手册、审计记录和恶意软件 IOC 已发布在 GitHub 仓库中。工作流在 Windows 上运行 Claude Code CLI，配合 Git Bash、Kali WSL2 发行版和 usbipd-win，将电视棒的 USB 透传进 WSL。既定规则是“用 Sonnet 写代码，用 Opus 做审计”：主 Opus 会话负责规划、与用户沟通并直接对硬件执行命令；Sonnet 子代理负责构建 U-Boot/TF-A 配置、设备树、镜像、脚本和测试；独立的只读 Opus 子代理进行审计并写出报告。在审计通过且用户说“go”之前，不会向电视棒写入任何内容。CLAUDE.md 将决策、证据和死胡同全部记录到 Obsidian 保险库。最初入侵发现该棒声称 Android 13，实际是带有未认证 root ADB 的 userdebug Android 12，通过 Activity Launcher 打开隐藏的开发者选项，使 root adbd 监听 TCP 5555。将电视棒隔离在笔记本热点的阻断出口 iptables 链之后并完整备份 eMMC，备份中发现：厂商远程命令系统、电视棒上线第一天写入的 root 投放脚本、以及一个 11 MB 的 UPX 压缩 Go 二进制文件，其中包含以 root 启动的 NPS 反向隧道代码。用户因此决定替换整个系统而非清理；IOC 已发布，主机信息已脱敏，不含样本。四次 Opus 审计各自在全新上下文中进行，作为写入门槛：- 第一轮（GO-WITH-FIXES）：运行手册中“若 ADB 在提交期间断开则断电重启”的指令可能在写入中途砖机；借用自相似板卡的设备树禁用了 SD 卡槽；刷写后哈希校验未考虑文件系统扩容导致的变化。- 第二轮（NO-GO）：U-Boot 通过 USB（FEL）启动成功率仅 1/6，审计员拒绝为可能无路可退的引导加载器签字，转而提出零写入诊断。- 第三轮：usbipd bind 未加 --force 使 Windows 存储驱动保留磁盘，曾导致 Windows 重写分区表头部；“U-Boot 到达引导命令”测试在崩溃后可能误报通过。- 发布前审计：构建脚本会把私钥烘焙进可共享镜像；README 允许首次使用者在未验证备份的情况下直接擦除。没有 UART，Claude 将 LED 和复位时序当作调试器：微小的 U-Boot 环境覆盖让 LED 按模式闪烁，随后复位；按住按钮时复位会回到 FEL，因此“16 秒后回到 FEL”意味着 U-Boot 到达了引导命令，三次闪烁意味着 ums 启动失败。它通过 FEL 直接探测 GPIO 寄存器发现 LED 为低电平有效，并从寄存器读取推断按钮直连 Boot ROM，因此始终有退路。当 U-Boot 的 USB 大容量存储在冷启动时无法启动，它改为通过 FEL 将小型 Linux 载入 RAM，首次即成功：HDMI 控制台、Wi-Fi 扫描，再通过 configfs USB gadget 将 eMMC 暴露给 PC，最终成为刷写器。项目过程中遭遇 Claude 的 5 小时与每周用量限制，子代理中途死亡；帖子在列出最终有效做法之前就截断了。

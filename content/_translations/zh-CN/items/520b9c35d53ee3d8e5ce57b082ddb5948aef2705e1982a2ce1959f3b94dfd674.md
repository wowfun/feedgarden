---
publish: true
content_type: "post"
title: "修复：Claude Desktop 安装失败并报 0x80073CF6 与“windows.service: Access is denied”"
description: "一位用户在 ChatGPT 帮助下定位并解决了 Windows 上 Claude Desktop 的安装失败问题，并分享出来供遇到相同情况的人参考。每次安装都以 “Installation failed: AddPackage failed” 结束，在移除卡住的包之后仍报 HRESULT 0x80073CF6。旧的 Claude 包卡在 Servicing 状态，PackageUserInformation 显示为 S-1-5-18 [S-1-5-18]: Staged。 安"
date: "2026-10-09T11:24:09.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1it4r/fix_claude_desktop_installation_fails_with/"
tags: ["source/reddit","topics/coding","topics/hardware"]
---

一位用户在 ChatGPT 帮助下定位并解决了 Windows 上 Claude Desktop 的安装失败问题，并分享出来供遇到相同情况的人参考。每次安装都以 “Installation failed: AddPackage failed” 结束，在移除卡住的包之后仍报 HRESULT 0x80073CF6。旧的 Claude 包卡在 Servicing 状态，PackageUserInformation 显示为 S-1-5-18 &#91;S-1-5-18&#93;: Staged。

安装日志中出现了 “failed to remove conflicting service: could not open CoworkVMService: Access is denied”，而 Windows AppX 部署日志揭示了根本原因：错误 0x80070005，系统无法注册 windows.service 扩展，因为访问被拒绝。在本例中，旧版 Claude 安装遗留的孤立 CoworkVMService 阻止新包注册其服务。作者强调，该修复仅适用于 AppX 事件日志明确报出这一 0x80070005 拒绝错误的安装，并警告不要删除无关的服务注册表项。

文中给出五步流程。第一步确认问题：以管理员身份运行 PowerShell，列出 Claude 的 AppX 包，用 sc.exe query 查询 CoworkVMService，并在 Microsoft-Windows-AppXDeploymentServer/Operational 日志中检索包含 Claude、pzs8sxrjxfjjc 或 0x80073CF6 的消息；只有日志明确说明服务扩展注册失败才继续。第二步尝试常规卸载：使用 Stop-Service 和 sc.exe delete，作者这里即便管理员权限也报 “Access is denied”，以 SYSTEM 身份运行同样失败，因为它是 AppX 打包服务。第三步用 reg.exe export 把残留服务注册表项备份为桌面上的 .reg 文件。第四步以 SYSTEM 身份删除该孤立项：创建计划任务，执行对 HKLM&#92;SYSTEM&#92;CurrentControlSet&#92;Services&#92;CoworkVMService 的 reg.exe delete，运行它，查看输出文件（应显示操作成功完成），再删除该任务。第五步重启 Windows 并用 sc.exe query CoworkVMService 验证，应返回 FAILED 1060，即该服务已不存在。作者称此后最新版 Claude 安装程序顺利安装完成，尽管重启后旧 AppX 包仍显示为 Staged 和 Servicing。

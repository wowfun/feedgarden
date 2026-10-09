---
publish: true
content_type: "post"
title: "在 CVP 之下为 Mythos 搭建虚拟环境"
description: "一位能在 Claude Code 中使用 Mythos 5.1 的用户，想在试用之前先搭好符合要求的 VMware Workstation 环境，依据是网络安全验证计划（CVP）的安全要求文章和面向参与者的智能体隔离最佳实践文章。他先问是否已经有人做过这些工作、有经过验证、可以直接复用的配置。 在与 Opus 5.5 讨论后，方案是一台网关虚拟机，他这里用 Ubuntu，配双网卡：一块接 LAN 网段，一块走 NAT 或桥接，并在其上运行 Squid 作为代理。只有 LAN "
date: "2026-10-09T00:53:18.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x17uhf/setting_up_a_virtual_environment_for_mythos_under/"
tags: ["source/reddit","topics/security-privacy","topics/agents","topics/coding"]
---

一位能在 Claude Code 中使用 Mythos 5.1 的用户，想在试用之前先搭好符合要求的 VMware Workstation 环境，依据是网络安全验证计划（CVP）的安全要求文章和面向参与者的智能体隔离最佳实践文章。他先问是否已经有人做过这些工作、有经过验证、可以直接复用的配置。

在与 Opus 5.5 讨论后，方案是一台网关虚拟机，他这里用 Ubuntu，配双网卡：一块接 LAN 网段，一块走 NAT 或桥接，并在其上运行 Squid 作为代理。只有 LAN 网段上再放一台独立的 Kali 虚拟机指向该代理，以及按需增加的若干台服务器来托管应用。非网关虚拟机在初始配置阶段会临时切到 NAT。Opus 已经生成了在虚拟机内部完成相关配置的脚本，但作者表示这套东西还很初步。

他指出，最佳实践里点名的是 Hyper-V，而他个人更偏好 VMware Workstation，其他虚拟机本来也放在上面。他认为除需手工创建虚拟交换机之外，其余思路应该是可迁移的。帖中没有给出已验证的配置或答复。

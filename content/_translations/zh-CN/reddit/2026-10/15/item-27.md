---
publish: true
content_type: "post"
title: "工程师质疑缺乏编程经验者发布面向公众的密码管理器"
description: "一位软件工程师指出，一个名为 KAPEVault 的开源密码管理器以可下载的 Windows 和 Android 应用形式公开发布，而作者据其描述几乎没有编程经验。该软件用于保存密码、两步验证码、API 密钥和政府证件信息。 这位同样使用 AI 编程工具的工程师区分了“为学习而开发”与“分发可能被真实用户托付银行凭据的软件”。他肯定了项目的一些优点：开源、有书面威胁模型、自动化测试和自行完成的安全审查；同时指出仓库也明确承认尚未经过第三方安全审计。 其核心论点是：AES..."
date: "2026-10-15T01:19:08.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:06:23.435Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x68om1/weve_reached_the_point_where_people_with/"
tags: ["source/reddit","topics/security-privacy","topics/coding","topics/open-source"]
---

一位软件工程师指出，一个名为 KAPEVault 的开源密码管理器以可下载的 Windows 和 Android 应用形式公开发布，而作者据其描述几乎没有编程经验。该软件用于保存密码、两步验证码、API 密钥和政府证件信息。

这位同样使用 AI 编程工具的工程师区分了“为学习而开发”与“分发可能被真实用户托付银行凭据的软件”。他肯定了项目的一些优点：开源、有书面威胁模型、自动化测试和自行完成的安全审查；同时指出仓库也明确承认尚未经过第三方安全审计。

其核心论点是：AES-256-GCM 和 scrypt 本身并不能让密码管理器变安全，界面精美、测试通过或让 AI 审查自己的输出，都不能替代对攻击面的理解、密钥的正确处理和对边界情况的预判。他声明自己并未审计该项目，也不断言它不安全；真正的担忧是作者对自己尚未完全掌握的安全关键软件所表现出的自信，以及代码可以外包给 AI、责任却无法外包这一点。

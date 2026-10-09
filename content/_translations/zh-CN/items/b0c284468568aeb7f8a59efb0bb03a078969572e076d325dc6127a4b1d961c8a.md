---
publish: true
content_type: "post"
title: "别再向 Claude 发送私人信息（开源工具）"
description: "一位 Reddit 用户发布了 Redacto：一款免费的开源工具，用于在把文件交给 AI 助手之前先清除其中的个人信息。作者认为，聊天机器人并不需要知道真实姓名或账号，也能帮助用户理解文档。机制上，一个小型 AI 模型在浏览器中运行，并与模式匹配配合，用于标记姓名、地址、邮箱等可识别信息。用户检查识别结果、修补漏检项，然后导出脱敏副本。支持 PDF、Word、Excel、CSV、图片和文本。文本中可以使用统一标签，如带序号的 PERSON 占位符；PDF 则在导出页面中永久"
date: "2026-10-09T11:24:37.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1itfk/stop_sending_private_information_to_claude_open/"
tags: ["source/reddit","topics/security-privacy","topics/products","topics/coding"]
---

一位 Reddit 用户发布了 Redacto：一款免费的开源工具，用于在把文件交给 AI 助手之前先清除其中的个人信息。作者认为，聊天机器人并不需要知道真实姓名或账号，也能帮助用户理解文档。机制上，一个小型 AI 模型在浏览器中运行，并与模式匹配配合，用于标记姓名、地址、邮箱等可识别信息。用户检查识别结果、修补漏检项，然后导出脱敏副本。支持 PDF、Word、Excel、CSV、图片和文本。文本中可以使用统一标签，如带序号的 PERSON 占位符；PDF 则在导出页面中永久烙上黑框。项目声明没有账号、没有上传、没有追踪，并且在模型与应用资源加载完成后还可以离线使用。作者也指出一个重要局限：检测并不完美，分享前务必复核输出。工具以网页形式提供，代码公开，作者也希望获得关于漏检项的反馈。帖子特意围绕 Claude 提出，但所描述的流程同样适用于任何接收上传文档的助手。

---
publish: true
content_type: "post"
title: "向网站上传大量文档的工作流程"
description: "一位用户描述了把大约 150 份员工认证文档上传到需要文件上传功能的 SaaS 产品的流程。Claude 桌面版负责重命名和整理文件并准备表单数据，实际上传必须由 Claude in Chrome 完成，因为桌面版无法上传。 目前的流程包含两次交接。桌面版重命名、整理并按每批 20 份分好文档——帖中称 20 是 Claude in Chrome 的上限——同时生成一个 Excel，包含上传表单所需的全部数据。随后 Claude in Chrome 导入每一批 20 份文件，"
date: "2026-10-09T13:36:50.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1lkn2/uploading_numerous_documents_to_a_website_workflow/"
tags: ["source/reddit","topics/agents","topics/products"]
---

一位用户描述了把大约 150 份员工认证文档上传到需要文件上传功能的 SaaS 产品的流程。Claude 桌面版负责重命名和整理文件并准备表单数据，实际上传必须由 Claude in Chrome 完成，因为桌面版无法上传。

目前的流程包含两次交接。桌面版重命名、整理并按每批 20 份分好文档——帖中称 20 是 Claude in Chrome 的上限——同时生成一个 Excel，包含上传表单所需的全部数据。随后 Claude in Chrome 导入每一批 20 份文件，并输出一份摘要供复制回桌面版，以便登记哪些证书已上传，并把证书归档到相应文件夹。

作者表示这样做虽然省时间，但来回切换的步骤太多，难以顺畅地交给团队成员执行。帖中没有给出解决方案，而是询问他人是否遇到同样的限制并推荐工作流。由于这是提问而非结果汇报，有用的信息是所描述的限制条件：Claude in Chrome 每批 20 份的上限、桌面版在本地文件管理中的角色，以及用 Excel 人工记录把两个会话串起来的做法。

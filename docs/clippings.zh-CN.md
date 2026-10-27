# Clippings

[English](clippings.md)

Clippings 是手工维护的内容板块。将 Markdown 文件放入 `content/clippings/`，仓库中的 `index.md` 提供栏目入口。空板块也保留入口，位于首页和播客之间。文章同时进入首页，与采集条目一起按日期倒序排列。其他独立栏目的首页显示规则保持不变。

中英文界面共用标题和正文，各自保留导航、搜索和文章地址，不显示缺译提示。两种界面都使用 Clippings 作为栏目名称。不要在 `_translations/` 下创建副本；归档导入、渲染和恢复发现 Clippings 翻译目录时会停止，并保留文件供手工处理。已知正文语言时设置 `lang`，译文也应填写当前正文的语言；混合语言或无法确定时可省略。Clippings 不会自动翻译、采集或进入摘要任务。

## 新增摘录

`clippings/` 必须是普通目录，其中文件、子目录和附件也必须是普通文件或目录。归档导入、渲染、恢复和发布会拒绝符号链接及目录联接。如果链接导致内容交接中断，恢复记录和内容目录会保留；请先替换或删除错误信息所指路径的链接，再重试 `render`。

选择稳定、含义明确的文件名，例如 `content/clippings/a-useful-note.md`：

```markdown
---
title: 一则有用的笔记
lang: zh-CN
source: https://example.com/original
source_title: The original article title
author:
  - "[[Author name]]"
published: 2026-10-24
created: 2026-10-24
tags: [coding]
description: 归档卡片中显示的简短介绍。
---

在这里填写摘录正文。
```

可以直接使用 Obsidian Web Clipper 生成的 frontmatter。站点通过目录规则将 `clippings/` 及其子目录中的内容发布为文章，并在编译时补上 `source/clippings`，不会改写文件。使用 `publish: false` 保留草稿。`index.md` 应保持 `content_type: page`，它的归档栏目按目录收录成员，不设置 `tab.topics` 来源筛选。

发布日期依次取 `date`、`published`、`created`、首次 Git 提交日期。原文链接优先取 `source_url`，其次取 `source`，均接受不含凭据的 HTTP(S) 地址。可选的 `source_title` 用于列表、详情、收藏和 Markdown 导出中的原文链接文案；省略时显示 URL，不改变文章的 `title`。作者双链保持原样：存在公开作者笔记时生成链接，否则显示姓名并输出构建警告。`agents`、`coding` 等已维护的主题 ID 会映射到 `topics/agents`、`topics/coding` 供筛选使用，其他标签仍可搜索。已被替换的主题 ID 直接映射到当前主题。这些别名在全站生效：已维护的裸 ID 保留给对应主题。自定义标签含义不同时，请使用 `personal/agents` 等独立名称。无需翻译版 Markdown。省略 `lang` 时，共享正文使用 `und`，文本方向自动判定。

也可以显式填写 `publish: true`、`content_type: post`、`date`、`source_url` 和带命名空间的标签。文章应有标题和确定的日期；摘要、原文链接、标签及 `lang` 均为可选。图片和其他共享附件可以放在文章旁边或子目录中。

## 编辑和删除

直接编辑、重命名或删除文件，再构建站点。渲染采集内容时，会将当前 Clippings 目录整体移入新内容树，保留文件字节及生成内容准备期间的修改。Clippings 不进入私有归档快照，旧快照无法恢复已删除的文章。`clippings` 是保留的采集来源 ID，归档维护命令也会拒绝处理该目录。

内容树交换期间若进程中断，恢复流程会根据日志完成目录移交。如果另一个进程在交换期间重新创建目标目录，渲染会停止，保留所有内容树和日志。请先合并冲突修改再重试；删除保留的内容树之前，应检查其中的 Clippings 文件。

## 本地主题验证

共享内容需要上游的 `website.i18n.shared_directories` 实现。正式 Gemfile 继续固定已发布版本，待后续上游发布再升级。此前请按[开发说明](development.md#local-clippings-validation)使用隔离的本地主题包验证，不修改生产数据库、依赖锁文件或已部署站点。

# Clippings

[English](clippings.md)

Clippings 是手工维护的内容板块。将 Markdown 文件放入 `content/clippings/`，仓库中的 `index.md` 提供栏目入口。空板块也保留入口，位于首页和播客之间。文章同时进入首页，与采集条目一起按日期倒序排列。其他独立栏目的首页显示规则保持不变。

中英文界面共用标题和正文，各自保留导航、搜索和文章地址，不显示缺译提示。两种界面都使用 Clippings 作为栏目名称。不要在 `_translations/` 下创建副本；归档导入、渲染和恢复发现 Clippings 翻译目录时会停止，并保留文件供手工处理。已知正文语言时设置 `lang`，译文也应填写当前正文的语言；混合语言或无法确定时可省略。Clippings 不会自动翻译、采集或进入摘要任务。

## 新增摘录

`clippings/` 必须是普通目录，其中文件、子目录和附件也必须是普通文件或目录。归档导入、渲染、恢复和发布会拒绝符号链接及目录联接。如果链接导致内容交接中断，恢复记录和内容目录会保留；请先替换或删除错误信息所指路径的链接，再重试 `export`。

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

## 手动抓取并托管图片

```powershell
fdg ui clippings fetch --target site "content/clippings/Building agents_ When to fold subagents into your main agent loop.md"
fdg ui clippings fetch --target site content/clippings/folder content/clippings/another.md
fdg ui clippings fetch --target site --all --dry-run
fdg ui clippings fetch --target site --all --max-mib 64 --config feedgarden.jsonc
```

指定的文件或目录必须位于配置中的 `feed.directory/clippings/` 内，且不能位于保留的 `assets/` 子目录中。显式路径未选中任何 Markdown 文件时，命令报错并以非零状态退出；`--all` 会跳过 `assets/`，允许空板块。路径相对于当前工作目录，与其他命令一致。不传参数时显示帮助。`--dry-run` 列出外部 Markdown 图片地址，不检查附件缓存；列出的 URL 在实际执行时可能复用缓存图片，已本地化的引用不会列出。预演不创建锁、不下载、不写文件。只有主动调用命令才会抓取图片；采集、渲染、构建、CI 和定时任务均不执行抓取。

支持内联和引用式 Markdown 图片。代码、注释、普通链接、frontmatter（包括 `source_title`）、HTML 图片及 Obsidian 嵌入保持不变。内联图片保留替代文本、标题、空格和换行。引用定义同时被普通链接使用时，仅将图片转换为内联形式，普通链接及其定义仍指向原 URL。

根据文件签名识别 PNG、JPEG、GIF、WebP、AVIF、APNG 和 BMP，按原始字节保存，保留动画。不支持 SVG 和非图片响应。下载保留签名查询参数，复用公网地址校验和连接固定机制，并在每次重定向时重新校验。默认并发为 3，单次请求超时 30 秒，最多重定向 3 次，临时错误重试 2 次，单张图片上限 32 MiB。可通过 `--max-mib` 调整上限。

系统 DNS 必须返回真实公网地址。代理返回的 `198.18.x.x` 等 Fake-IP 会被公网地址规则拒绝；在此环境中，应先为图片域名配置真实 DNS。命令不会绕过校验或修改代理设置。

附件位于 Clippings 内的 `assets/<SHA-256>.<扩展名>`，相同字节共用文件，嵌套文章使用对应的相对路径。`assets/manifest.json` 仅记录原 URL、最终 URL、路径和媒体类型。清单保留含签名参数的完整 URL，随附件提交。主题只发布被引用的图片，清单本身不作为页面或附件发布。

一篇文章的所有图片都成功后，才会修改正文。失败文章保留原始字节，其他文章继续处理，命令最终以非零状态退出并列出原因。重复 URL 和已有本地图片会复用。清单不记录或校验 `size`、`sha256`；复用时检查本地路径、普通文件类型、配置的字节上限及图片类型。新下载仍以 SHA-256 命名以便去重。已经本地化的引用不会自动刷新，无人引用的附件也不会自动删除。对未修改的文章重复执行，不会重新下载或改写文件。

命令与渲染共用 runner 文件锁，不打开 SQLite。如果存在尚未完成的内容交换日志，应先运行 `fdg export --target site --rebuild` 恢复。下载先写入暂存目录，完整附件安装后，再原子更新清单和文章。替换前会重新检查文章身份和原始字节；检测到编辑、重命名或删除时，放弃该篇提交。命令退出前请避免编辑选中的笔记：最后一次内容检查与文件替换是两个独立的文件系统操作。中断可能留下完整但未被引用的附件、清单条目或 `.fetch-*` 暂存目录，重新执行是安全的。确认没有 runner 运行后，可检查并手工移除保留的暂存目录。

请将改写后的 Markdown、附件和清单一起提交。本地主题修复会在“复制页面”和归档导出中，将图片引用映射为实际发布地址：配置了站点 URL 时使用绝对地址，否则使用含 `baseurl` 的根相对地址。两种语言界面共用附件，磁盘原稿仍保留相对路径。

验证命令：

```powershell
npm run typecheck
node --import tsx --test --test-concurrency=1 tests/ui/fetch-clippings.test.ts tests/ui/clippings.test.ts
# 在 .references/jekyll-obsidian/website 中运行：
bundle exec ruby -Itest test/compiler/published_markdown_test.rb
```

## 本地主题验证

共享内容和 Web Clipper 元数据已由固定的 `jekyll-obsidian-site` 0.3.2 正式版本支持。运行 `npm run verify:clippings` 即可使用已发布依赖验证。开发上游功能时，可按[开发说明](development.md#local-clippings-validation)显式选择隔离的本地主题包；验证不修改生产数据库、依赖锁文件或已部署站点。

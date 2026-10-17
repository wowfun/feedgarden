---
publish: true
content_type: "post"
title: "Show HN: Ito – 用 Lua 构建终端界面"
description: "Ito 是一个用 Lua 编写的新终端用户界面（TUI）库，与名为 uji 的配套框架一同发布。作者自称是深度 Neovim 用户，希望拥有一个能像定制编辑器那样自由定制的终端框架。他们考虑过已有的基于 JavaScript 的方案，但最终选择 Lua，认为它更契合自己的偏好，并且可以搭配 Rust 基础以获得更快的速度。 该设计在核心上保持极简，作者表示几乎所有内置抽象都可以用 Lua 完成：包括如何定义 provider，以及如何定制外观与扩展。他们没有沿用某个既有..."
date: "2026-10-14T22:23:53.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://uji.sh/ito/"
discussion_url: "https://news.ycombinator.com/item?id=50096300"
tags: ["source/hackernews","topics/coding","topics/open-source","topics/products"]
---

## 正文提炼

Ito 是一个用 Lua 编写的新终端用户界面（TUI）库，与名为 uji 的配套框架一同发布。作者自称是深度 Neovim 用户，希望拥有一个能像定制编辑器那样自由定制的终端框架。他们考虑过已有的基于 JavaScript 的方案，但最终选择 Lua，认为它更契合自己的偏好，并且可以搭配 Rust 基础以获得更快的速度。

该设计在核心上保持极简，作者表示几乎所有内置抽象都可以用 Lua 完成：包括如何定义 provider，以及如何定制外观与扩展。他们没有沿用某个既有 Rust TUI 框架的做法，而是决定让开发者能够直接用 Lua 构建终端界面，由此产生了 ito 库。

为了展示该库，其中一位作者没有使用常规的终端适配层，而是自行编写了一套 canvas 实现，将其导出为 WebAssembly，并用它搭建了一个网站，让访问者可以在浏览器中尝试用 Lua 构建界面。项目还提供了 llms.txt，方便习惯用 AI 助手生成代码的人使用。

该库托管在 github.com/uji-labs/ito，配套框架在 github.com/uji-labs/uji。除了关于 JavaScript 与 Rust 的那句说明外，帖子没有提供性能基准、采用情况数据或与其他库的对比。

## HN 热门讨论

根据 8 条选取的评论与回复整理。

一位有 Neovim 经验的评论者祝贺作者发布，并建议直接在 Neovim 之上构建声明式渲染引擎，因为每份 Neovim 安装都已提供网格、extmark、浮动窗口和 Lua 运行时；他说自己在该引擎上已开发了 14 个以上交互式 TUI 小程序，覆盖 docker、kubernetes、systemd、AWS、GitHub 等，还支持区域专用快捷键和只读区域。

多位评论者对代码是否符合 Lua 习惯提出疑问。一位认为采用无括号调用会让 API 更好读，并提出一种写法：具名键作为选项，数字索引项作为子组件。另一位不认同这一判断，认为惯用 Lua 的关键不在于无括号调用，而在于表达力以及对基础语言特性的运用，他真正反对的是先在一行创建字段、再通过一连串方法调用修改它的模式。

也有更热情的回应：一位评论者称赞其声明式 API，并畅想某个宇宙里浏览器原生支持 LuaJIT 而非 JavaScript，作者也友好回复；另有一条简短评论只写了“Hqtui”。

评论来源：[jrop](https://news.ycombinator.com/item?id=50103842) · [Yannik&#95;Sc](https://news.ycombinator.com/item?id=50101035) · [otikik](https://news.ycombinator.com/item?id=50101138) · [hollowturtle](https://news.ycombinator.com/item?id=50100813) · [buffer&#95;overlord](https://news.ycombinator.com/item?id=50102200)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50096300>)

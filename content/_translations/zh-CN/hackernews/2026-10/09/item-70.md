---
publish: true
content_type: "post"
title: "Show HN：我用 Rust/WASM 为网页写了一个快速表格引擎"
description: "作者介绍了 Titan：一个用 Rust 编写并编译为 WebAssembly 的电子表格引擎，目标是重算大表时不再把一半时间花在分配 JavaScript 对象或跨 WASM 边界序列化数据上。该项目借鉴了现有表格引擎的思路，但优先考虑浏览器性能，而非与 Excel 内部实现严格 1:1 兼容。 该引擎通过 NPM 以 titan-engine 安装，TitanJS 封装层抽象了 WebAssembly 指针，提供 A1 记法和用于 UI 更新的事件订阅模型。用户可用 A1"
date: "2026-10-08T21:51:03.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/podraven/titan-engine"
discussion_url: "https://news.ycombinator.com/item?id=50012880"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## 正文提炼

作者介绍了 Titan：一个用 Rust 编写并编译为 WebAssembly 的电子表格引擎，目标是重算大表时不再把一半时间花在分配 JavaScript 对象或跨 WASM 边界序列化数据上。该项目借鉴了现有表格引擎的思路，但优先考虑浏览器性能，而非与 Excel 内部实现严格 1:1 兼容。

该引擎通过 NPM 以 titan-engine 安装，TitanJS 封装层抽象了 WebAssembly 指针，提供 A1 记法和用于 UI 更新的事件订阅模型。用户可用 A1 记法或 &#123;row, col&#125; 对象设置单元格，写入时会自动解析 '=' 并编译公式。onCellsChanged 监听器返回一个精确描述变更内容的数组，包含级联依赖，作者表示可直接交给 UI 层使用。

对于粘贴 CSV 之类的批量更新，TitanJS 提供批处理模式：在插入期间暂停拓扑排序，最后只重算一次依赖图。setRange 与 setCells 支持二维数组粘贴和跨多个表格的分散更新，get 返回格式化后的显示值，如 "15" 或 "&#35;DIV/0&#33;"。Viewport 类提供零拷贝读取，封装分块计算，并在 WebAssembly 调用 memory.grow&#40;&#41; 后重新获取指针。

在内部实现上，单元格不以 JavaScript 对象表示，而是把内存划分为固定的 32×32 分块，用分离的数组分别存储类型和载荷（Struct-of-Arrays），以保持内存连续、降低顺序扫描成本。作者尝试过更大的分块，但发现缓存行为在内存占用改善之前就已变差，因此 32×32 是最佳折衷。公式不直接求值 AST，而是编译为字节码并在基于栈的虚拟机上运行。范围被刻意设上限，以免某个公式分配半个 GB 内存把浏览器搞崩；VLOOKUP、SUMIFS 等查找与聚合函数使用惰性 RangeRef 指针，而不是物化整个数组。Titan 内置 42 个函数，涵盖数学、逻辑、查找与引用、条件聚合、文本以及采用 Excel 1900 日期系统的日期函数。

## HN 热门讨论

根据 2 条选取的评论与回复整理。

这是一段关于项目定位的两条评论简短交流。一位自称也在开发表格“平台”的评论者询问这个引擎提供了哪些不同功能。作者回复说，自己并不想构建平台：目标是做一个简单、快速、无界面的表格引擎，可运行在浏览器或 Node.js 中，并通过简单的 WASM 导入集成，最好能成为更大项目的构建模块，让这些项目无需自行实现引擎即可获得类 Excel 计算能力。讨论中没有涉及其他功能或基准测试方面的主张。

评论来源：[MiroslavPokorny](https://news.ycombinator.com/item?id=50013274) · [deathg0d](https://news.ycombinator.com/item?id=50014130)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50012880>)

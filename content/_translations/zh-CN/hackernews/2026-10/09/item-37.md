---
publish: true
content_type: "post"
title: "GTKX：用 React、TypeScript 与 Adwaita 组件构建 Linux 原生应用"
description: "GTKX 是一个面向 Linux 的 React 框架，它渲染的是原生的 Adwaita 与 GTK 组件，而不是网页视图。开发者用 React 组件和 TypeScript 编写界面，通过 React 的状态和事件更新这些组件，使用 Node.js 访问文件系统和网络，并可使用不依赖浏览器 DOM 的 npm 包。项目说明其当前开发的是 GTKX 2.0，尚处于 beta 阶段；2.0 稳定版计划于2026年12月1日发布，1.x 文档对应目前的稳定版本。 开始使用需要 L"
date: "2026-10-08T18:49:24.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/gtkx-org/gtkx"
discussion_url: "https://news.ycombinator.com/item?id=50010240"
tags: ["source/hackernews","topics/coding","topics/products"]
---

## 正文提炼

GTKX 是一个面向 Linux 的 React 框架，它渲染的是原生的 Adwaita 与 GTK 组件，而不是网页视图。开发者用 React 组件和 TypeScript 编写界面，通过 React 的状态和事件更新这些组件，使用 Node.js 访问文件系统和网络，并可使用不依赖浏览器 DOM 的 npm 包。项目说明其当前开发的是 GTKX 2.0，尚处于 beta 阶段；2.0 稳定版计划于2026年12月1日发布，1.x 文档对应目前的稳定版本。

开始使用需要 Linux、Node.js 26.7 或更高版本、GTK 4.20 或更高版本、libadwaita 1.8 或更高版本，以及相应的原生开发库。创建并运行应用使用以下命令：npm create gtkx@beta my-app，cd my-app，然后 npm run dev。原生插件已为 x64 和 arm64 的 glibc Linux 提供预编译版本；其他目标平台需要用 Rust 从代码仓库自行构建。

入口文件会从 @gtkx/jsx/adw 导入 AdwApplication、AdwApplicationWindow、AdwHeaderBar、AdwToolbarView 等 Adwaita 组件，从 @gtkx/jsx/gtk 导入 GtkLabel，从 @gtkx/react 导入 createRoot 和 quit，然后用 createRoot&#40;&#41;.render&#40;&lt;App /&gt;&#41; 渲染组件树。CLI 会根据开发者配置的原生库生成 @gtkx/jsx 元素和 @gtkx/gi 绑定；这些内容只存在于应用本地，不从 npm 安装。组件属性的文档生成在应用内的 .gtkx/reference/ 目录中。

文档包括一个教程，讲解如何构建、测试并打包一个 Tasks 应用以便分发，还有关于表单、导航、动画、样式、测试和部署的指南、GTKX 包导出的 API 参考，以及涵盖计数器、浏览器、组件展示、动画、导航和组件故事的示例。项目采用 MPL-2.0 许可证，通过 Open Collective 接受捐助，并公布了说明开支、手续费和运营储备金的资金计划。

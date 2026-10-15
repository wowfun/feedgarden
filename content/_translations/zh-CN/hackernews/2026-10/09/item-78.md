---
publish: true
content_type: "post"
title: "Bevy 0.20 发布：Solari 路径追踪渲染器支持 DLSS 与 Metal"
description: "基于 Rust 的数据驱动游戏引擎 Bevy 在 crates.io 上发布了 0.20 版本。自几个月前的上一个版本以来，共有 227 位贡献者提交了 817 个拉取请求。项目提供了从 0.19 到 0.20 的迁移指南，引擎永久免费开源，社区插件、游戏和学习资源汇集在 Bevy Assets 中。 本次发布的重点在 Solari——Bevy 的实时路径追踪渲染器。ReSTIR 实现的改进让渲染基本无偏，光照更准确；运动物体不再出现滞后的阴影，反射在运动中闪烁明显减少..."
date: "2026-10-08T22:57:50.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://bevy.org/news/bevy-0-20/"
discussion_url: "https://news.ycombinator.com/item?id=50013610"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## 正文提炼

基于 Rust 的数据驱动游戏引擎 Bevy 在 crates.io 上发布了 0.20 版本。自几个月前的上一个版本以来，共有 227 位贡献者提交了 817 个拉取请求。项目提供了从 0.19 到 0.20 的迁移指南，引擎永久免费开源，社区插件、游戏和学习资源汇集在 Bevy Assets 中。

本次发布的重点在 Solari——Bevy 的实时路径追踪渲染器。ReSTIR 实现的改进让渲染基本无偏，光照更准确；运动物体不再出现滞后的阴影，反射在运动中闪烁明显减少，对非金属材质尤为显著。由于 DLSS-RR 近期提升很大，而 ReSTIR 消耗可观的性能却往往不能显著改善画质，ReSTIR 现在改为可选并默认关闭。从 0.19 升级的项目若未设置 SolariLighting::restir，在多光源场景中可能遇到阴影质量下降和运动时阴影缺失。Solari 的场景管理代码改为保留式并经过大幅优化，显著降低了 CPU 开销；新增字段暴露了世界缓存大小、逐像素光照采样数、时序累积和路径追踪反弹次数等可调参数。Solari 现可通过 Metal 在 macOS 上运行，并在原有的方向光和自发光网格之外，新增对相机上大气与 EnvironmentMapLight 光照的支持。

其他亮点包括：BSN 场景系统语法调整，更易阅读和组合，场景实体在所有子节点生成完成后会触发可观察的 Ready 事件。Bevy Feathers 新增颜色输入、可滚动列表视图、下拉选择和懒加载菜单控件；数字输入控件支持拖拽擦除调值，并新增无头标签页控件。Bevy 正式采用 WESL——WGSL 的标准化扩展——作为着色器语言，取代旧的自定义 WGSL 方言。现在可以为精灵创建自定义着色器材质，2D 网格材质也可像 3D 一样被扩展。新的平移轨道相机让场景导航具备 CAD 式体验。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

一位参与渲染代码的贡献者确认，本次将渲染器 CPU 开销降至随变更实体数量增长（O&#40;变更实体数&#41;），但这一点未写入发布说明。他同时批评 BSN 语法不佳且在恶化：符号标记过多，列表中用“--”分隔元素，且语法不是 LR&#40;1&#41;，说明设计已走入死角。他主张场景格式应重新设计为编辑器优先，并把便于版本控制合并作为首要考虑。有回复称在 Bevy 的一个 issue 中看到了相关取舍讨论，自己更偏好用分号和逗号分隔实体与组件，但也认为用户最终会适应双横线。

一位长期学习者认为 Bevy 玩起来很有趣，但破坏性变更频繁，目前还太不成熟，不适合押注商业产品；有回复反驳说 0.2 这样的版本号本身就意味着会有破坏性变更、尚不适合商业项目。

WESL 的开发者表示团队很享受与 Bevy 合作构建着色器语言，并欢迎大家就 wgsl-analyzer 语言服务器和 WESL 编译器提问。另有评论者称赞 Solari 路径追踪的工作，并给出一场近期 Bevy meetup 上由 Jasmine 所作的入门演讲。

评论来源：[pcwalton](https://news.ycombinator.com/item?id=50015521) · [bluehex](https://news.ycombinator.com/item?id=50016322) · [david&#95;rugaex](https://news.ycombinator.com/item?id=50026159) · [i2talics](https://news.ycombinator.com/item?id=50015419) · [fourside](https://news.ycombinator.com/item?id=50019025) · [stefnotch](https://news.ycombinator.com/item?id=50023707)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50013610>)

## 媒体

![图片: color input](<https://bevy.org/news/bevy-0-20/color_input.jpg>)

[图片: color input](<https://bevy.org/news/bevy-0-20/color_input.jpg>)

![图片: scrollbar listview](<https://bevy.org/news/bevy-0-20/scrollbar_listview.jpg>)

[图片: scrollbar listview](<https://bevy.org/news/bevy-0-20/scrollbar_listview.jpg>)

![图片: A Bevy fog shader with WESL syntax highlighting](<https://bevy.org/news/bevy-0-20/wesl_analyzer.png>)

[图片: A Bevy fog shader with WESL syntax highlighting](<https://bevy.org/news/bevy-0-20/wesl_analyzer.png>)

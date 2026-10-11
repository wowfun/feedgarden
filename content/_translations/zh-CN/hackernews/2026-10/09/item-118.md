---
publish: true
content_type: "post"
title: "bigarrow：让 AI 智能体在屏幕上画箭头、方框和文字的 macOS 工具"
description: "bigarrow（big-arrow-on-the-screen）是一个采用 MIT 许可证的 macOS 命令行工具，同时提供面向 Claude Code 和 Codex 的技能，可以在任意窗口之上画出一个箭头和一块标牌。作者描述的问题是：智能体可以重构 monorepo、写数据库迁移，但当它需要人类点一次按钮时，只能把“请点击 Allow”打印到一个没人看着的终端里。该工具是一个 Swift 二进制程序，会创建一个覆盖所有显示器和所有 Space 的透明窗口；鼠标点击会穿"
date: "2026-10-09T11:03:48.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://github.com/franzenzenhofer/big-arrow-on-the-screen"
discussion_url: "https://news.ycombinator.com/item?id=50018817"
tags: ["source/hackernews","topics/agents","topics/coding","topics/products"]
---

## 正文提炼

bigarrow（big-arrow-on-the-screen）是一个采用 MIT 许可证的 macOS 命令行工具，同时提供面向 Claude Code 和 Codex 的技能，可以在任意窗口之上画出一个箭头和一块标牌。作者描述的问题是：智能体可以重构 monorepo、写数据库迁移，但当它需要人类点一次按钮时，只能把“请点击 Allow”打印到一个没人看着的终端里。该工具是一个 Swift 二进制程序，会创建一个覆盖所有显示器和所有 Space 的透明窗口；鼠标点击会穿透下去，键盘焦点保持不变，箭头随后自行消失。作者表示绘图完全不需要任何 macOS 权限，并且没有守护进程、菜单栏图标、账号、遥测，也（作者强调检查了两次）没有内嵌 AI。

命令行需要指定元素、应用和标牌文字，例如指向“系统设置”中的 Allow，并显示 Ghostty 可能想控制这台 Mac 的提示。选项包括方向、样式（ring、box）、形状（straight、zigzag）、颜色、尺寸、边框、直角或圆角以及关闭按钮；部分命令会先提升窗口或选中所属标签页。标牌中写成 &#123;&#123;...&#125;&#125; 的值会变成复制按钮，便于粘贴验证码或命令；--say 选项可以朗读标牌内容。

作者列出的典型场景包括权限提示、OAuth 授权和“打开方式…”对话框；只能由人完成的步骤，如两步验证、CAPTCHA、通行密钥、支付和签名；粘贴验证码、链接或命令；以及教学式引导，比如逐步指认 Blender 中的操作。仓库还提供一份六页 PDF 指南，其中的截图全部由智能体画的箭头生成，并记录了在 macOS 27 上编排的真实应用场景，文中示例带用户走过系统设置的隐私开关，以及 Keynote 和 TextEdit 的操作步骤。

作者承认箭头自古就有，认为真正的变化是智能体现在会在 Mac 上做真实工作，最终会遇到只有人才能做的一步。文中没有基准测试、采用数据或独立评估；关于权限和窗口行为的效果均来自作者自述，README 还讨论了先前的类似方案。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论反应明显两极分化。一位高赞评论者否定整个方向：计算机本来便宜、高效且强大，如今一个早已解决的问题却贵了 1000 倍，还要依赖别人租来的算力，甚至需要机器人告诉我该按哪个按钮；有回复则认为计算机从来就没有被高效使用过。一位评论者表示“是否需要屏幕录制或辅助功能权限”那一节写得太混乱，看不懂，随后提出安全问题：如果 bigarrow 能在权限弹窗上绘图，那什么能阻止它盖住“拒绝”按钮，或者改掉“允许”按钮上的文字？

另一些人从无障碍角度为项目辩护，把它比作过去那种从零讲起的 PC 教程，认为它能帮助残障或不太懂技术的用户；有回复赞同说，Hacker News 对一个对不常泡在电脑前的人很有价值的项目过于苛刻。在观感方面，一位评论者称赞“我们花了不合理的时间研究箭头长什么样”这句话，另一位则说截图里的箭头明显错位、标注混乱，并指出作者后来替换了截图。还有人抱怨层出不穷的弹出提示和“知道了！”通知是十年来最糟糕的 UX 趋势，不理解为什么会有人想要这种功能。

评论来源：[sicktriple](https://news.ycombinator.com/item?id=50022929) · [hn8726](https://news.ycombinator.com/item?id=50019459) · [kogus](https://news.ycombinator.com/item?id=50024169) · [tangotaylor](https://news.ycombinator.com/item?id=50021210) · [socializer](https://news.ycombinator.com/item?id=50021946) · [internet101010](https://news.ycombinator.com/item?id=50026433)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50018817>)

## 图片与视频

- [图片: A real macOS desktop, Hacker News of 2014-06-10 in Chrome, nine bigarrow arrows in nine colours from every side: same since 2007, already argued in 2014, not a lurker? log in, the article is in here, remember me? &#40;Firefox 30&#41;, nothing. noth](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/hero-hn.png>)
- [图片: bigarrow pointing at a dialog's Allow button](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/demo.gif>)
- [图片: System Settings, Device Control and Data Access: a green arrow with a close button, Franz, switch this on: Terminal may control your Mac, and an orange zigzag ring on the plus button: Not in the list? Plus. Then find it.](<https://github.com/franzenzenhofer/big-arrow-on-the-screen/raw/main/docs/images/real/settings.png>)

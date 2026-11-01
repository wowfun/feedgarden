---
publish: true
content_type: "post"
title: "Do the math: How we took over ChatGPT accounts"
description: "2026 年 10 月，研究人员演示了如何把一个普通的公开 ChatGPT 分享链接变成在打开者已登录会话中执行的攻击者控制 JavaScript。攻击者可创建恶意对话，使用 ChatGPT 正常的分享功能发布，并把链接发给其他用户；受害者只需打开分享链接，无需安装应用、加入项目、粘贴代码或打开开发者工具。载荷可枚举受害者的对话列表、读取从未与攻击者共享的私密对话内容，并把数据外泄到外部服务器。由于它能以受害者身份调用 ChatGPT 的认证 API，这实质上是账户接管..."
date: "2026-10-31T10:30:11.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.parameter.ai/labs/we-found-a-gap-at-openai"
discussion_url: "https://news.ycombinator.com/item?id=50314699"
tags: ["source/hackernews","topics/security-privacy"]
---

## 正文提炼

2026 年 10 月，研究人员演示了如何把一个普通的公开 ChatGPT 分享链接变成在打开者已登录会话中执行的攻击者控制 JavaScript。攻击者可创建恶意对话，使用 ChatGPT 正常的分享功能发布，并把链接发给其他用户；受害者只需打开分享链接，无需安装应用、加入项目、粘贴代码或打开开发者工具。载荷可枚举受害者的对话列表、读取从未与攻击者共享的私密对话内容，并把数据外泄到外部服务器。由于它能以受害者身份调用 ChatGPT 的认证 API，这实质上是账户接管，而非仅修改页面。OpenAI 于 10 月 26 日修复该问题，并将报告定级为 P1。这条攻击链结合了两个单独看都无害的功能：交互式图和 ChatGPT 的 HTML 预览。预览在独立网址的受限 frame 中运行任意代码，因此无法直接读取已登录的 ChatGPT 页面；起初这种隔离按预期工作。但图加载了 MathLive 数学库，后者在主 ChatGPT 页面安装了针对其屏幕键盘的 postMessage 监听器。MathLive 的顶层控制器使用 origin 策略 'none'，接受来自任意网址的消息，且未验证更新设置的消息是否来自已批准的发送者。它接受的键盘布局允许包含 HTML。因此，受限的预览作为不受信任的发送方，可向主页面发送两条消息：一条用攻击者 HTML 替换虚拟键盘布局，一条指示 MathLive 显示键盘并渲染该 HTML。这样，不受信任的 frame 就跨越沙箱边界进入已认证会话。研究人员用受控证据证实，私密对话数据可以从受害者会话中流出。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者大多批评 5000 美元的赏金：yellow&#95;lead 认为仅需点击链接的账户接管赏金过低，Catloafdev 将其比作万亿美元公司对研究人员的敷衍打发，Kuyawa 称之为笑话并希望 OpenAI 遭遇黑客攻击。lxgr 将此报告与桌面应用 Work 聊天中可远程访问文件系统的另一问题联系起来，randomblock1 则指出 Work 模式界面已提示云端会话可访问用户电脑。zahlman 认为技术叙述难以理解，并质疑如何控制预览内容；0c3ca83 认为文章读起来像面向搜索引擎的营销内容。dumberquestions 与 trungto 讨论手写博客，trungto 提到一个未借助 LLM 的个人站点。usernametaken29 将漏洞归因于单体代码库，并质疑 OpenAI 以智能体驱动开发的说法。

评论来源：[yellow&#95;lead](https://news.ycombinator.com/item?id=50315474) · [Catloafdev](https://news.ycombinator.com/item?id=50317858) · [lxgr](https://news.ycombinator.com/item?id=50315324) · [zahlman](https://news.ycombinator.com/item?id=50318963) · [dumberquestions](https://news.ycombinator.com/item?id=50315175) · [usernametaken29](https://news.ycombinator.com/item?id=50315368)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50314699>)

## 媒体

![图片: The public share modified the real ChatGPT page](<https://www.parameter.ai/labs/images/openai-public-share-modified-page.png>)

[图片: The public share modified the real ChatGPT page](<https://www.parameter.ai/labs/images/openai-public-share-modified-page.png>)

![图片: Controlled proof that private conversation data could leave the victim's session](<https://www.parameter.ai/labs/images/openai-private-chat-exfil-proof.png>)

[图片: Controlled proof that private conversation data could leave the victim's session](<https://www.parameter.ai/labs/images/openai-private-chat-exfil-proof.png>)

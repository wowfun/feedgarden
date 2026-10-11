---
publish: true
content_type: "post"
title: "我给四个编程智能体各 100 美元预算，让它们做 PDF 编辑器"
description: "一位研究“面向代码的大模型”的研究者描述了一项实验：四个编程智能体——Gemini 3.8 Flash、GPT Astra 6、Opus 5 和 Fable 5——各自获得 100 美元预算和一台可自由支配的虚拟机（例如安装 computer-use 类工具），任务是构建一个用户体验出色的开源 PDF 编辑器。它们被要求考察现有工具，并上网搜索潜在用户反映的不足；各智能体在相互隔离的环境中运行，以免彼此影响；每次返回后会被再次唤醒，直到预算用尽。作者把产出物和生成网页应用的链"
date: "2026-10-08T23:43:50.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://blog.nielstron.de/2026/10/08/the-remaining-shortcomings-of-coding-agents/"
discussion_url: "https://news.ycombinator.com/item?id=50014011"
tags: ["source/hackernews","topics/agents","topics/coding","topics/evaluation"]
---

## 正文提炼

一位研究“面向代码的大模型”的研究者描述了一项实验：四个编程智能体——Gemini 3.8 Flash、GPT Astra 6、Opus 5 和 Fable 5——各自获得 100 美元预算和一台可自由支配的虚拟机（例如安装 computer-use 类工具），任务是构建一个用户体验出色的开源 PDF 编辑器。它们被要求考察现有工具，并上网搜索潜在用户反映的不足；各智能体在相互隔离的环境中运行，以免彼此影响；每次返回后会被再次唤醒，直到预算用尽。作者把产出物和生成网页应用的链接发布在一个 GitHub 项目中。

结论是：这些实现“还可以，但不算好”，作者随便点几下就能在几乎每一个里发现 bug。他的假设是，智能体与人同软件互动的方式不同——它们不追求具体目标，不会在过程中遭遇摩擦，而且远少去看 UI。他的第一点批评是结构性的：四个模型都选择做网页应用，而 PDF 编辑器最有价值的形态是本地安装并设为系统默认查看器。Gemini 在首次公开仓库中只提供了 npm 安装说明，作者认为这是失败；Astra 则确实准备了 GitHub Pages 部署。在后来的私有运行中，据他所知没有任何模型花力气让应用可以本地安装或直接执行，比如做成 Android 应用。

背景方面，作者认为代码生成的瓶颈已经转移。六年前根本不存在能把自然语言需求转成可运行代码的系统；ChatGPT 解决了这一点，问题于是转向“情境化”——了解既有功能、语言约束和输入形态。编程智能体被他描述为包裹大模型的通用符号层，能像开发者一样读取、修改和执行代码，是这一问题的答案，再叠加一些强化学习来打磨目标导向行为。他认为人类剩下的价值有两点：让智能体保持在正轨上、在它过早退出时按回车；以及发现并报告那些恼人或损坏的行为——后者常被与“品味”混为一谈。

## HN 热门讨论

根据 7 条选取的评论与回复整理。

讨论主要围绕作者的论述展开，而非反驳。Boltgolt 认为关键差别在于手写代码时存在的反馈回路：深色模式下 PDF 颜色反转这种 bug，他觉得自己也可能写出来，但只要一测试深色模式是否生效就会立刻发现。CoolestBeans 表示欣赏这种比“全是垃圾”与“手写代码就是傻”两派对立的说法更细致的观点，并说自己的经验是智能体需要廉价、易运行、第三方的验证手段来核对自己是否走偏——通常是编译器和测试套件，也可以是视觉检查；这些对人同样有用，但缺乏反馈对智能体是灾难性的。bentt 归纳出一个最低需求：一个能在 PDF 上随手签个名的应用基本就够了。alyssassan 描述了自己的工作流：简单步骤用 Jev，只在规划或复核时用 Fable 或 Opus。MiroslavPokorny 质疑为何要重复造轮子、究竟新增了什么价值，ferrouswheel 则以不屑的口吻反问他是否读完了文章。

评论来源：[Boltgolt](https://news.ycombinator.com/item?id=50016027) · [CoolestBeans](https://news.ycombinator.com/item?id=50018013) · [bentt](https://news.ycombinator.com/item?id=50019770) · [alyssassan](https://news.ycombinator.com/item?id=50017709) · [MiroslavPokorny](https://news.ycombinator.com/item?id=50014126) · [ferrouswheel](https://news.ycombinator.com/item?id=50014935)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50014011>)

## 图片与视频

- [图片: Even if I had known where these pickaxes land, I would have preferred them unslanted &#40;original on the right&#41;.](<https://res.cloudinary.com/lesswrong-2-0/image/upload/v1791501283/lexical_client_uploads/djeznvao6rzwj33mesie.png>)
- [图片: Just give me a native binary please.](<https://res.cloudinary.com/lesswrong-2-0/image/upload/v1791499469/lexical_client_uploads/bpmeptaulf9rmbrcyzez.png>)

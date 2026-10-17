---
publish: true
content_type: "post"
title: "Claude 揭示 ECDSA 曲线种子的由来"
description: "Anthropic 表示，其内部研究模型 Claude 解开了 NIST 标准 ECDSA 椭圆曲线种子来源这个悬置数十年的问题。公司称，2026 年 10 月，一名员工在未向模型提供旧有传闻线索的情况下让它调查，结果不到半小时便找到了 P-192、P-224、P-256、P-384 和 P-521 五条曲线种子的生成方式。它们并非外界猜测的某个短语的哈希值，而是 C 语言库 lrand48 伪随机数生成器的输出，仅以 Unix 时间戳作为种子。 背景是 NIST 于 ..."
date: "2026-10-16T18:55:59.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:46:51.389Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/ecdsa-curve-origins"
discussion_url: "https://news.ycombinator.com/item?id=50122800"
tags: ["source/hackernews","topics/security-privacy","topics/research"]
---

## 正文提炼

Anthropic 表示，其内部研究模型 Claude 解开了 NIST 标准 ECDSA 椭圆曲线种子来源这个悬置数十年的问题。公司称，2026 年 10 月，一名员工在未向模型提供旧有传闻线索的情况下让它调查，结果不到半小时便找到了 P-192、P-224、P-256、P-384 和 P-521 五条曲线种子的生成方式。它们并非外界猜测的某个短语的哈希值，而是 C 语言库 lrand48 伪随机数生成器的输出，仅以 Unix 时间戳作为种子。

背景是 NIST 于 2000 年采纳的 FIPS 186-2 数字签名标准。该标准列出不同安全强度的标准曲线，并公布一个“种子”参数，其哈希值用于定义曲线系数 b，但这些种子由 NSA 提供，未附任何说明。Neal Koblitz 与 Alfred Menezes 在《A Riddle Wrapped in an Enigma》中总结了相关争议，还有人悬赏寻找种子来源。NSA 的 Jerry Solinas 在 2015 年回忆说，种子可能是对一个幽默口令做哈希得到的；Anthropic 称这一说法并不正确。Solinas 已于 2023 年去世，当年的同事也未能提供更多细节。

具体机制是：用时间戳初始化 lrand48，每次迭代取出 20 字节作为一个候选种子，前 20 字节是候选一，接下来 20 字节是候选二，依此类推；P-256 的种子在第 1842 次迭代出现。Anthropic 强调，这不是密码学破解、新攻击或曲线弱点，反而让人更有信心：生成过程简单、由时钟播种且如今可以复现，蓄意做手脚的空间小得多，存在后门的可能性也随之降低，参数因此更值得信任。文中还明确表示，用户无需采取任何行动。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者争论：还原生成方法是否真的回答了“曲线如何被挑选”的问题。fidotron 认为，证明候选种子如何产生，并不能说明哪些候选被丢弃，因此仍可以设想通过搜索时间戳来得到具有特定性质的曲线。FiloSottile 回应说，即便试遍 1997 年的所有时间戳并在早期可用候选中任意选择，自由度也只有约 30 位；若存在大到能用 2^30 次尝试碰上的弱 256 位曲线族，那本身就是密码学突破，并引用 Koblitz 与 Menezes 论文第 3.1 节。sweis 指出，Solinas 在 2015 年复述、且他曾向包括两名前 NSA 人员在内的四人核实的“口令哈希”说法其实是错的。teddyh 则提到，第五个二进制种子 B-163 仍无法解释，可能是转录时写错了一位。也有人调侃多年的“锡箔帽”阴谋论，称这条消息对 NIST 阴谋论是沉重打击。

评论来源：[fidotron](https://news.ycombinator.com/item?id=50123213) · [FiloSottile](https://news.ycombinator.com/item?id=50125469) · [sweis](https://news.ycombinator.com/item?id=50123174) · [teddyh](https://news.ycombinator.com/item?id=50123292) · [tptacek](https://news.ycombinator.com/item?id=50123044)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50122800>)

## 媒体

![图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe8e7bb885a5e83cbcfe80e5b25f5ef7203c558ba-2912x1016.png&w=3840&q=75>)

[图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2Fe8e7bb885a5e83cbcfe80e5b25f5ef7203c558ba-2912x1016.png&w=3840&q=75>)

![图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7ca7925885873b75479af7573759d7b784cf67ac-2912x1880.png&w=3840&q=75>)

[图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F7ca7925885873b75479af7573759d7b784cf67ac-2912x1880.png&w=3840&q=75>)

![图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F38a85c534c21b7786af3c321056ae6527946f706-2912x3768.png&w=3840&q=75>)

[图片](<https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F38a85c534c21b7786af3c321056ae6527946f706-2912x3768.png&w=3840&q=75>)

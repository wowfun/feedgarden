---
publish: true
content_type: "post"
title: "Linux 内核中的位图"
description: "本文是介绍 Linux 内核常用数据结构系列中的一篇，聚焦位图（bitmap），即内核中对位数组的称呼。位图并不是一种专门类型，而就是一个 unsigned long 数组；在 x86_64 上每个字宽 64 位，因此每 64 个位共享同一个存储单元。每个位表示一种状态，例如置位或清零、可用或不可用、启用或禁用。 作者通过统计内核源码中最基本的三个操作出现频率来说明位图之普遍：以整词方式检索 set_bit、clear_bit 和 test_bit，结果约为 28,340 处"
date: "2026-10-08T23:16:09.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://0xax.dev/books/linux-inside/linux-datastructures-2"
discussion_url: "https://news.ycombinator.com/item?id=50013765"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## 正文提炼

本文是介绍 Linux 内核常用数据结构系列中的一篇，聚焦位图（bitmap），即内核中对位数组的称呼。位图并不是一种专门类型，而就是一个 unsigned long 数组；在 x86&#95;64 上每个字宽 64 位，因此每 64 个位共享同一个存储单元。每个位表示一种状态，例如置位或清零、可用或不可用、启用或禁用。

作者通过统计内核源码中最基本的三个操作出现频率来说明位图之普遍：以整词方式检索 set&#95;bit、clear&#95;bit 和 test&#95;bit，结果约为 28,340 处。具体数字会因内核版本不同而变化，但这一量级足以说明该抽象值得深入了解。

文章解释了位数组的吸引力所在。一个可能包含 0 到 255 之间任意数字的集合只需 256 位，即 32 字节；而同样用途的 bool 数组至少要占八倍内存，因为每个 bool 至少占一个字节，用整数链表表示则代价更高。第二个原因来自速度：处理器可以在一条指令内处理整个机器字，因此批量检查或合并多个标志位很便宜，x86 甚至有直接测试或修改单个位的指令。

文章还回顾了基本的集合语义：索引代表一个值，该索引上的位回答「这个值是否存在」。要存储集合 &#123;1, 3, 8, 12&#125;，就在 16 位数组中将这四个索引置位，其余清零。由于索引从 0 到「长度减一」，只有落在该范围内的数字才能被表示。可用操作包括置位、清零、测试某位是否被设置，以及查找第一个置位或清零的位；前三者只涉及单个位，而查找会扫描位图，但按机器字而不是按单个位推进。文章为后续讲解内核实际 API 与实现做铺垫。

## HN 热门讨论

根据 3 条选取的评论与回复整理。

——一位评论者希望有人能设计出指针直接寻址单个位而非 8 位字节的 CPU，并质疑只要实现得当，这种设计未必更低效；他还抱怨声明位图总要绕弯子，而不能像普通 bool 数组那样直接书写。

——有回复反驳说，这与当前处理器提供了什么关系不大。它指出 Intel CPU 早就有指向单个位的指令，例如 BTS，其第二个操作数就是一个位地址；同时回顾说 std::vector&lt;bool&gt; 本是为了暴露处理器的这种能力，结果却成了特例，引用 Scott Meyers 的说法，它既不是标准容器，也不包含真正的 bool。

——另有一条简短评论只是表示已收藏并关注该系列。这是一个很小的按排序抽取的样本，不能代表读者整体意见。

评论来源：[EdSchouten](https://news.ycombinator.com/item?id=50015939) · [JdeBP](https://news.ycombinator.com/item?id=50016029)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50013765>)

## 图片与视频

- [图片: bit array](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/bit-array.svg>)
- [图片: bit number to word](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/bitmap-words.svg>)
- [图片: find&#95;next&#95;bit](<https://raw.githubusercontent.com/0xAX/linux-insides/master/DataStructures/images/find-next-bit.svg>)

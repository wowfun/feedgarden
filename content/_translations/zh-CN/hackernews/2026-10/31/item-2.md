---
publish: true
content_type: "post"
title: "Show HN：用约1GB的Qwen权重跑起一台任天堂"
description: "研究者开发了 nesformer，将整个 NES（红白机）编译进了一个未经训练的 Qwen3.5 模型权重中。编译器直接计算出全部权重，使得 6502 CPU、2KB 工作内存以及卡带的程序 ROM 全部都运行在模型的 Gated DeltaNet 状态内。游玩时，模型逐个 token 预测 CPU 的执行日志，由一个小型宿主程序负责绘制画面、读取手柄并触发 vblank 中断。 该项目基于先前的 Qwenputer（曾将 CHIP-8 和 RISC-V 编译进模型）。..."
date: "2026-10-30T16:40:22.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/dbreunig/nesformer"
discussion_url: "https://news.ycombinator.com/item?id=50306442"
tags: ["source/hackernews","topics/models","topics/hardware","topics/inference"]
---

## 正文提炼

研究者开发了 nesformer，将整个 NES（红白机）编译进了一个未经训练的 Qwen3.5 模型权重中。编译器直接计算出全部权重，使得 6502 CPU、2KB 工作内存以及卡带的程序 ROM 全部都运行在模型的 Gated DeltaNet 状态内。游玩时，模型逐个 token 预测 CPU 的执行日志，由一个小型宿主程序负责绘制画面、读取手柄并触发 vblank 中断。

该项目基于先前的 Qwenputer（曾将 CHIP-8 和 RISC-V 编译进模型）。nesformer 在启动时将 ROM 加载到模型状态中，因此同一套权重无需重新编译即可运行任意 NROM（mapper 0）卡带。对于内置测试游戏，其输出与传统 6502 模拟器完全一致。但性能代价极为巨大：在当前硬件上速度约为真机的 1/150 到 1/290，每帧需 1-6 秒，10 秒游戏时长大约要 25 分钟，仅支持 NROM 映射卡带。

这个项目最引人注目的点在于：确定性的硬件逻辑可以被精确地编译进 transformer 权重，而不是通过训练近似模拟。它的价值并非实用性，而是直观地揭示了计算成本的差距——即使模拟一台简单的游戏机都需要如此庞大的算力，若要用模型推理完全模拟整个操作系统，将会比专用代码昂贵数个数量级。

## HN 热门讨论

根据 10 条选取的评论与回复整理。

评论者们主要讨论的是实现方法及其意义，而不是演示本身。作者解释，Opus 5.5 仅用两条提示就构建出了可用的权重和代码，并参考了经典游戏社区的 NES 一致性测试（包含数千条黄金指令）。其他人指出效率上的取舍：将数字逻辑编译到模型权重中是精确的（而非学习近似），但运行速度比传统模拟器慢几个数量级。一位评论者估计比真实硬件慢 150-290 倍，并警告逐帧“幻觉”整个操作系统的成本会高得离谱。另一位则设想更广泛的可能性——将小型虚拟机编译进权重，或许能让大模型通过矩阵运算直接执行代码，而不是依赖缓慢的工具调用，尽管这仍属推测。总体来看，大家认为这个项目的价值不在于实用模拟器，而在于直观地展现确定性程序与模型推理之间的计算差距。

评论来源：[dbreunig](https://news.ycombinator.com/item?id=50307402) · [jacquesm](https://news.ycombinator.com/item?id=50306736) · [pbohun](https://news.ycombinator.com/item?id=50307246) · [armcat](https://news.ycombinator.com/item?id=50307314)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50306442>)

## 媒体

![图片: Super Mario Bros., played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/demo.gif>)

[图片: Super Mario Bros., played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/demo.gif>)

![图片: Full Game, played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/full_game.gif>)

[图片: Full Game, played by the weights](<https://github.com/dbreunig/nesformer/raw/main/examples/full_game.gif>)

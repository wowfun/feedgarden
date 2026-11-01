---
publish: true
content_type: "post"
title: "Show HN：一个住在启动扇区里的语言模型"
description: "一个名为 bootgpt 的项目把一个极小的字符级神经网络塞进了 PC 的主引导记录（MBR）：手写的 512 字节汇编启动扇区从随后的 23 个扇区加载一个 11.5 KB 的 int8 模型，并在 386 上以 16 位实模式运行推理，没有操作系统或 C 运行时。机器启动时会生成一段看似合理的虚构 Linux 启动日志，包含时间戳、PCI BAR 以及为不存在的硬件产生的 ACPI 事件。corpus_gen.py 用单一内核版本生成 3 MB 伪造 dmesg；t..."
date: "2026-10-31T12:58:29.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://github.com/kerlenton/bootgpt"
discussion_url: "https://news.ycombinator.com/item?id=50315782"
tags: ["source/hackernews","topics/models","topics/inference","topics/hardware"]
---

## 正文提炼

一个名为 bootgpt 的项目把一个极小的字符级神经网络塞进了 PC 的主引导记录（MBR）：手写的 512 字节汇编启动扇区从随后的 23 个扇区加载一个 11.5 KB 的 int8 模型，并在 386 上以 16 位实模式运行推理，没有操作系统或 C 运行时。机器启动时会生成一段看似合理的虚构 Linux 启动日志，包含时间戳、PCI BAR 以及为不存在的硬件产生的 ACPI 事件。corpus&#95;gen.py 用单一内核版本生成 3 MB 伪造 dmesg；train.py 训练字符嵌入、一个隐藏层和 softmax，并将全部参数量化为 int8、采用 2 的幂次缩放，使启动扇区能用 imul 和单次 idiv 完成整个前向传播，同时精确模拟汇编将执行的整数运算（含 LCG 采样器），因此 Python 与启动扇区输出可逐字符比对且完全一致。boot.asm 负责 int 13h 加载权重、int 10h 输出、基于 cdq/idiv 的 softclip 激活、由定时器噪声种子的 argmax 采样，以及任意按键重启。字符串、权重与词表全部放在数据扇区，以便在 510 字节代码中容纳推理与 BIOS 调用。启动扇区流派由来已久：Oscar Toledo 曾在 512 字节内放入象棋、整个操作系统乃至 BASIC；最近邻 sectorllm 用约 1.2 KB 实模式汇编启动真正的 Llama2 Transformer（5 层、含注意力），运行 Karpathy 的 stories260K；sectorlisp-nn 在启动时的 Lisp 解释器上运行 TensorFlow 训练的网络；还有 UEFI 应用直接在现代硬件上启动 llama 级模型。bootgpt 采取另一极端：整个引擎留在 MBR，权重与字符串在后续扇区，模型并非通用讲故事器，而是为一件事训练的极小字符级网络——幻觉出它所唤醒的那台机器的启动日志。在 8 字符上下文与单隐藏层下，样例输出虽有乱码但像日志。disk.img 是普通启动镜像，可写入 U 盘在任意 BIOS 机器启动，且只读取自身扇区；构建依赖 nasm、qemu 与 Python，record.py 通过 monitor socket 从无头 QEMU 录制演示 gif。该方案需要 BIOS 硬件，输出为幻觉而非真实日志，并且每次启动会话仅一个内核版本与一块磁盘，因为重复性让极小模型显得合理。

## HN 热门讨论

根据 4 条选取的评论与回复整理。

aDyslecticCrow 称赞这是提醒人们人类会为乐趣做古怪事情的工程，不只追求经济价值；kerlenton 表示感谢并同意有些事情纯粹为了好玩。andai 希望了解更多制作与学习过程；kerlenton 回复很难推荐具体路径，强调真正的兴趣、耐心与坚持，以及周围有 peers 做类似事情的文化环境，并提到团队领导会逆向工程电动汽车。样本显示评论者欣赏这种奇思妙想的底层工程并好奇学习历程，作者则强调动机与环境而非按部就班的指南。

评论来源：[aDyslecticCrow](https://news.ycombinator.com/item?id=50321702) · [kerlenton](https://news.ycombinator.com/item?id=50323611) · [andai](https://news.ycombinator.com/item?id=50322783) · [kerlenton](https://news.ycombinator.com/item?id=50323696)

[查看完整 HN 讨论](<https://news.ycombinator.com/item?id=50315782>)

## 媒体

![图片: demo](<https://github.com/kerlenton/bootgpt/raw/main/bootgpt_demo.gif>)

[图片: demo](<https://github.com/kerlenton/bootgpt/raw/main/bootgpt_demo.gif>)

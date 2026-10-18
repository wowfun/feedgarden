---
publish: true
content_type: "post"
title: "Rust 框架 DenseCore 逐位复现 PyTorch 的 nanoGPT 训练结果"
description: "一名计算机专业学生用 Rust 写了小型深度学习框架 DenseCore，并提供类似 PyTorch 的 Python API。他把 import torch 指向 DenseCore 后，原样运行 Karpathy 的 nanoGPT，得到与 PyTorch 逐位相同的结果：manual_seed 生成的初始权重相同，损失、梯度和权重在测试的全部 50 步中完全一致，开启 dropout 时也是如此。 做到这一点需要复现 PyTorch 若干不显眼的行为：其 CPU ..."
date: "2026-10-16T18:49:12.000Z"
updated: "2026-10-17T05:02:19.132Z"
first_seen: "2026-10-17T04:47:56.708Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/MachineLearning/comments/1x7ojxo/p_my_rust_framework_trains_nanogpt_with_the_exact/"
tags: ["source/reddit","topics/coding","topics/open-source"]
---

一名计算机专业学生用 Rust 写了小型深度学习框架 DenseCore，并提供类似 PyTorch 的 Python API。他把 import torch 指向 DenseCore 后，原样运行 Karpathy 的 nanoGPT，得到与 PyTorch 逐位相同的结果：manual&#95;seed 生成的初始权重相同，损失、梯度和权重在测试的全部 50 步中完全一致，开启 dropout 时也是如此。

做到这一点需要复现 PyTorch 若干不显眼的行为：其 CPU 注意力使用 flash attention 内核，并在开启 dropout 时切换到另一条路径；由于编译器对尾部循环的融合，Adam 在每个线程块末尾若干元素上的舍入方式不同；clip&#95;grad&#95;norm&#95; 实际执行的是 reciprocal&#40;&#41; &#42; max&#95;norm，而非除法。作者还发现 PyTorch 在不同机器上都无法自我复现：同一版本在 macOS 与 Linux x86 上，26 个算子中只有 1 个给出相同比特。因此 DenseCore 目前只在 Apple Silicon Mac 上与之匹配；它约 2 MB，而 PyTorch 约 580 MB。

这名学生询问该项目是否有用，还是只是学习项目，并提出三个方向：继续照抄 PyTorch 直到大部分功能可用；成为面向无服务器和 CI 等小型 CPU 负载的轻量替代品；或做成解释两次 PyTorch 运行为何结果不同的工具。

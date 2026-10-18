---
publish: true
content_type: "post"
title: "Claude 揭示 ECDSA 曲线种子的来源"
description: "Anthropic 的 Frontier Red Team 发布文章，介绍 Claude 如何解开围绕 ECDSA 的一个数十年谜团。ECDSA 是最广泛使用的椭圆曲线密码标准，2000 年随 FIPS 186-2 数字签名标准被 NIST 采纳，规定了一组不同规模的曲线。对于素域和二元域上的曲线，标准公布了一个“种子”（seed），其哈希值用于定义曲线系数 b。这些种子由 NSA 提供且未作任何说明，长期引发是否预留后门的猜测。例如 NIST P-256 的种子为 C..."
date: "2026-10-16T17:02:00.000Z"
updated: "2026-10-17T04:55:05.144Z"
first_seen: "2026-10-17T04:47:21.425Z"
date_basis: "published"
source_url: "https://www.anthropic.com/research/ecdsa-curve-origins"
tags: ["source/anthropic","topics/security-privacy","topics/history"]
---

Anthropic 的 Frontier Red Team 发布文章，介绍 Claude 如何解开围绕 ECDSA 的一个数十年谜团。ECDSA 是最广泛使用的椭圆曲线密码标准，2000 年随 FIPS 186-2 数字签名标准被 NIST 采纳，规定了一组不同规模的曲线。对于素域和二元域上的曲线，标准公布了一个“种子”（seed），其哈希值用于定义曲线系数 b。这些种子由 NSA 提供且未作任何说明，长期引发是否预留后门的猜测。例如 NIST P-256 的种子为 C49D3608 86E70493 6A6678E1 139D26B7 819F7E90。Neal Koblitz 与 Alfred Menezes 在《A Riddle Wrapped in an Enigma》中总结了这场争议，民间还悬赏寻找答案。

流传最广的说法来自 NSA 长期雇员 Jerry Solinas：种子是某个幽默口令的哈希，类似“Give Bob and Jerry a raise”，代码由同事 Bob Reiter 编写。相关档案未能找到，Solinas 已于 2023 年去世，而这一说法最终被证明是错的。2026 年 10 月，一位 Anthropic 员工询问内部研究模型；在没有提示的情况下，Claude 在半小时内发现 P-192、P-224、P-256、P-384 和 P-521 的种子其实来自 C 标准库的 lrand48 随机数生成器，并以 Unix 时间戳作为初始种子。算法每轮抽取 20 字节作为候选种子，P-256 需要 1842 轮才得到标准中的值。

Anthropic 强调，这不是密码学破解、攻击或漏洞。种子由简单的、可复现的时钟播种伪随机数生成器产生，蓄意操纵的可能性因此大大降低，人们对这些曲线参数的安全性可以更有信心。文章称无需采取任何行动。

---
publish: true
content_type: "post"
title: "8GB 显卡上测试 llama.cpp 的 MoE 专家内存缓存，结果不如预期"
description: "一位拥有 8GB RTX 4060 与 32GB DDR5-5600 内存的用户测试了 llama.cpp PR #29887 引入的功能——把 MoE 专家保存在主机内存的 GPU 缓存中，使用 b11491 构建和 IQ4_XS 量化的 Qwen3.6-35B-A3B 模型。他表示没有得到预期的吞吐量，询问是否是配置有误，并邀请其他显存有限的用户分享自己的 token/s 数据。 各配置下的 prompt 评估与生成结果： - -cmoe 配合固定缓存与 llama-se"
date: "2026-10-08T17:23:57.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wyge/probably_im_doing_something_wrong_using_pr29887/"
tags: ["source/reddit","topics/inference","topics/evaluation"]
---

一位拥有 8GB RTX 4060 与 32GB DDR5-5600 内存的用户测试了 llama.cpp PR &#35;29887 引入的功能——把 MoE 专家保存在主机内存的 GPU 缓存中，使用 b11491 构建和 IQ4&#95;XS 量化的 Qwen3.6-35B-A3B 模型。他表示没有得到预期的吞吐量，询问是否是配置有误，并邀请其他显存有限的用户分享自己的 token/s 数据。

各配置下的 prompt 评估与生成结果：

- -cmoe 配合固定缓存与 llama-server 默认设置：prompt 评估 45.32 t/s，生成 23.36 t/s（1,750 token）。
- -cmoe --moe-cache-mib 1536：prompt 评估 28.70 t/s，生成 15.02 t/s。
- -cmoe --moe-cache-mib 2048：prompt 评估 22.65 t/s，生成 13.40 t/s。
- -cmoe --moe-cache-mib 4096：prompt 评估 17.37 t/s，生成 19.60 t/s。
- -cmoe --moe-cache-mib 8192：prompt 评估 12.30 t/s，生成 12.04 t/s。
- -cmoe --moe-cache-mib 2048 且上下文 131,072 token：prompt 评估 26.14 t/s，生成 15.30 t/s。
- 不加 -cmoe 仅用 --moe-cache-mib 2048（fit 默认开启）：prompt 评估 65.62 t/s，生成 24.20 t/s。
- 在无 -cmoe 基础上再加 -b 2048 -ub 2048：prompt 评估 63.11 t/s，生成 24.62 t/s。

该帖更像求助而非受控实验，且运行条件未完整说明，因此这些对比只有参考意义而非定论。但数据显示，在这些配置中启用该缓存选项反而降低了吞吐，且缓存开得越大表现越差。

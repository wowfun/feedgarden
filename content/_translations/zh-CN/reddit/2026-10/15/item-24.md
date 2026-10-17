---
publish: true
content_type: "post"
title: "三台 4 卡 R9700 推理机：二手 EPYC 仅 127 美元，整机约 1.07 万美元"
description: "一位用户分享了自己为业务搭建的三台 GPU 服务器。他的公司 USA Arms 整理数万家枪械相关企业（经销商、弹药商、靶场等）的信息，这些资料时刻变化，因此需要持续更新的系统。模型负责核对来源事实、厘清企业身份并抽取服务、营业时间等信息；每个答案都要与智能体实际看到的内容核对，并保存相应文档，供更大的模型审计。作者表示，他比原计划更早把大部分工作迁到本地 AI，因为大约两三周前托管模型开始拒绝执行常规调研：例如由于执照持有人可能是个人而拒绝识别枪械经销商，或拒绝查看弹..."
date: "2026-10-15T00:31:42.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x67qeu/4x_r9700_builds_with_127_used_epycs_107k_allin/"
tags: ["source/reddit","topics/hardware","topics/inference","topics/industry"]
---

一位用户分享了自己为业务搭建的三台 GPU 服务器。他的公司 USA Arms 整理数万家枪械相关企业（经销商、弹药商、靶场等）的信息，这些资料时刻变化，因此需要持续更新的系统。模型负责核对来源事实、厘清企业身份并抽取服务、营业时间等信息；每个答案都要与智能体实际看到的内容核对，并保存相应文档，供更大的模型审计。作者表示，他比原计划更早把大部分工作迁到本地 AI，因为大约两三周前托管模型开始拒绝执行常规调研：例如由于执照持有人可能是个人而拒绝识别枪械经销商，或拒绝查看弹药经销商的网站，导致其处理流程出现各种随机故障。

三台机器含税含运费平均每台 10,733.91 美元，合计 384GB 显存。明细：4 张 ASRock Radeon AI PRO R9700 Creator 32GB（共 128GB 显存）7,244.58 美元，每张卡功耗上限 210W；二手 AMD EPYC 7452（32 核）127.17 美元；ASRock Rack ROMED8-2T/BCM 主板 1,162.39 美元（全球缺货期间从赫尔辛基购得）；8 条 16GB DDR4-2666 ECC RDIMM 插满八个通道 860.59 美元；SilverStone HELA 2050R 白金电源 578.92 美元；SilverStone RM44 4U 机箱 388.40 美元；三星 990 PRO 1TB 254.39 美元；散热器与风扇 117.48 美元。显卡约占成本的三分之二。这些机器同时承担业务的 CI/CD；作者称只要把优先级调向推理，Rust 构建运行良好，推理吞吐没有可测量的变化，构建仅慢 3–8%。

软件方面：vLLM-Radiance 1.0.387（vLLM 0.30.0、ROCm 7.14），使用 Qwen/Qwen3.8-27B-FP8 官方 FP8 检查点、FP8 KV 缓存，以及模型自带的 MTP 头（8 个草稿 token）。每台机器运行两个引擎，各为 TP=2、每引擎 8 条序列、最大上下文 256K，每引擎约 488K token 的 KV 缓存。在测试过的多个模型中，GLM 效果最好，Qwen 性价比最高。

基准测试（vllm bench serve，单机，2×TP2）：1 用户 MT-Bench 为 53.1 tok/s，TTFT p50 为 125 毫秒；16 用户合计 484 tok/s，每用户约 40 tok/s；16 用户随机 1024 入 / 512 出合计 623 tok/s，四卡平均功耗 837W；32 用户 603 tok/s。MTP 接受率随文本变化很大：在 JSON 抽取任务中草稿接受率为 83%（每步 7.6 个 token），而 MT-Bench 仅 39%（每步 2.7 个），因此 MT-Bench 会低估结构化输出的表现。8 条不同真实长文本提示（每引擎 4 条）的预填充吞吐从 4K 时的 7,044 tok/s 降到 64K 时的 5,961 tok/s；4×128K（TP=4）为 3,344 tok/s，4×256K 为 2,719 tok/s；所有提示均不重复，前缀缓存命中率为 0%。

## 媒体

![图片: 4x R9700 builds with &#36;127 used EPYCs: &#36;10.7k all-in per machine. I built three &#40;384GB VRAM&#41;](<https://preview.redd.it/ok6jarmvzivh1.jpg?width=140&height=105&auto=webp&s=9695a3c78461da07086c738e105c7e5a6e9ff5d5>)

[图片: 4x R9700 builds with &#36;127 used EPYCs: &#36;10.7k all-in per machine. I built three &#40;384GB VRAM&#41;](<https://preview.redd.it/ok6jarmvzivh1.jpg?width=140&height=105&auto=webp&s=9695a3c78461da07086c738e105c7e5a6e9ff5d5>)

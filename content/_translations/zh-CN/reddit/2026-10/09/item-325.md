---
publish: true
content_type: "post"
title: "开发者做出 prompt-cache-lens，定位悄悄破坏 Anthropic 提示缓存的字符"
description: "开发者 /u/skeletonita 描述了在没有任何报错的情况下排查“提示缓存命中率为 0%”的经历，并为此开发了开源工具 prompt-cache-lens 来精确定位原因。帖子称，提示缓存可将 Claude 的输入 token 成本降低最多 90–95%，在 Sonnet 5.5 上低至每百万 token 0.10 美元，但前提是前缀必须 100% 精确匹配。 据帖子描述，缓存未命中时 Anthropic API 不会抛出错误，而是返回 cache_read_input"
date: "2026-10-09T14:09:37.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1mdl5/prompt_caching_gave_us_a_0_hit_rate_without/"
tags: ["source/reddit","topics/inference","topics/coding"]
---

开发者 /u/skeletonita 描述了在没有任何报错的情况下排查“提示缓存命中率为 0%”的经历，并为此开发了开源工具 prompt-cache-lens 来精确定位原因。帖子称，提示缓存可将 Claude 的输入 token 成本降低最多 90–95%，在 Sonnet 5.5 上低至每百万 token 0.10 美元，但前提是前缀必须 100% 精确匹配。

据帖子描述，缓存未命中时 Anthropic API 不会抛出错误，而是返回 cache&#95;read&#95;input&#95;tokens: 0、按全价计费，并增加 3–5 秒的预填充延迟。文中列出的常见“元凶”包括：在系统指令中注入动态时间戳或日期（例如“Current time: ...”）、工具定义中键顺序不稳定或 JSON schema 未排序、提示模板中混入 Windows 的 &#92;r&#92;n 与 Unix 的 &#92;n 换行符，以及把临时缓存断点设置在短于 Anthropic 最低 1,024 token 要求的前缀上。

该工具被描述为一个零依赖的 CLI 与本地代理，包含三种用法。CLI diff 模式比较两个 turn 文件，可视化前缀断裂的确切 token、标出根本原因，并计算每次请求损失的费用。实时代理模式将流量转发到 Anthropic API 端点，把客户端 baseURL 指向它即可在对话过程中观察命中率和断点。交互式 demo 在终端中模拟三种常见失败场景。工具已发布在 GitHub 与 npm 上（作者账号下）；帖子未提供对该工具检测准确性的独立验证。

---
publish: true
content_type: "post"
title: "计算器可估算自托管本地大模型服务器的真实电费成本"
description: "一位花了很多个月调校本地大模型配置的 Reddit 用户分享了一个基于浏览器的计算器，围绕他认为大家真正关心的那个数字：自己跑模型的电费。 该工具输入 GPU 的功耗（瓦特）以及 token 速度（提示处理和解码分开计算），再结合用户每千瓦时的电价，输出每小时成本、每次请求成本、每月成本以及每百万输入 token 的成本，并分别给出有 KV 缓存和无 KV 缓存两种结果。工具内置三档 GPU 预设（RTX 4070 Ti Super、RTX 5090，以及 RTX 5090 "
date: "2026-10-09T08:39:14.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1g2kd/how_much_does_your_local_llm_server_really_cost/"
tags: ["source/reddit","topics/inference","topics/hardware"]
---

一位花了很多个月调校本地大模型配置的 Reddit 用户分享了一个基于浏览器的计算器，围绕他认为大家真正关心的那个数字：自己跑模型的电费。

该工具输入 GPU 的功耗（瓦特）以及 token 速度（提示处理和解码分开计算），再结合用户每千瓦时的电价，输出每小时成本、每次请求成本、每月成本以及每百万输入 token 的成本，并分别给出有 KV 缓存和无 KV 缓存两种结果。工具内置三档 GPU 预设（RTX 4070 Ti Super、RTX 5090，以及 RTX 5090 eco 省电档），用户可以从贴近现实的数字出发再自行调整。

缓存 token 的数学模型假设缓存 token 耗时是未缓存 token 的 1/100。固定的“现实场景”为 6 万输入 token、其中 5 万命中缓存、2 千输出 token、90% 在线时长。作为对照，每个自托管配置都在同一场景下与一个参考云 API 比较，该 API 定价为每百万输入 token 0.25 美元、每百万输出 token 1.20 美元，让用户判断自托管究竟省钱还是更贵。

作者认为，真正值得与云服务对比的是“每次请求”的成本，因为月账单不过是这个数字乘以实际请求量。所有计算都在浏览器中完成，不上传数据、无需注册；作者提到它是某个工具目录中 139 个免费工具之一。

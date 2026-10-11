---
publish: true
content_type: "post"
title: "用户称 Qwen3.8 Flash Next iq3_xxs 在编码任务上不如 27B"
description: "一位 Reddit 用户称，在自己的实测中，Qwen3.8 Flash Next 的 iq3_xxs 量化版本明显弱于同量化的 27B 模型。 核心测试是要求模型用单个独立 HTML 文件做出太阳系 3D 模拟，且禁用 Three.js、WebGPU 及任何额外库，只能用原生 HTML、CSS、JavaScript 和 SVG。Flash Next 反复失败：用户不得不追问好几次，而此时模型已经耗尽 12 万 token 的上下文上限；27B 模型则一次性“完美”完成同一提示"
date: "2026-10-09T09:50:42.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1h6tv/qwen38_flash_next_iq3_xxs_is_dumber_than_27b_iq3/"
tags: ["source/reddit","topics/models","topics/evaluation","topics/coding"]
---

一位 Reddit 用户称，在自己的实测中，Qwen3.8 Flash Next 的 iq3&#95;xxs 量化版本明显弱于同量化的 27B 模型。

核心测试是要求模型用单个独立 HTML 文件做出太阳系 3D 模拟，且禁用 Three.js、WebGPU 及任何额外库，只能用原生 HTML、CSS、JavaScript 和 SVG。Flash Next 反复失败：用户不得不追问好几次，而此时模型已经耗尽 12 万 token 的上下文上限；27B 模型则一次性“完美”完成同一提示。

用户也指出了这次失败中存在的取舍：Flash Next 版本做出了多得多的功能和相当复杂的界面，而 27B 的输出更简单，但确实能跑通。他把这个提示词当作快速感受模型水平的“体感”测试。

在之后的智能体编码任务中，发帖人表示 Flash Next“想得很宽”，但一到实现阶段就总是失败，需要多轮追问，整体消耗大量 token。他询问其他人是否有相同体验。

---
publish: true
content_type: "post"
title: "CommerceGen-Studio：面向商业级主图生成的端到端框架"
description: "CommerceGen-Studio 是一个端到端框架，用于为电商库存单位（SKU）生成商业级主图。它由信息抽取、语义改写与多条件生成三个阶段构成的流水线组织而成。 第一个组件是 Prompt-Eval-Refine-Loop Agent（PERL-Agent），它通过视觉语言模型与语言模型角色构成的迭代闭环，并以无参考评分量表打分，把异构的 SKU 元数据提炼为简洁的卖点文本列表。随后，Layout Thinker Optimization（LTO）通过交替的领域特定..."
date: "2026-10-14T17:59:48.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:43.420Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20603v1"
tags: ["source/arxiv","topics/products","topics/generative-media","topics/industry"]
---

CommerceGen-Studio 是一个端到端框架，用于为电商库存单位（SKU）生成商业级主图。它由信息抽取、语义改写与多条件生成三个阶段构成的流水线组织而成。

第一个组件是 Prompt-Eval-Refine-Loop Agent（PERL-Agent），它通过视觉语言模型与语言模型角色构成的迭代闭环，并以无参考评分量表打分，把异构的 SKU 元数据提炼为简洁的卖点文本列表。随后，Layout Thinker Optimization（LTO）通过交替的领域特定策略优化，使改写器与文案质量和渲染图像质量同时对齐。SKU-DiT 采用 Reinforce-Distill-Reinforce（RDR）渐进式训练，联合以白底产品图、商标裁剪图和结构化版式为条件，从而同时保持主体保真度、商标完整性与字符级文本准确性。

作者报告称，该框架已在生产中运行，每天处理数百万张主图，单张图像延迟仅为数秒；他们认为这使其成为首批以商业规模运行的此类系统之一。

他们还发布了 CommerceGen-Bench，这是一个从各商品类目线上真实流量中收集的困难案例基准。在该基准上，本框架在两条编辑赛道（有无提示增强）上均取得所评估开源基线中最高的总体得分。它也能与体量大得多的闭源模型相当，并在“指令遵循”与“商品整合”这两项决定图像能否发布的能力上超过其中若干模型。

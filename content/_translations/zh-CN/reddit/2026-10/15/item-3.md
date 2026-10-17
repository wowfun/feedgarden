---
publish: true
content_type: "post"
title: "Zellige AI 发布 Tessera-27B-B-CJK：用压缩 CJK 思考的编程智能体"
description: "Zellige AI 发布了 Tessera-27B-B-CJK，这是其「Tessera」系列的首款模型，基于 Qwen3.8-27B 微调，以 Apache-2.0 许可开放权重，目标是节省智能体循环中的 token 消耗。核心思路是：智能体循环在每一轮都要为「思考」付费，因此模型被训练成思考更少，并用「压缩 CJK」（混合英文、中文词与符号的简写）来思考。思考与输出被分离——推理使用简写，而回答与工具调用仍保持普通英文和代码，因此外部框架看到的仍是正常输出。作者将其..."
date: "2026-10-14T17:35:08.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:03:08.362Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x5xm28/tessera27bbcjk_zellige_ais_new_finetune_of_qwen/"
tags: ["source/reddit","topics/models","topics/coding","topics/agents"]
---

Zellige AI 发布了 Tessera-27B-B-CJK，这是其「Tessera」系列的首款模型，基于 Qwen3.8-27B 微调，以 Apache-2.0 许可开放权重，目标是节省智能体循环中的 token 消耗。核心思路是：智能体循环在每一轮都要为「思考」付费，因此模型被训练成思考更少，并用「压缩 CJK」（混合英文、中文词与符号的简写）来思考。思考与输出被分离——推理使用简写，而回答与工具调用仍保持普通英文和代码，因此外部框架看到的仍是正常输出。作者将其与 Bottlecap AI 的 thinkingcap 相提并论，并表示 Tessera 系列计划在 token 效率上走得更远。

示例：在一个真实的留出任务回合中，两次工具调用前仅用 27 个 token，推理内容大致是「查看 &#96;linter&#96; 包；查 &#96;FileWalker&#96;；查 checker 如何注册在 &#96;checkers&#96; 包中」。基础模型在同一步骤花费了 137 个 token；帖子说明这一回合比多数回合都短，典型回合大约只有一半。

数据均以未微调的 Qwen3.8-27B 为对照、在相同输入与 11 个留出的编程智能体任务上、以 xhigh 强度测得：每个智能体回合的思考 token 为基线的 0.50–0.64 倍（典型回合 0.496 倍，90% 置信区间 0.385–0.624；按 token 加权为 0.644 倍）；在 88 个匹配回合中工具调用有效率为 100%，重复循环为 0，与基线相同；在 101K–131K token 的提示上取得 6/6 有效工具调用，131K 以上测试较少，但已有结果依然成立。

帖子明确说明该模型是为智能体循环打造的：在竞赛数学和困难算法代码上应继续使用基础模型，因为 Tessera 在这些任务上得分更低且更容易陷入循环。评测仅针对 bf16 模型，GGUF 与 NVFP4 文件尚未测试。

训练使用 Tinker 上的四步短 LoRA，全部基于基础模型自身的输出：先将其思考改写为压缩 CJK 做种子 SFT，加入 token 级防循环修正，再做智能体 SFT，最后对最短且干净的 rollout 做拒绝采样。合并后的 bf16 权重以及 LoRA、GGUF、NVFP4 版本均可从所附 Hugging Face 仓库下载，论文同期发布。

## 媒体

![图片: Tessera-27B-B-CJK, Zellige AIs new finetune of Qwen with novel approaches to how we think about token savings](<https://preview.redd.it/6p5glarlxgvh1.jpeg?width=640&crop=smart&auto=webp&s=032776dbc50ea5d34856df85fff6a9f2236c3be6>)

[图片: Tessera-27B-B-CJK, Zellige AIs new finetune of Qwen with novel approaches to how we think about token savings](<https://preview.redd.it/6p5glarlxgvh1.jpeg?width=640&crop=smart&auto=webp&s=032776dbc50ea5d34856df85fff6a9f2236c3be6>)

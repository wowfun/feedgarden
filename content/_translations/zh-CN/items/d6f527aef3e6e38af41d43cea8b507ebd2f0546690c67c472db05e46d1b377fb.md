---
publish: true
content_type: "post"
title: "开发者开源 Game Summoner：多智能体“提示词生成游戏”流水线"
description: "gamesummoner.com 的开发者以 MIT 许可证开源了该系统，代码位于 ai-agent-test 仓库。项目可根据提示词生成可玩的游戏，作者称这是一个完整、可扩展、可部署的网站；它在他的 5090 配 64GB 内存上运行良好，但任何支持工具调用的模型都应能胜任。作者强调这不是一个开箱即用的干净仓库：配置是为他本人基于 Digital Ocean、并以 RunPod 和 AWS 作为托管 GPU 的部署定制的，不过 scripts/local_gpu.py 脚本"
date: "2026-10-08T17:09:01.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x0wki3/open_sourcing_game_summoner_my_prompt_to_game_site/"
tags: ["source/reddit","topics/agents","topics/coding"]
---

gamesummoner.com 的开发者以 MIT 许可证开源了该系统，代码位于 ai-agent-test 仓库。项目可根据提示词生成可玩的游戏，作者称这是一个完整、可扩展、可部署的网站；它在他的 5090 配 64GB 内存上运行良好，但任何支持工具调用的模型都应能胜任。作者强调这不是一个开箱即用的干净仓库：配置是为他本人基于 Digital Ocean、并以 RunPod 和 AWS 作为托管 GPU 的部署定制的，不过 scripts/local&#95;gpu.py 脚本能帮助大部分本地运行流程。

架构与生成流程：

- 请求进入基于 SQL 的队列（选择它是因为便宜且在这个规模上够用），worker 长轮询领取任务并返回结果。
- 一个简单的自动扩缩器管理 worker 机器，按成本从低到高依次尝试 AWS 与 RunPod，找出最便宜的可用 GPU 并启动推理实例。
- 生成阶段用一组智能体先产出设计文档：第一个智能体写高层设计，第二、第三个并行负责视觉与工程，第四个作为集成者把各部分合成最终设计。
- 随后同一个模型收到新提示词，实质上是“按设计文档把游戏做出来”，并可调用工具测试游戏、截图，直到它调用 done。
- 验证包含一次自动“试玩”：模型查看截图、尝试输入并观察结果；异常和没有任何效果的输入会作为反馈返回，循环直到不再出现，才标记为完成。

推理方面，本地使用 ninfer 跑 Qwen 3.8 27B，生产环境在租用的 RTX 6000 上使用修改版 SGLang 跑 Qwen 3.8 Flash-Next，图像模型使用 ComfyUI。此外还需两个配套仓库（gamesummoner-workers 与 gamesummoner-images）。作者表示所用模型许可证合规，并估计借助智能体大约几天即可搭建完成，同时提到自己目前处于失业状态。

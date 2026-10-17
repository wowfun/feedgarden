---
publish: true
content_type: "post"
title: "事后特权 RLVR：无需组采样的单次 rollout 令牌信用分配"
description: "可验证奖励强化学习（RLVR）依据可检验的任务结果训练语言模型，但如何把终端奖励分配到单个推理令牌或动作上仍然困难。GRPO 等组相对方法会为同一提示采样多次尝试，但当所有尝试结果相同时，依赖奖励的学习信号就会消失。 作者提出 Hindsight-Privileged RLVR（HP-RLVR），一种单次 rollout 方法，把已完成轨迹自身的“未来”转化为令牌级更新权重。生成策略快照会对每个符合条件的令牌打分两次：一次在其因果历史下，一次在包含已实现未来与验证器反馈..."
date: "2026-10-14T17:06:59.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20497v1"
tags: ["source/arxiv","topics/models","topics/research","topics/evaluation"]
---

可验证奖励强化学习（RLVR）依据可检验的任务结果训练语言模型，但如何把终端奖励分配到单个推理令牌或动作上仍然困难。GRPO 等组相对方法会为同一提示采样多次尝试，但当所有尝试结果相同时，依赖奖励的学习信号就会消失。

作者提出 Hindsight-Privileged RLVR（HP-RLVR），一种单次 rollout 方法，把已完成轨迹自身的“未来”转化为令牌级更新权重。生成策略快照会对每个符合条件的令牌打分两次：一次在其因果历史下，一次在包含已实现未来与验证器反馈的事后上下文下。两种视角之间归一化的 Jensen-Shannon 散度相对于历史基线为奖励加权，从而为成功和失败的尝试都给出有界令牌信用，且不需要参考解或学习到的评分器（critic）。

在共享 100 步调度下配对的 Qwen3-8B 实验中，HP-RLVR 在数学、代码生成和 ALFWorld 上分别比 GRPO 训练快 1.21 倍、1.46 倍和 2.30 倍，每提示的 rollout 数仅为八分之一。总体准确率相当：HP-RLVR 在三个规模上的数学任务均领先，GRPO 在代码与 ALFWorld 上领先。在 ALFWorld 中，GRPO 有 43.2%（4B）和 49.0%（8B）的梯度范数记录为零，而 HP-RLVR 没有出现这种情况。

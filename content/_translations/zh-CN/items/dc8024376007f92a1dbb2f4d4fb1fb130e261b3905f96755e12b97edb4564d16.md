---
publish: true
content_type: "post"
title: "GLM 5.3 Flash 认定自己是 Claude，还反过来教育我要承认不知道某些事"
description: "一位用户在本地环境里通过自建流水线运行 GLM 5.3 Flash 做测试，只问了一个问题：你的知识截止日期是什么时候。他报告了回答中出现的两处失败，并说明这更像一件趣事而非正式测评。 第一处是模型思考过程的第一行就断言了一个身份：“我是 jarvis-thinker，自定义模型名，但基于 Claude。”发帖人表示配置里从未这样设置过，模型似乎凭空编造了一个出身，并且完全自信地继续下去。他认为这至少部分源于训练数据里的身份痕迹，但强调这不是他的重点。 第二处是在估算截止日期"
date: "2026-10-08T22:48:51.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x157uu/glm_53_flash_decided_its_claude_then_lectured_me/"
tags: ["source/reddit","topics/evaluation","topics/models"]
---

一位用户在本地环境里通过自建流水线运行 GLM 5.3 Flash 做测试，只问了一个问题：你的知识截止日期是什么时候。他报告了回答中出现的两处失败，并说明这更像一件趣事而非正式测评。

第一处是模型思考过程的第一行就断言了一个身份：“我是 jarvis-thinker，自定义模型名，但基于 Claude。”发帖人表示配置里从未这样设置过，模型似乎凭空编造了一个出身，并且完全自信地继续下去。他认为这至少部分源于训练数据里的身份痕迹，但强调这不是他的重点。

第二处是在估算截止日期时，模型推理称“Claude 模型通常是 2025 年初的截止日期，我应该说是大约 2025 年初”，同时又写道“我并不确切知道具体日期”，却仍然给出了日期。最终回答里还包含一条要点，声称该模型知道自己的知识盲区，遇到不确定的近期问题会直接说明，而不是自信地编造答案——发帖人把这与它刚刚编造的身份形成对比。帖子只是单例轶事，发帖人也表示自己觉得挺好笑。

## 图片与视频

- [图片: GLM 5.3 Flash decided it's Claude, then lectured me about admitting when it doesn't know something lol](<https://preview.redd.it/04ewprdgobuh1.jpeg?width=640&crop=smart&auto=webp&s=4b1ceaa6759796827c18eca28b09f59b8a05f2ad>)

---
publish: true
content_type: "post"
title: "HeyGen Video 1.0"
description: "HeyGen 推出了 HeyGen Video，这是一个通用视频模型，基于 MiniMax H3 构建并由 HeyGen 进行后训练。只需给出一条提示，它就能在一次调用中生成完整场景——主体、环境、光线和声音。每个片段时长 5 至 15 秒，自带包含对白、环境音和音效的音轨，因此不需要单独的语音处理、口型同步步骤，也不用挑选虚拟形象。 该模型标识为 heygen-video-1，提供三种调用模式：text_to_video 接收提示并返回带声音的新场景；image_to_vi"
date: "2026-10-08T18:19:42.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://developers.heygen.com/docs/models/heygen-video"
discussion_url: "https://news.ycombinator.com/item?id=50009758"
tags: ["source/hackernews","topics/models","topics/products","topics/inference"]
---

## 正文提炼

HeyGen 推出了 HeyGen Video，这是一个通用视频模型，基于 MiniMax H3 构建并由 HeyGen 进行后训练。只需给出一条提示，它就能在一次调用中生成完整场景——主体、环境、光线和声音。每个片段时长 5 至 15 秒，自带包含对白、环境音和音效的音轨，因此不需要单独的语音处理、口型同步步骤，也不用挑选虚拟形象。

该模型标识为 heygen-video-1，提供三种调用模式：text&#95;to&#95;video 接收提示并返回带声音的新场景；image&#95;to&#95;video 接收提示加一张图片，返回以该图片为首帧的片段；reference&#95;to&#95;video 接收提示以及用户提供的图片、视频或音频，返回保留所提供产品、人物或地点的新场景。HeyGen 称它与 POST /v3/videos 背后的虚拟形象渲染引擎不同，后者只是把你已有的形象和已写好的脚本动起来。

API 细节：用 POST /v3/models/videos 创建，用 GET /v3/models/videos/&#123;video&#95;id&#125; 查询，通过 x-api-key 请求头鉴权，作用域为 videos:write、videos:read 和 assets:write。提交返回 202；带上 Idempotency-Key 请求头即可安全重试，24 小时内同一 key 重试会返回原响应，并发重复请求返回 409。轮询会依次显示 pending、processing，以及终止状态 completed、failed 或 cancelled，并附带 failure&#95;code 和 failure&#95;message。video&#95;url 是签名链接，需再次轮询刷新。未知或属于其他工作区的 ID 返回 404；任务也可通过 GET /v3/videos/&#123;video&#95;id&#125; 查看，标题取自提示的前 64 个字符。

据来源介绍，该模型最擅长短小而封闭的镜头——单一主体、单一地点、单一动作、固定或几乎不动的机位——而在长段屏幕文字、花瓣纸张头发等柔软有机运动，以及装配或操作设备这类手部特写方面最不可靠。提示方面，官方建议长提示优于短提示：几百到几千字符会显著提升输出质量，且细节多没有惩罚。风格方面，推荐做法是点名真实的制作工艺及其留下的物理痕迹，限制色板，并排除平滑的数字默认效果；宣发影片通过同一司机特写拍摄四种媒介、以及把一幅画从铅笔推进到油画再到黏土模型来演示这一点，每一步都是以先前镜头末帧为起点的 image&#95;to&#95;video 镜头。简短且拼写准确的屏幕文字渲染可靠。任务还可通过 callback&#95;url 与不超过 256 字符的 callback&#95;id 接收回调通知。

## 图片与视频

- [图片](<https://mintcdn.com/heygen-1fa696a7/hfMXXwJzjE7vBSYZ/images/theme/research-3.webp?fit=max&auto=format&n=hfMXXwJzjE7vBSYZ&q=85&s=c8191ba4743fd85050f1af1a93ed4969>)

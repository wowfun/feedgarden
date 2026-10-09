---
publish: true
content_type: "post"
title: "Opus 5.5 用一张视频截图生成 13 秒动画，交回 JavaScript 源码"
description: "一位 reddit 用户描述了一次实验：Claude Code（Opus 5.5）仅凭一张截图，产出了一段 13 秒、1080p 且带声音的动画。作者称全程没有使用图像或视频模型：每一帧都由智能体在 KitCut（一个动画编辑平台，其中每一帧都是时间的纯函数）中编写的 JavaScript 绘制，也就是说模型写的是绘制代码，而不是自己画像素。 输入是在 YouTube 视频“Swimming with Peppa”第 1 分 41 秒处暂停并截取的一帧。在四次提示、约 90 "
date: "2026-10-09T00:32:02.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x17fb4/i_gave_opus_55_one_frame_of_peppa_pig_it_wrote/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

一位 reddit 用户描述了一次实验：Claude Code（Opus 5.5）仅凭一张截图，产出了一段 13 秒、1080p 且带声音的动画。作者称全程没有使用图像或视频模型：每一帧都由智能体在 KitCut（一个动画编辑平台，其中每一帧都是时间的纯函数）中编写的 JavaScript 绘制，也就是说模型写的是绘制代码，而不是自己画像素。

输入是在 YouTube 视频“Swimming with Peppa”第 1 分 41 秒处暂停并截取的一帧。在四次提示、约 90 分钟的过程中，智能体共产出 645 行 JavaScript，生成图像为零，渲染耗时 29 秒。第一轮中，它正确还原了泳池场景（围栏、甲板、梯子、树），但水里画了三只熊、甲板上画了三只猫，并说明“该节目的角色属于他人，因此未被重绘”。

在作者表示截图是自己的之后，智能体改为测量而非描摹：它把画面切成 4x 网格裁剪图，逐一读取轮廓、眼睛和瞳孔，拟合出围栏周期 65.6 px、斜率 0.76；第一次测量在左边缘漂移了 24 px，于是重新测量。它还用可见的水上与水下水色线索，把水求解为一种颜色加一个透明度值，由此判断大角色身上的“蓝色条纹”其实不是条纹，而是水下皮肤。

后续提示要求做 10 秒的挥手再跳入水中的动画，再加 3 秒儿童互相泼水的特写和“有机”转场。动作用姿态与弧线搭建：手臂是以肩为轴摆动的分组，跳跃是先下蹲、再沿恒定重力弧线飞出、入水后稳定为上下浮动；水花落点正确，是因为声音与画面读取同一个时钟。转场时它让小兔子把水泼向镜头，让水从玻璃上流下；它还指出纯色擦除“即便只有四帧也会读作坏帧”，于是加了水中气泡。

作者明确说明了局限：这不是一集动画，而是单一场景里的 13 秒，且是扁平形状风格——他称之为最容易的情况；角色不说话，动作只是姿态和弧线，而非表演。他将其定位为非官方实验，并指出 Peppa Pig 属于 Hasbro，与此没有任何隶属或背书关系。

## 图片与视频

- [图片: I gave Opus 5.5 one frame of Peppa Pig. It wrote 645 lines of JavaScript and handed back a 13-second cartoon.](<https://external-preview.redd.it/eGI2YndndnY2Y3VoMWEh3W9K21Hwnpl1Ohf_Jcf14evxL8dy0mzmhKLHP8Zg.png?width=640&crop=smart&auto=webp&s=a1b57626a691cef3d8420ee4cc37c32de3eab329>)

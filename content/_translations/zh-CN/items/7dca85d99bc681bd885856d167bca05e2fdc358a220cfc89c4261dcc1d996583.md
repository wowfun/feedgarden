---
publish: true
content_type: "post"
title: "非营利组织上线达·芬奇数字博物馆，代码主要由 Claude 编写"
description: "一家德国非营利组织推出了 Museum of Ages，其首个展馆是一座数字达·芬奇博物馆，可在浏览器和手机上运行，并提供七种语言。其中五种为机器翻译，并在页面中明确标注。免费参观，无需账号。 展馆包含可细看的细节，例如《蒙娜丽莎》颜料上的裂纹；一个镜像视图可以把达·芬奇的镜像书写翻转过来阅读；15 台机器中有 14 台可由参观者自己启动。达·芬奇最后的住所被呈现为 1517 年 10 月 10 日这一天的场景，该日期来自一位访客的日记。参观沿一条固定的影片式路线进行，不能自"
date: "2026-10-09T09:47:35.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1h53t/our_nonprofit_built_a_digital_leonardo_da_vinci/"
tags: ["source/reddit","topics/agents","topics/coding","topics/products"]
---

一家德国非营利组织推出了 Museum of Ages，其首个展馆是一座数字达·芬奇博物馆，可在浏览器和手机上运行，并提供七种语言。其中五种为机器翻译，并在页面中明确标注。免费参观，无需账号。

展馆包含可细看的细节，例如《蒙娜丽莎》颜料上的裂纹；一个镜像视图可以把达·芬奇的镜像书写翻转过来阅读；15 台机器中有 14 台可由参观者自己启动。达·芬奇最后的住所被呈现为 1517 年 10 月 10 日这一天的场景，该日期来自一位访客的日记。参观沿一条固定的影片式路线进行，不能自由漫游，目前也只有一个展馆。

团队介绍了制作流程：由一个协调会话把工作分派给各个智能体，每个智能体在各自的 git worktree 中、依据写明其负责文件的任务说明工作，任何内容合并前要经过 30 多个检查器。油画、素描和笔记页为复制品，材质为 CC0 照片扫描，少量道具为 CC0 模型。展厅和机器用 three.js 以代码搭建，大部分由 Claude 编写；15 台机器中，能运动的 14 台由 Claude Opus 5.5 编写。

仓库清单记录了每台机器代码的编写模型。147 条记录中没有任何一条提到图像模型，17 条提到第二个模型，它编写了第十五台机器（降落伞）、阅览室的桌子和一台工作台。Claude 依据每个事实都有出处的资料文件起草博物馆文本，团队逐条校对并批准所有英文和德文内容；达·芬奇本人的原话在没有现成译文时由机器翻译，并有第二次盲检，页面标明未经人工审校。另一个独立的 Claude 实例在不知道哪张是新图的情况下评判前后图片，更好的一张才会发布。代码采用 AGPL-3.0 许可，项目声明不使用跟踪 cookie，也不做用户画像。

## 图片与视频

- [图片: Our nonprofit built a digital Leonardo da Vinci museum. Claude wrote most of the code.](<https://external-preview.redd.it/MHN2MHhxdWF4ZXVoMamRg6V3h5uhxz4TrnqVI6-nfH4ntp6JPidiy3QIdPB8.png?width=640&crop=smart&auto=webp&s=b4177a22a44ce7ac815905a3343381097b7b1534>)

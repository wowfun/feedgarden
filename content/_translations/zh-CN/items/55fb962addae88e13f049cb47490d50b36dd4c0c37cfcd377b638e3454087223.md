---
publish: true
content_type: "post"
title: "用 Claude 和 Codex 做了九个月视频应用：从选图到 HDR 与音频同步"
description: "一位开发者讲述了耗时九个月开发的 Immich Memories：一款免费、MIT 许可、可自托管的照片影集应用，能把个人图库变成带标题、音乐和可选行程地图的年度回顾影片，并可完全在本地运行。它起源于一个周末项目——作者怀念 Google Photos 为自己孩子的照片自动生成的回忆影集，而他的照片存在自托管图库 Immich 里。代码大部分由 Claude 和 Codex 编写，但作者表示产品创意必须由他提供，并且他需要学会把工程控制在可控范围内。 选片是最大的教训。第一版"
date: "2026-10-09T12:40:37.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:20:47.849Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x1kbiy/nine_months_building_a_video_app_with_claude_and/"
tags: ["source/reddit","topics/products","topics/coding","topics/agents"]
---

一位开发者讲述了耗时九个月开发的 Immich Memories：一款免费、MIT 许可、可自托管的照片影集应用，能把个人图库变成带标题、音乐和可选行程地图的年度回顾影片，并可完全在本地运行。它起源于一个周末项目——作者怀念 Google Photos 为自己孩子的照片自动生成的回忆影集，而他的照片存在自托管图库 Immich 里。代码大部分由 Claude 和 Codex 编写，但作者表示产品创意必须由他提供，并且他需要学会把工程控制在可控范围内。

选片是最大的教训。第一版给每张照片打分并保留分数最高的，技术上可用，但影片平淡。模型把一张验孕棒阳性照片从年度回顾里剔除了，因为它的 0.455 分低于 0.53 的阈值。作者结合自己学摄影的经历，把流程改为筛选、按时刻分组、组内挑选、再排序，成片明显变好。没有任何模型提出过这个改动，模型们只是很乐意按照要求把打分系统建出来。

媒体处理比预想复杂得多。应用要从增益图重建 HDR 照片，保持 HLG 和 PQ 视频观感正确，为 SDR 输出做色调映射，还要绘制在 HDR 上不刺眼的标题。Live Photo 需要把重叠的运动部分拼接起来，而快门时间戳精度不够，于是应用通过匹配音频来寻找接缝。一个具体例子：30 fps 下 0.25 秒的淡入淡出变成了七帧，即 0.2333 秒，而音频仍然重叠整个 0.25 秒，在 48 kHz 下每次接缝多出 800 个采样。74 次淡变累积下来，声音会提前一秒以上。为了证明问题，作者用一段合成的场记板影片（闪光加蜂鸣）从渲染结果中测量；修复后，75 个片段的测试首尾漂移为 0.7 毫秒。只看一小段预览是发现不了的。

模型同样需要证据。一次训练实验花了 34 小时标注，却输给了一条基于应用已有数据的简单规则，于是被删除。作者认为在双核群晖上渲染，比开发机更能提醒他真实用户的硬件水平。现在的默认设置无需 LLM 或 GPU 就能生成完整影片，可选模型再做优化。

智能体工作流依赖关卡：每个 PR 都要通过类型、复杂度、安全和测试套件检查，与本地运行的是同一套。但关卡也可能被愚蠢地满足——500 行的文件上限产生了 23 个 mixin，其中装配器上就有 11 个，文件变小了而设计变差了；修复它需要改结构，并写下这条规则到底想保护什么。产品规则及其理由现在写在智能体最先读取的文件里，因为智能体总在推翻前几次会话里已定的决策。在记录中的某一天，Opus 在 Sonnet 写的九个影片修复中发现了八个存在缺陷，尽管测试全绿，不过作者把这看作再做一次审查的依据，而非保证。让 Codex 审查 Claude 的 PR、反之亦然也很有帮助，尤其是在复杂改动上。作者并不逐一看 diff，而是定方向、抽查部分改动并评判影片，因为测试全绿并不能说明影片是否乏味。发版还会在 Mac、Linux、NAS 和 Kubernetes 上用真实图库跑一遍，截图和演示视频都有可重建的配方。目前它已在作者自己的图库里按 nightly 计划运行，他很少再需要编辑器。

## 图片与视频

- [图片: Nine months building a video app with Claude and Codex, from picture selection to HDR and audio sync](<https://external-preview.redd.it/dawU9ifdhu-Oz9WQ-kS_DXqb3GqfXM819sPmrGYVE6A.jpeg?width=640&crop=smart&auto=webp&s=06b92d5d860b677096f913ab1276b034c2bedfcc>)
- [视频: Here's a film made from public CC0 footage](<https://sam-dumont.github.io/immich-memories/demo/trip-preview.mp4>)

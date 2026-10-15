---
publish: true
content_type: "post"
title: "腾讯发布 5B 全模态文档解析模型 Youtu-Parsing-Omni"
description: "腾讯发布了 Youtu-Parsing-Omni，被描述为一个紧凑的 5B 全模态解析模型。只需单一输入——文档页面、自然图像、图表或流程图、几何图形、音频片段或音视频——它就能产出一个统一的 JSON 信封式输出，同时覆盖感知与认知两个层面。 感知类输出包括版面元素、文本、表格、公式、边界框、时间戳、ASR、OCR、声学事件和镜头运动；认知类输出则包括图像说明、叙述和报告。具体输出哪一类由任务提示词决定（示例中的 --task 参数，对应 prompts/youtu_..."
date: "2026-10-09T12:03:32.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1jk9z/tencentyoutuparsingomni_hugging_face/"
tags: ["source/reddit","topics/models","topics/research"]
---

腾讯发布了 Youtu-Parsing-Omni，被描述为一个紧凑的 5B 全模态解析模型。只需单一输入——文档页面、自然图像、图表或流程图、几何图形、音频片段或音视频——它就能产出一个统一的 JSON 信封式输出，同时覆盖感知与认知两个层面。

感知类输出包括版面元素、文本、表格、公式、边界框、时间戳、ASR、OCR、声学事件和镜头运动；认知类输出则包括图像说明、叙述和报告。具体输出哪一类由任务提示词决定（示例中的 --task 参数，对应 prompts/youtu&#95;parsing&#95;omni.json 中的键）。

支持的任务族及其主要输出内容：
- document：带边界框的版面元素、文本、LaTeX、OTSL 表格、Markdown 图表、Mermaid 流程图、阅读顺序。
- natural&#95;image：带边界框的实体与文本、标签、图像说明、全局描述。
- graphics&#95;chart：单个图表元素，输出为 Markdown 表格及注释、图注。
- graphics&#95;flowchart：单个流程图元素，输出为 Mermaid 及图注。
- graphics&#95;geometric：单个几何元素，包含点、线、弧、形状、几何关系与测量值。
- audio：带时间戳的人声与非人声片段、说话人、ASR、音色，以及场景说明和声学事件。
- natural&#95;video：按时间切分的片段，包含视觉元素、动作、交互、镜头运动与音轨。
- textrich&#95;video：含 OCR 与 ASR 的片段，以及整段视频的 Markdown structured&#95;report。

官方给出的亮点包括：统一 schema，一个 JSON 信封由任务提示词驱动覆盖七个解析族；单一模型中的全模态编码器可处理图像、音频以及交错的音视频输入（帧加音轨）；小模型取得强劲成绩，在 OmniDocBench v1.6 上达到 96.96 总分的最优水平，在 OmniParsingBench 上以 75.08 平均分成为最佳开源权重模型（仅次于 Gemini-3-Pro），在化学结构（ChemOCR）与乐谱（PDMX-Synth）识别上也与专用模型相当。发布内容包含 vLLM 插件、固定的服务配置、任务提示词与推理示例。

## 媒体

![图片: tencent/Youtu-Parsing-Omni · Hugging Face](<https://external-preview.redd.it/IOBGwlG1GLeePwVjEukOZAnpm3Exke5IVIyCT999tcc.png?width=640&crop=smart&auto=webp&s=92e43f735caa647c81054cba869632fd1b787ce5>)

[图片: tencent/Youtu-Parsing-Omni · Hugging Face](<https://external-preview.redd.it/IOBGwlG1GLeePwVjEukOZAnpm3Exke5IVIyCT999tcc.png?width=640&crop=smart&auto=webp&s=92e43f735caa647c81054cba869632fd1b787ce5>)

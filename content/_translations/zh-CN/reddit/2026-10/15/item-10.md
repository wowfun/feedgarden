---
publish: true
content_type: "post"
title: "Opus 5.5 被“削弱”了吗？Livenerf 第 20 天更新"
description: "三周前，作者启动了一个名为 LiveNerf 的项目，持续跟踪模型能力随时间的变化，目标是用一套无偏数据来验证 Anthropic 是否在发布后削弱自己的模型。作者表示此后每天都在持续测量。 目前的发现与作者认为社区预期的不太一样。从数据的前段来看，建立基线的头 10 天方差较高；而在随后的 11 天里，方差似乎在下降，并可能向均值回归。 基于此，作者表示：如果确实存在或曾经存在“削弱”，那么它并未出现在目前收集到的数据中。作者补充了两点重要限定：这并不意味着 Anth..."
date: "2026-10-14T19:10:24.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:05:18.966Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1x606aj/are_they_nerfing_opus_55_livenerf_day_20_update/"
tags: ["source/reddit","topics/evaluation","topics/models","topics/research"]
---

三周前，作者启动了一个名为 LiveNerf 的项目，持续跟踪模型能力随时间的变化，目标是用一套无偏数据来验证 Anthropic 是否在发布后削弱自己的模型。作者表示此后每天都在持续测量。

目前的发现与作者认为社区预期的不太一样。从数据的前段来看，建立基线的头 10 天方差较高；而在随后的 11 天里，方差似乎在下降，并可能向均值回归。

基于此，作者表示：如果确实存在或曾经存在“削弱”，那么它并未出现在目前收集到的数据中。作者补充了两点重要限定：这并不意味着 Anthropic 没有以其他方式降低能力；这也不能证明在任意一个 24 小时周期内逐日结果总是相同。作者指出，存在在一天中特定时段而非其他时段进行限流的可能性。

作者现在邀请社区参与：用自己的模型提问，或自行核查——“我是否在 Y 日的 X 时间感受到能力下降？如果是，受影响的是什么？”作者承认这类证词最多只能算轶事证据，但认为如果社区能看出某些日期与已收集数据之间存在不同关联，会很有意思。

作者感谢过去一个月的支持，提到项目在几周内收获了超过 1.5k 星，这是他们未曾预料到的，也从未想到会有人捐款。他们说所有捐款都将投入更多算力，以便扩大跟踪规模。作者不打算止步于 Opus 5.5，也不只跟踪“削弱”，并表示 10 天后会带着最终结论回来，用 LiveNerf 所收集的特定标准，初步证实或推翻模型能力下降的说法。

## 媒体

![图片: Are They Nerfing Opus 5.5? Livenerf Day 20 update](<https://preview.redd.it/735dcm8zehvh1.jpeg?width=640&crop=smart&auto=webp&s=81a415aa0e56aa2b28579c8c836c81084140a341>)

[图片: Are They Nerfing Opus 5.5? Livenerf Day 20 update](<https://preview.redd.it/735dcm8zehvh1.jpeg?width=640&crop=smart&auto=webp&s=81a415aa0e56aa2b28579c8c836c81084140a341>)

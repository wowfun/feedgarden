---
publish: true
content_type: "post"
title: "把 Haiku 5.5、Sonnet 5.5 与 Opus 5.5 当子智能体实测 6 个真实任务"
description: "一位用户把 Opus 5.5 在项目中已经完成的 6 个任务重新跑了一遍，改用 Sonnet 5.5 和 Haiku 5.5，全部采用 high effort，提示词和文件完全相同，再把每个结果与真实答案核对。 代码检索（为一个新功能找出所有需要改动的文件，真实改动数为 48 个）：Opus 找到 45 个，Sonnet 44 个，Haiku 44 个。成本为 Opus 6.17 美元、Sonnet 1.38 美元、Haiku 0.44 美元，因此作者认为在质量相当的情..."
date: "2026-10-09T06:39:53.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:21:48.097Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/ClaudeCode/comments/1x1e7ts/i_tested_haiku_55_sonnet_55_and_opus_55_as/"
tags: ["source/reddit","topics/evaluation","topics/models","topics/inference"]
---

一位用户把 Opus 5.5 在项目中已经完成的 6 个任务重新跑了一遍，改用 Sonnet 5.5 和 Haiku 5.5，全部采用 high effort，提示词和文件完全相同，再把每个结果与真实答案核对。

代码检索（为一个新功能找出所有需要改动的文件，真实改动数为 48 个）：Opus 找到 45 个，Sonnet 44 个，Haiku 44 个。成本为 Opus 6.17 美元、Sonnet 1.38 美元、Haiku 0.44 美元，因此作者认为在质量相当的情况下，Haiku 在价格上胜出。

网络调研共 3 个任务，对照官方规则手册和 Google 帮助页面核查，错误率差距很大。事实错误数：Opus 1、Sonnet 3、Haiku 10。在 Google Play 账号规则上，12 项关键事实中 Opus 全对（12），Sonnet 9，Haiku 5。Haiku 还打不开某个联赛的官方规则 PDF，于是沿用了上一赛季的规则。在发布前核查两篇博客文章时，找出的真实错误数为 Opus 8、Sonnet 7、Haiku 4；但把正确句子误判为错误的数量是 Opus 0、Sonnet 6、Haiku 30——作者说，如果照着 Haiku 的标注改，会删掉一半本来正确的文章。

五个网络相关任务的总成本为 Opus 3.93 美元、Sonnet 1.59 美元、Haiku 0.12 美元。作者目前的分工是：代码检索用 Haiku，调研与事实核查用 Opus，小错误可以容忍时用 Sonnet；并询问是否有人比较过 Sonnet 与 Opus 在调研上的表现，以验证这些结论是否站得住。所有成本数据均来自该用户自己的这几次运行。

---
publish: true
content_type: "post"
title: "ChronoCulture: Evaluating Cultural Awareness Across Time in Large Language Models"
description: "Cultural attitudes and social norms evolve over time, yet most cultural benchmarks for large language models treat culture as a static attribute of a country or region. The authors introduce ChronoCulture, a benchmark of 10,360 temporal ..."
date: "2026-10-14T16:50:35.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:35.641Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20472v1"
tags: ["source/arxiv","topics/evaluation","topics/culture-society","topics/models"]
---

Cultural attitudes and social norms evolve over time, yet most cultural benchmarks for large language models treat culture as a static attribute of a country or region. The authors introduce ChronoCulture, a benchmark of 10,360 temporal pairs built from longitudinal survey data across 72 countries.

Each pair contains the same survey question asked in the same country in an older and a newer year, with full population response distributions as ground truth.

Across six LLMs, the study finds that models can often predict a country's attitudes at one point in time but do not reliably capture how those attitudes change. Their predictions for different years tend to stay close together, failing to capture much of the observed change. Specifying the intended year in the prompt also offers little overall improvement in alignment with survey responses.

These findings suggest models often present a largely static picture of cultural attitudes, highlighting the need to evaluate cultural awareness across time.

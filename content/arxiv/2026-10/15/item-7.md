---
publish: true
content_type: "post"
title: "Equal CER, Unequal Damage: Severity-Weighted Character Error Rate for OCR"
description: "Character Error Rate (CER), the standard metric for OCR and vision-language models, charges a typo as much as a wrong name. The authors introduce semCER, which keeps CER's alignment and denominator but charges each grapheme edit a severi..."
date: "2026-10-14T16:44:22.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20461v1"
tags: ["source/arxiv","topics/evaluation","topics/models","topics/research"]
---

Character Error Rate &#40;CER&#41;, the standard metric for OCR and vision-language models, charges a typo as much as a wrong name. The authors introduce semCER, which keeps CER's alignment and denominator but charges each grapheme edit a severity assigned by an LLM judge, with no word segmentation required.

Normalized CER keeps the score of a whole transcription and tracks readers as well as semCER or better, while semCER breaks that score down into named edits. The severity charges track readers' ratings edit by edit in English, Vietnamese and Chinese, and place the edits readers rate most severe near the top of a sorted list. On pairs drawn where CER and semCER disagreed, readers side with semCER more often than with normalized CER in English and Chinese, and equally often in Vietnamese.

Across 16 languages, the judge charges a wrong diacritic or tone mark almost nothing in Spanish but nearly a wrong letter's severity in Telugu, showing that severity is language-dependent. Where real words can be counted, a general VLM's wrong letter forms one far above chance while a classical pipeline's stays near it. The authors release 61 million judged edits, the aggregated reader ratings and a distilled scorer.

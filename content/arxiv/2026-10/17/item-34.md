---
publish: true
content_type: "post"
title: "Tool-augmented LLM framework reaches 86.73% accuracy on MedCalc-Bench"
description: "Medical calculators turn raw patient observations into clinically actionable values and scores, but applying them to free-form patient notes requires precise variable extraction plus exact execution of complex formulas, scoring rules and..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21477"
tags: ["source/arxiv","topics/health","topics/agents","topics/evaluation"]
---

Medical calculators turn raw patient observations into clinically actionable values and scores, but applying them to free-form patient notes requires precise variable extraction plus exact execution of complex formulas, scoring rules and output conventions. Relying on direct LLM prompting is unreliable here, the authors argue, because rule recall, parameter extraction, arithmetic reasoning and formatting all become entangled in a single generative step.

The proposed tool-augmented framework separates those concerns. It retrieves and structures calculator specifications, generates reusable executable tools from them, and uses a constrained extractor to map each patient note to calculator-ready inputs. The tools then perform the calculation deterministically, so clinical language understanding is decoupled from rule execution and arithmetic.

On the MedCalc-Bench dataset the method reaches 86.73% final-answer accuracy, outperforming one-shot prompting and supervised fine-tuning-only baselines by 24.0 and 17.27 percentage points respectively. Ablation and error analyses attribute the gains primarily to rule-grounded tool synthesis and schema-constrained extraction. Remaining failures concentrate in clinical-semantic extraction and benchmark-specific output contracts, which indicates where further work is needed before such systems could be relied on in practice. The abstract reports a single benchmark and does not describe deployment testing, so the result should be read as evidence about calculation reliability rather than clinical validation.

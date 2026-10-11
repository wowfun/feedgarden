---
publish: true
content_type: "post"
title: "EgoVoice: Proactive Spoken Assistance from Egocentric Multimodal Streams"
description: "Wearable augmented reality (AR) assistants are moving toward continuous real-world interaction, perceiving the user's activity through first-person video and audio and offering timely spoken guidance without being explicitly asked. Proactiv"
date: "2026-10-08T16:24:12.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:52.195Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12248v1"
tags: ["source/arxiv","topics/agents","topics/models","topics/products"]
---

Wearable augmented reality &#40;AR&#41; assistants are moving toward continuous real-world interaction, perceiving the user's activity through first-person video and audio and offering timely spoken guidance without being explicitly asked. Proactive video assistants, spoken dialog systems and egocentric task understanding have each advanced quickly, but existing systems do not address the joint problem of deciding when to speak and what to say from continuous first-person streams.

The paper introduces EgoVoice, a framework for training and evaluating proactive egocentric spoken assistants. From HoloAssist video recordings of real human instructors, the authors build clean audio streams through source separation and speech resynthesis, and convert each video session into a format where the model must decide at every moment whether to stay silent or give spoken guidance. They fine-tune an omni-modal LLM on this data and further improve its proactive intervention behavior with direct preference optimization.

Experiments across closed and open-source models show that existing systems rarely produce well-timed, meaningful proactive interventions, while EgoVoice yields clear improvements in intervention timing, content relevance and human preference over the zero-shot backbone.

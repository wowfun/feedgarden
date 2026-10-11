---
publish: true
content_type: "post"
title: "From Prompting to Composing: A Spatial Canvas Interface for Poster Generation"
description: "Text prompting is an indirect interface for poster generation: users must encode inherently two-dimensional layout intent into a one-dimensional word sequence. The authors propose a Spatial Canvas Interface that lets users compose generatio"
date: "2026-10-08T16:16:06.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12230v1"
tags: ["source/arxiv","topics/models","topics/products","topics/agents"]
---

Text prompting is an indirect interface for poster generation: users must encode inherently two-dimensional layout intent into a one-dimensional word sequence. The authors propose a Spatial Canvas Interface that lets users compose generation intent directly in space through four complementary binding types — semantic, identity, text and pixel — plus Text Specifications for individual elements and global appearance.

Building on that interface, they develop Compo, a poster generation model adapted from a pretrained image editing model so it can read Spatial Canvas inputs and Text Specifications. Compo supports two modes: direct inference, where users explicitly construct the canvas, and an agentic mode, where a high-level request is automatically translated into a planned Spatial Canvas. To train it, the authors build a scalable pipeline that automatically constructs supervision data for each binding type and their combinations, allowing efficient adaptation without training a specialized poster generator from scratch.

They also introduce a benchmark that evaluates adherence to individual binding types and to their joint composition. Experiments report that Compo achieves stronger compositional controllability than both general-purpose image generation models and dedicated poster generation systems while maintaining high visual quality. The authors frame the contribution as decoupling intent specification from visual generation, shifting poster generation from prompting toward composing.

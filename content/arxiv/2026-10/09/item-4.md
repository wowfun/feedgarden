---
publish: true
content_type: "post"
title: "DVD: Dynamic Vector Decoding for Efficient MLLM-based Perception"
description: "Multimodal large language models (MLLMs) increasingly serve perception tasks used in human-machine interaction, robotics and autonomous driving, but existing MLLM-based perception methods usually rely on text-based coordinate representation"
date: "2026-10-08T16:32:28.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:23:47.674Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.12266v1"
tags: ["source/arxiv","topics/models","topics/inference","topics/research"]
---

Multimodal large language models &#40;MLLMs&#41; increasingly serve perception tasks used in human-machine interaction, robotics and autonomous driving, but existing MLLM-based perception methods usually rely on text-based coordinate representation, which carries excessive token overhead, or on fixed-range quantization, which is limited in range and precision — a particular problem in 3D settings with unbounded spatial range and high localization accuracy demands.

To address this, the authors propose DVD &#40;dynamic vector decoding&#41;, a method that unifies 2D and 3D perception task representation. Diverse perceptual outputs — 2D bounding boxes, 2D masks and 3D bounding boxes — are first transformed into 1D vector sequences and then mapped to compact discrete tokens in a high-dimensional space. A lightweight de-tokenizer then decodes the model's output tokens back into the original 2D and 3D perceptual representations, giving seamless integration with MLLMs.

Experiments on 2D and 3D perception benchmarks, including the RefCOCO series, SUN-RGBD, KITTI, Hypersim and nuScenes, report superior performance on both 2D and 3D tasks together with significantly reduced token overhead and inference latency. The authors position DVD as an efficient, general framework for adding perception capabilities to MLLMs while avoiding the limitations of prior coordinate encoding schemes.

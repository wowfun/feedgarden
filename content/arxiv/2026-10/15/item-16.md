---
publish: true
content_type: "post"
title: "PhySGA: A Physics-Space Grounded Agentic Framework for Generalizable and Interactive 3D Composition"
description: "3D object composition is central to digital content creation and robot simulation, and also serves as a critical testbed for physical intelligence in foundation models. Previous methods either use large language models to predict object ..."
date: "2026-10-14T17:47:24.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:08:29.710Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.20560v1"
tags: ["source/arxiv","topics/agents","topics/research","topics/hardware"]
---

3D object composition is central to digital content creation and robot simulation, and also serves as a critical testbed for physical intelligence in foundation models. Previous methods either use large language models to predict object coordinates directly or use generative diffusion priors to synthesize composite images for visual alignment. Both approaches rely on static priors in digital spaces and struggle with complex compositions such as precise hanging, gravity-driven settling and hidden containment, which require interactive construction involving global planning, fine-grained alignment and physical simulation.

To address this, the authors propose PhySGA, a physics-space grounded agentic framework for 3D composition via agent exploration and physical simulation, enabling universal interactive assembly of rigid, articulated and deformable objects. The authors note that applying vanilla LLMs or VLMs directly is insufficient, because current models lack grounded physical understanding and interactive construction experience. Their architecture is a collaborative feedforward-feedback design: an Assembly Agent handles geometric and kinematic reasoning for global step planning and coarse adjustment, while a Critic Agent reasons over contact dynamics for simulator state diagnosis and fine-grained closed-loop correction. Action Routers map semantic planning and analysis onto executable physical primitives inside the simulator, and a task-specific Self-Evolving Skill Library distills historical trial-and-error feedback into reusable experience, boosting success rates and reducing exploration attempts.

Experiments in Isaac Sim show that PhySGA substantially surpasses existing methods in relation fidelity, physical plausibility and visual quality.

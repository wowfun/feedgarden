---
publish: true
content_type: "post"
title: "Mallea: Building, Steering and Memorizing Worlds with a Coding Agent"
description: "Code world models represent world dynamics through explicit state and executable rules. Mallea investigates how object representations, behavioral revisions and visual memory can be coordinated within that formulation, and presents a sys..."
date: "2026-10-17T04:00:00.000Z"
updated: "2026-10-17T05:23:02.796Z"
first_seen: "2026-10-17T04:53:12.805Z"
date_basis: "published"
source_url: "https://arxiv.org/abs/2610.21283"
tags: ["source/arxiv","topics/agents","topics/coding","topics/generative-media"]
---

Code world models represent world dynamics through explicit state and executable rules. Mallea investigates how object representations, behavioral revisions and visual memory can be coordinated within that formulation, and presents a system for building, steering and memorizing worlds from text.

A coding agent infers the object-interaction requirements from the prompt and jointly plans object structure, properties and rules, favoring compact representations that still support those requirements. The world then evolves under the planned rules. Optional user actions can steer it, and text requests can edit properties or extend capabilities while preserving unaffected state. Object texture memory retains reusable appearance only for whitebox-defined objects and adapts that appearance as the objects change.

The program advances world state, while a generative renderer combines the current structure with remembered appearance. By organizing construction, intervention and memory around the same objects, Mallea conditions subsequent observations on the latest state and on appearance compatible with it.

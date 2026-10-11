---
publish: true
content_type: "post"
title: "Bevy 0.20 Released: Solari Pathtracer Gains DLSS and Metal Support"
description: "Bevy, the data-driven game engine written in Rust, shipped version 0.20 on crates.io, crediting 227 contributors and 817 pull requests since the previous release a few months ago. The project publishes a migration guide from 0.19 and remain"
date: "2026-10-08T22:57:50.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://bevy.org/news/bevy-0-20/"
discussion_url: "https://news.ycombinator.com/item?id=50013610"
tags: ["source/hackernews","topics/coding","topics/hardware"]
---

## Article

Bevy, the data-driven game engine written in Rust, shipped version 0.20 on crates.io, crediting 227 contributors and 817 pull requests since the previous release a few months ago. The project publishes a migration guide from 0.19 and remains free and open source, with community plugins and learning resources collected under Bevy Assets.

The headline work concerns Solari, Bevy's realtime path-traced renderer. Improved ReSTIR sampling makes rendering mostly unbiased and more accurate; moving objects no longer have shadows that lag behind them, and reflections shimmer less in motion, especially on non-metallic materials. Because DLSS-RR has improved substantially while ReSTIR costs meaningful performance and often does not improve image quality much, ReSTIR is now optional and off by default. Projects upgrading from 0.19 may see reduced shadow quality and missing shadows in motion in scenes with many lights if they do not set SolariLighting::restir. Solari's scene management code is now retained and more optimized, cutting CPU costs, and new fields expose knobs including world cache size, per-pixel light sample count, temporal accumulation and path tracing bounce count. Solari also supports macOS via Metal and adds lighting from Atmosphere and EnvironmentMapLights on cameras beyond the existing DirectionalLight and emissive mesh support.

Other highlights include BSN scene syntax changes aimed at easier reading and composition, plus an observable Ready event fired when all children of a scene entity have spawned. Bevy Feathers adds Color Input, Scrollable List View, Dropdown Selection and Lazy Menu widgets; the Number Input widget is now scrubbable and draggable, and headless tab widgets were added. Bevy has officially adopted WESL, a standardized extension of WGSL, as its shader language, superseding its old custom WGSL dialect. Users can now build custom shader materials for sprites, and 2D mesh materials can be extended as in 3D. A new pan-orbit camera enables CAD-like scene navigation.

## HN discussion

Based on 10 selected comments and replies.

A rendering contributor confirmed helping cut renderer CPU work to O&#40;number of changed entities&#41;, a change absent from the notes, but argued the BSN syntax is poor and worsening: too many sigils, with "--" separating list elements, and not being LR&#40;1&#41; as a sign of misdesign. That commenter wants the scene format redesigned editor-first with version-control merging as a priority. A reply said they had found the design trade-offs discussed in a Bevy issue and would have preferred semicolons and commas separating entities and components, but expects users to adapt to the double dash.

A long-time learner called Bevy fun but noted frequent breaking changes, judging it too immature to stake a commercial product on; a reply countered that a 0.2 version number conventionally signals breaking changes and unsuitability for commercial projects.

WESL's developer said the team is enjoying working with Bevy on the shading language and invited questions about the wsgl-analyzer language server and WESL compilers. One commenter praised the Solari path-tracing work and pointed to an introductory talk by Jasmine from a recent Bevy meetup.

Selected comments: [pcwalton](https://news.ycombinator.com/item?id=50015521) · [bluehex](https://news.ycombinator.com/item?id=50016322) · [david&#95;rugaex](https://news.ycombinator.com/item?id=50026159) · [i2talics](https://news.ycombinator.com/item?id=50015419) · [fourside](https://news.ycombinator.com/item?id=50019025) · [stefnotch](https://news.ycombinator.com/item?id=50023707)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50013610>)

## Images and video

- [Image: color input](<https://bevy.org/news/bevy-0-20/color_input.jpg>)
- [Image: scrollbar listview](<https://bevy.org/news/bevy-0-20/scrollbar_listview.jpg>)
- [Image: A Bevy fog shader with WESL syntax highlighting](<https://bevy.org/news/bevy-0-20/wesl_analyzer.png>)

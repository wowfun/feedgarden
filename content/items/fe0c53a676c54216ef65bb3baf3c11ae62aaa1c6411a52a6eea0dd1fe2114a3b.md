---
publish: true
content_type: "post"
title: "Builder details an Epyc-based inference rig upgrade with 72GB of VRAM"
description: "After asking for advice earlier, a Reddit user has ordered parts for an Epyc-based local inference system and outlined what the upgrade is expected to change. The order includes an Epyc 7443 CPU (24 cores, 48 threads, 128 lanes), an H12SSL-"
date: "2026-10-09T13:27:55.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1ld3q/epyc_inference_rigs/"
tags: ["source/reddit","topics/hardware","topics/inference"]
---

After asking for advice earlier, a Reddit user has ordered parts for an Epyc-based local inference system and outlined what the upgrade is expected to change. The order includes an Epyc 7443 CPU &#40;24 cores, 48 threads, 128 lanes&#41;, an H12SSL-NT-B motherboard &#40;the variant with two 10Gb Ethernet ports&#41;, and 256GB of 2666MHz 2Rx4 RAM.

Four GPUs will supply 72GB of VRAM in total: an RTX 3090 &#40;24GB&#41;, an RTX 5070 Ti &#40;16GB&#41;, and two RTX 5060 Ti cards &#40;16GB each&#41;.

Expected benefits:
- PCIe bandwidth roughly doubles for all four GPUs — from x4 to x8 for the 5060 Ti cards and from x8 to x16 for the other two — and all of them will run on proper CPU lanes instead of chipset lanes and improvised M.2 adapters.
- Memory bandwidth rises by at least 50%, from a theoretical 96GB/s to 170GB/s, perhaps around 140GB/s in practice.
- Total RAM increases by 192GB, from 64GB to 256GB, and the platform opens the option of adding more GPUs later.

The builder expects little change for dense models but hopes for a useful improvement in prompt processing from the higher link bandwidth, and is excited about a total memory pool of 328GB enabling workloads such as GLM5.3-flash and larger quants of Qwen3.8-flash-next. The motherboard has a two-week wait. They ask whether others have built something similar and how such systems handle large MoE models that fit entirely in RAM and VRAM.

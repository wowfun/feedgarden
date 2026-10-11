---
publish: true
content_type: "post"
title: "Release: Qwen-2B-RCOL dynamic low-bit quantization (IQ1_M, IQ2_M, IQ3_M)"
description: "The author released a research-oriented quantization method with working models, describing it as less a new model than a pseudo-new quantization technique. It modifies ISTALab's RCO algorithm so that models can be quantized under a strict "
date: "2026-10-09T06:14:39.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1dt7q/release_qwen2brcol_dynamic_lowbit_quantization/"
tags: ["source/reddit","topics/research","topics/models","topics/evaluation"]
---

The author released a research-oriented quantization method with working models, describing it as less a new model than a pseudo-new quantization technique. It modifies ISTALab's RCO algorithm so that models can be quantized under a strict VRAM budget. At its core it is an approximation algorithm that tries to close the remaining gap using several different strategies.

The author reports significant KLD improvements, especially in the 1-bit and 2-bit range, and says the approach should be model agnostic and does not require loading the FP16 teacher into VRAM. Method details are on the model card, and full recipes are planned for publication. The method will next be applied to larger models in the family.

For evaluation, both the new quants and standard llama.cpp imatrix quants were calibrated on the same wikitext imatrix dataset and tested on two held-out sets. The author built their own KL divergence table because Unsloth's table was unavailable, and reports that the dynamic quants substantially outperform standard imatrix KLD at very low bits per weight, notably cutting IQ1&#95;M divergence at nearly the same size budget. The author describes these as proof-of-concept quants, since 2B is a small model that suffers at such low BPW, and notes the standardized imatrix IQ1&#95;M version is far weaker on the same example. GGUF files are published on Hugging Face.

## Images and video

- [Image: Release: Qwen-2B-RCOL Dynamic Low-Bit Quantization &#40;IQ1&#95;M, IQ2&#95;M, IQ3&#95;M&#41;](<https://external-preview.redd.it/X6qeMmM77SD1SweowOh1F3dnm1dF95WhwiHpvkoDmEw.png?width=140&height=75&auto=webp&s=ed6bbc74b20d9c45055695e0ce431724f3810de0>)

---
publish: true
content_type: "post"
title: "Staging quantized weights to FP8 instead of FP16: 2x M6 matrix path, +40% MLX prefill (plus int8 on M5)"
description: "An experimental MLX fork changes the data format used when quantized weights are staged for matrix multiplication. Standard MLX quantized matmul dequantizes operands to FP16 before the multiply. Staging them to FP8 instead lets the code use"
date: "2026-10-08T21:31:17.000Z"
updated: "2026-10-09T14:29:13.445Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x13fo2/staging_quantized_weights_to_fp8_instead_of_fp16/"
tags: ["source/reddit","topics/inference","topics/hardware","topics/models"]
---

An experimental MLX fork changes the data format used when quantized weights are staged for matrix multiplication. Standard MLX quantized matmul dequantizes operands to FP16 before the multiply. Staging them to FP8 instead lets the code use the 2x faster FP8 matrix path on Apple's new M6 silicon.

The same idea ports to the M5 family: stage 4-bit affine weights to int8 before the matmul, which yields a similar prefill boost on M5 and M6. Reported gains are roughly +40% prefill for Qwen3-8B and +50% for Qwen3.8-27B. Decode shows little difference because it is bandwidth limited, so the author recommends keeping the default FP16 staging on the decode side.

Quality was measured, with a worst-case perplexity increase under about 1%. The FP8 improvement requires an M6 running macOS 27 with a deployment-target-27 build; int8 works on M5 and later. The author notes it is an experimental fork rather than upstream, referencing mlx&#35;4627, and discloses working at Precisit, which published the blog write-up and code.

## Images and video

- [Image: Staging quantized weights to FP8 instead of fp16: 2× M6 matrix path, +40% MLX prefill &#40;+ int8 on M5&#41;](<https://preview.redd.it/k2jk5lux6buh1.png?width=640&crop=smart&auto=webp&s=0657ae9e9e71c115237556e554542e2bf2fb30bb>)

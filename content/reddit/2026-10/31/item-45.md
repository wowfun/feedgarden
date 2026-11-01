---
publish: true
content_type: "post"
title: "Betelgeuse: Running Qwen 3.8 Flash Next at 22 tok/s sustained (spiking to 48 tok/s) on an RTX 3060 12GB + 16GB DDR4 RAM 100% bit-exact!"
description: "Betelgeuse is a fork of llama.cpp (bel-cli/bel-server) that runs the 68 GB Qwen 3.8 Flash Next GSQ-RCO-IQ2_XS build on a budget PC—RTX 3060 12 GB, 16 GB DDR4, single-channel, CachyOS/Arch, MemoryMax=12G cgroup, consumer NVMe ~2.1 GB/s—wi..."
date: "2026-10-31T12:20:02.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:35:11.563Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1xk8s6z/betelgeuse_running_qwen_38_flash_next_at_22_toks/"
tags: ["source/reddit","topics/inference","topics/models"]
---

Betelgeuse is a fork of llama.cpp &#40;bel-cli/bel-server&#41; that runs the 68 GB Qwen 3.8 Flash Next GSQ-RCO-IQ2&#95;XS build on a budget PC—RTX 3060 12 GB, 16 GB DDR4, single-channel, CachyOS/Arch, MemoryMax=12G cgroup, consumer NVMe &#126;2.1 GB/s—without dropping any routed experts. The author previously discarded a prototype that used gate pruning to inflate tok/s because it degraded quality, and emphasizes this version is 100% bit-exact: all 10 routed experts per layer across 48 layers computed at full precision, with 28,080 router records and 576 generated tokens matching golden stock output &#40;0.000e+00 diff&#41;. Key techniques: an Arrival-Slack VRAM slot pool of &#126;5,000 slots holding dense layers, GDN, QSA and LM head in &#126;3.2 GB plus non-uniform expert slots per layer; an in-stream GPU doorbell with 1-split CUDA graph replay that resolves hits on-device in &#126;2 μs and runs the whole decode as one CUDA graph; a RAM victim cache plus io&#95;uring pager so evicted experts are retained in host RAM rather than discarded, cutting physical NVMe reads from &#126;71 MB/token to 12.43 MB/token; and a split storage layout &#40;3.2 GB Dense.gguf + 35.3 GB experts.bin + 26.8 GB PLE.gguf&#41; that avoids duplicating 35 GB of expert tensors. Measured on the stated hardware: stock llama.cpp with mmap reaches 1.47 tok/s cold and 1.63 warm; Strata in low-RAM mmap mode reaches 8.11 tok/s; Betelgeuse reaches 16.80 tok/s cold and 22.03 warm, with bursts up to 48 tok/s, prompt processing of 16.2–19 tok/s, and reduced reads. The author is also opening a clean upstream llama.cpp PR.

## Media

![Image: Betelgeuse: Running Qwen 3.8 Flash Next at 22 tok/s sustained &#40;spiking to 48 tok/s&#41; on an RTX 3060 12GB + 16GB DDR4 RAM 100% bit-exact&#33;](<https://external-preview.redd.it/MHBxZnUwMjVuc3loMf6cJBR025efvWrD2XCjAiBgMTC0twf5SvBtR0_E6AIp.png?width=640&crop=smart&auto=webp&s=9df97dd7f80d1a38f8f509937180724668483df1>)

[Image: Betelgeuse: Running Qwen 3.8 Flash Next at 22 tok/s sustained &#40;spiking to 48 tok/s&#41; on an RTX 3060 12GB + 16GB DDR4 RAM 100% bit-exact&#33;](<https://external-preview.redd.it/MHBxZnUwMjVuc3loMf6cJBR025efvWrD2XCjAiBgMTC0twf5SvBtR0_E6AIp.png?width=640&crop=smart&auto=webp&s=9df97dd7f80d1a38f8f509937180724668483df1>)

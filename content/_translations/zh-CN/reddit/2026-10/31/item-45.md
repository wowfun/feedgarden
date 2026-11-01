---
publish: true
content_type: "post"
title: "Betelgeuse：在 RTX 3060 12GB + 16GB DDR4 上以 22 tok/s 持续运行 Qwen 3.8 Flash Next（峰值 48 tok/s），100% 位级精确！"
description: "Betelgeuse 是 llama.cpp 的一个分支（bel-cli/bel-server），可在预算级 PC 上运行 68 GB 的 Qwen 3.8 Flash Next GSQ-RCO-IQ2_XS：RTX 3060 12 GB、16 GB DDR4 单通道、CachyOS/Arch、MemoryMax=12G cgroup、消费级 NVMe 约 2.1 GB/s，且不丢弃任何路由专家。作者此前因门控剪枝会静默劣化输出而废弃了原型，强调本版本 100% 位级精..."
date: "2026-10-31T12:20:02.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T16:35:11.563Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1xk8s6z/betelgeuse_running_qwen_38_flash_next_at_22_toks/"
tags: ["source/reddit","topics/inference","topics/models"]
---

Betelgeuse 是 llama.cpp 的一个分支（bel-cli/bel-server），可在预算级 PC 上运行 68 GB 的 Qwen 3.8 Flash Next GSQ-RCO-IQ2&#95;XS：RTX 3060 12 GB、16 GB DDR4 单通道、CachyOS/Arch、MemoryMax=12G cgroup、消费级 NVMe 约 2.1 GB/s，且不丢弃任何路由专家。作者此前因门控剪枝会静默劣化输出而废弃了原型，强调本版本 100% 位级精确：48 层中每层 10 个路由专家均以全精度计算，28,080 条路由记录与 576 个生成 token 与黄金 stock 输出完全一致（差异 0.000e+00）。关键技术：约 5,000 槽的 Arrival-Slack VRAM 槽池，将稠密层、GDN、QSA 与 LM head 约 3.2 GB 常驻显存，并按层非均匀分配专家槽；基于流内 GPU 门铃与单次拆分 CUDA Graph 重放的命中解析（约 2 μs），整段解码作为一次 CUDA Graph 执行；RAM 受害者缓存与 io&#95;uring 分页器，使被驱逐专家保留在主机 RAM 而非丢弃，物理 NVMe 读取从每 token 约 71 MB 降至 12.43 MB；以及拆分存储布局（3.2 GB Dense.gguf + 35.3 GB experts.bin + 26.8 GB PLE.gguf），避免重复存放 35 GB 专家张量。在上述硬件上的实测：stock llama.cpp mmap 为冷启动 1.47 tok/s、热启动 1.63 tok/s；Strata 低内存 mmap 模式为 8.11 tok/s；Betelgeuse 为冷启动 16.80 tok/s、热启动 22.03 tok/s，峰值可达 48 tok/s，prompt 处理 16.2–19 tok/s。作者还计划提交干净的 llama.cpp 上游 PR。

## 媒体

![图片: Betelgeuse: Running Qwen 3.8 Flash Next at 22 tok/s sustained &#40;spiking to 48 tok/s&#41; on an RTX 3060 12GB + 16GB DDR4 RAM 100% bit-exact&#33;](<https://external-preview.redd.it/MHBxZnUwMjVuc3loMf6cJBR025efvWrD2XCjAiBgMTC0twf5SvBtR0_E6AIp.png?width=640&crop=smart&auto=webp&s=9df97dd7f80d1a38f8f509937180724668483df1>)

[图片: Betelgeuse: Running Qwen 3.8 Flash Next at 22 tok/s sustained &#40;spiking to 48 tok/s&#41; on an RTX 3060 12GB + 16GB DDR4 RAM 100% bit-exact&#33;](<https://external-preview.redd.it/MHBxZnUwMjVuc3loMf6cJBR025efvWrD2XCjAiBgMTC0twf5SvBtR0_E6AIp.png?width=640&crop=smart&auto=webp&s=9df97dd7f80d1a38f8f509937180724668483df1>)

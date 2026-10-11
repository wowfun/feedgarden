---
publish: true
content_type: "post"
title: "Uncensored Qwen3.8-27B (HauhauCS) on a 4090: 262K context and about 130 tok/s"
description: "HauhauCS distributes its uncensored Qwen3.8-27B only as GGUF, while NInfer, a C++/CUDA runtime, wanted its own format. The author reports converting the same model and running it on an RTX 4090 with substantially better results than under l"
date: "2026-10-09T05:27:28.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1d0u4/running_the_uncensored_qwen3827b_hauhaucs_on_a/"
tags: ["source/reddit","topics/inference","topics/models","topics/hardware"]
---

HauhauCS distributes its uncensored Qwen3.8-27B only as GGUF, while NInfer, a C++/CUDA runtime, wanted its own format. The author reports converting the same model and running it on an RTX 4090 with substantially better results than under llama.cpp.

Key figures from the post:
- Under llama.cpp the model ran at 91.6 tok/s with a 131K context.
- After conversion it runs at the model's full native 262K context, decoding at about 130 tok/s with MTP3 and 70.8% acceptance.
- Prefill reaches 3,591 tok/s on a 9K prompt.
- Perplexity is within 1.3% of the official artifact, which the author presents as evidence that the conversion is clean.

Vision and tool calls continue to work after conversion. An E8 4-bit quant is included, and the converter plus writeup are linked in a pull request to the ninfer-4090 repository, with the converted model in the ninfer-uncensored repo. The author invites questions. Note that these figures come from the author's own testing and have not been independently verified in the post.

## Images and video

- [Image: Running the uncensored Qwen3.8-27B &#40;HauhauCS&#41; on a 4090 at 262K context and &#126;130 tok/s](<https://preview.redd.it/nn8cawenlduh1.png?width=140&height=112&auto=webp&s=c425dff42502643e0c18b35387e829994779f3ee>)

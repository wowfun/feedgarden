---
publish: true
content_type: "post"
title: "EngramEdit: Decoupled Knowledge Updates in LLMs through Conditional Memory"
description: "A new paper proposes EngramEdit, a method for updating factual knowledge in large language models by editing conditional memory rather than the Transformer backbone. Conditional memory architectures such as DeepSeek Engram use input n-gr..."
date: "2026-10-09T06:45:52.000Z"
updated: "2026-10-09T15:11:45.369Z"
first_seen: "2026-10-09T14:18:44.332Z"
date_basis: "published"
source_url: "https://www.reddit.com/r/LocalLLaMA/comments/1x1eb7w/paper_engramedit_decoupled_knowledge_updates_in/"
tags: ["source/reddit","topics/research","topics/models"]
---

A new paper proposes EngramEdit, a method for updating factual knowledge in large language models by editing conditional memory rather than the Transformer backbone.

Conditional memory architectures such as DeepSeek Engram use input n-grams to look up learned embeddings, expanding model capacity with limited additional computation. The authors argue this design can decouple factual knowledge storage from general-purpose computation, offering a route to updating facts while keeping the backbone fixed. The difficulty is that different expressions of the same fact may activate different n-gram embeddings, while editing shared embeddings can unintentionally change predictions about other facts.

EngramEdit first computes target memory representations that make the model predict an updated fact across multiple expressions. It then jointly updates the shared n-gram embeddings to match those targets across expressions and edits, penalizing updates to frequently reused embeddings more strongly so unrelated knowledge is preserved.

The reported experiments show independent factual updates through conditional memory with near-perfect editing success. Revised knowledge is usable across unseen expressions and in multi-hop reasoning, with nearly three times the strongest baseline's accuracy under chain-of-thought prompting. Unrelated knowledge and general capabilities are described as largely preserved even as factual updates accumulate. The authors frame the result as turning conditional memory into an editable knowledge interface that extends beyond model scaling. Code, PDF and project resources are linked in the source post.

## Media

![Image: &#91;Paper&#93; EngramEdit: Decoupled Knowledge Updates in LLMs through Conditional Memory](<https://preview.redd.it/cv4ijqtw0euh1.png?width=140&height=57&auto=webp&s=a50e0150d8cfb6701ceaec3c3ac33887dde66670>)

[Image: &#91;Paper&#93; EngramEdit: Decoupled Knowledge Updates in LLMs through Conditional Memory](<https://preview.redd.it/cv4ijqtw0euh1.png?width=140&height=57&auto=webp&s=a50e0150d8cfb6701ceaec3c3ac33887dde66670>)

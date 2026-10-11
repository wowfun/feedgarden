---
publish: true
content_type: "post"
title: "Deno Is Joining Cloudflare"
description: "The entire Deno team is joining Cloudflare, according to a post attributed to Ry Dahl. The stated rationale is a progression the author traces from the Deno runtime to Deno Deploy to celld, a system built on Cloudflare's Workers programming"
date: "2026-10-09T13:03:48.000Z"
updated: "2026-10-10T05:10:37.706Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://deno.com/blog/cloudflare"
discussion_url: "https://news.ycombinator.com/item?id=50019911"
tags: ["source/hackernews","topics/coding","topics/open-source","topics/industry"]
---

## Article

The entire Deno team is joining Cloudflare, according to a post attributed to Ry Dahl. The stated rationale is a progression the author traces from the Deno runtime to Deno Deploy to celld, a system built on Cloudflare's Workers programming model and focused on Durable Objects. The goal, he writes, is to make that programming model the default way to build servers, running on Cloudflare's network or on a developer's own infrastructure. Compatibility with Node.js and a complete toolchain were described as earlier priorities alongside the runtime itself.

The announcement also lays out the concrete consequences for existing users:

- The Deno runtime will be supported for another year with monthly releases containing bug fixes and security updates; after that year, development of the runtime ends. Deno remains open source and others are invited to continue it.
- Deno Deploy will keep operating for six months before shutting down, with migration support for paying customers moving to Cloudflare Workers.
- JSR will continue operating, with its infrastructure moving to Cloudflare.
- rusty&#95;v8 will continue to be supported, with work toward integrating it into workerd.

Dahl says AI is what makes better abstractions especially urgent, arguing that Durable Objects combine inexpensive serverless execution, persistent state, WebSockets and a high-level JavaScript interface — capabilities he sees as well suited to agent harnesses. He points to celld as centering on Durable Objects and refers to a joint Cloudflare blog post with Kenton Varda, and invites people building agents at scale who want to run on their own infrastructure to contact him.

The post acknowledges the change is consequential for those who built on Deno and thanks contributors, businesses and bug reporters. The author frames the decision as a choice of where to focus effort: future development goes into the shared platform rather than a separate runtime and hosting service.

## HN discussion

Based on 10 selected comments and replies.

Commenters focused on what the timeline means in practice. One noted that unless someone else takes over, Deno will simply no longer be supported, and another called that detail something buried at the bottom of the post, pointing to companies that did major migrations off Node.js and framing it as the risk of chasing new tools.

Several commenters debated why Deno's direction changed. One said their enthusiasm ended when npm compatibility became a priority, arguing Deno went from simple to bloated and that early Deno at least pushed Node to copy features. A reply disagreed on cause, saying Bun's adoption rate, driven by npm compatibility, was the forcing function rather than funding, and that funding is what made a slow-but-steady strategy possible at all.

Others questioned the transaction itself: one asked whether Cloudflare wants the team on other priorities or wants Deno to fade, wondering why it wouldn't be more strategic to invest in a JS runtime given Workers. Another suggested a blunter headline about an acquihire, and one listed a series of developer-tool acquisitions as evidence of consolidation. A commenter lamented the runtime while expressing interest in workerd and celld as a more complete self-hostable backend, and noting the move prevents another company from acquiring Deno for celld.

Selected comments: [theodorejb](https://news.ycombinator.com/item?id=50020072) · [binlog](https://news.ycombinator.com/item?id=50020218) · [sholladay](https://news.ycombinator.com/item?id=50021907) · [carefulfungi](https://news.ycombinator.com/item?id=50022915) · [atif089](https://news.ycombinator.com/item?id=50023986) · [networked](https://news.ycombinator.com/item?id=50021206)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50019911>)

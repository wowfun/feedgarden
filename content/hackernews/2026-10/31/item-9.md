---
publish: true
content_type: "post"
title: "Bunny CDN Security Incident"
description: "Bunny CDN disclosed a security incident last week after one of its infrastructure providers, Gcore, reported unauthorized access involving third-party server management software. A single CDN node in Armenia hosted on the affected provid..."
date: "2026-10-30T19:05:22.000Z"
updated: "2026-11-01T15:39:43.305Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://status.bunny.net/incidents/p6gf1by9kr7m"
discussion_url: "https://news.ycombinator.com/item?id=50308697"
tags: ["source/hackernews","topics/security-privacy","topics/cloud-computing"]
---

## Article

Bunny CDN disclosed a security incident last week after one of its infrastructure providers, Gcore, reported unauthorized access involving third-party server management software. A single CDN node in Armenia hosted on the affected provider's server was implicated. Bunny's engineering team responded within 20 minutes: they stopped routing traffic to the node, preserved relevant security logs for investigation, securely wiped the server, revoked its access to other systems, and permanently removed it from the infrastructure.

Investigations by both parties found no evidence of unauthorized access to Bunny's server or its data, but neither could fully rule out the possibility. If access had occurred, potentially exposed information included temporarily cached CDN content, Pull Zone configurations, and TLS certificates stored on the server. As a precaution, Bunny revoked and reissued all TLS certificates for bunny.net platform domains, with reissuance for managed custom domain certificates ongoing. Customers managing their own TLS certificates were advised to revoke and reissue them with new private keys. No account data, internal systems, or other customer data were stored on the affected server.

The incident was limited to one POP and stemmed from a third-party provider's compromise rather than Bunny's own systems. Bunny says it is monitoring infrastructure and working with the provider as investigations continue, with further updates promised via email and its status page if new findings emerge.

## HN discussion

Based on 9 selected comments and replies.

Discussion centered on attribution and customer impact. One commenter clarified the incident stemmed from infrastructure provider Gcore in Armenia rather than Bunny directly, noting the title could be misleading. Others focused on practical fallout, particularly that customers managing their own TLS certificates would need to revoke and reissue them as a precaution. A technical commenter argued the response should have preserved more forensically without wiping so aggressively, while another praised Bunny's prompt, competent containment. Together the sample highlights both reassurance about scope and lingering concern over customer-side remediation.

Selected comments: [eraclide](https://news.ycombinator.com/item?id=50309394) · [ptsneves](https://news.ycombinator.com/item?id=50309480) · [evan&#95;a&#95;a](https://news.ycombinator.com/item?id=50310944) · [colonCapitalDee](https://news.ycombinator.com/item?id=50309403)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50308697>)

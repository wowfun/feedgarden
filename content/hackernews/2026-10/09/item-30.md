---
publish: true
content_type: "post"
title: "Cloudflare Keeps 1.1.1.1 Out of Piracy Blocking, Escapes Penalties in France"
description: "Over the past two years, French courts have ordered a widening set of intermediaries to block access to pirate sports streams. Besides regular ISPs, the orders now target public DNS resolvers, VPN services, search engines and CDN providers,"
date: "2026-10-08T18:32:52.000Z"
updated: "2026-10-10T04:14:41.546Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://torrentfreak.com/cloudflare-keeps-1-1-1-1-out-of-piracy-blocking-escapes-penalties-in-france/"
discussion_url: "https://news.ycombinator.com/item?id=50009965"
tags: ["source/hackernews","topics/industry","topics/security-privacy"]
---

## Article

Over the past two years, French courts have ordered a widening set of intermediaries to block access to pirate sports streams. Besides regular ISPs, the orders now target public DNS resolvers, VPN services, search engines and CDN providers, all of which can help users bypass existing blockades.

Cloudflare has received several such orders. In April, the Paris Judicial Court ordered it to block 21 domains linked to pirate Formula 1 streams and 16 linked to MotoGP, covering both its DNS resolver and its CDN. The orders did not prescribe a method, only that access from France be prevented "by any effective means." Pay-TV provider Canal+, which requested the blockades, judged Cloudflare's efforts insufficient and returned to court.

In May, Canal+ asked the Paris court to attach daily penalties to the April orders: €50,000 per day for every site still accessible, and the same amount for each new site reported to Cloudflare by media regulator Arcom. It argued Cloudflare had deliberately failed to comply, claiming that implementing the decision only through the CDN left three of the 21 Formula 1 domains blocked, and three of 16 for MotoGP. It added that two of the three blocked sites were back online a week later, one having switched CDN and the other using a mirror.

On September 17, a panel of three judges ruled on both penalty requests and sided with Cloudflare. The court noted it was undisputed that Cloudflare implements the measures only by blocking through its CDN when a site uses that service, and that the court had expressly left the company free to choose which of its services to use as long as it contributed meaningfully. Cloudflare told the court that CDN blocking is far more effective than DNS blocking and that the architecture of its public DNS resolver does not allow blocking. Canal+ cited a figure of 72.6% of ordered domain names blocked, which the court read as evidence of genuine willingness to help stop infringement; the ruling does not explain how that percentage relates to the three-out-of-21 count.

The court also found Cloudflare cannot be blamed for sites that switched to another CDN or moved to a mirror; it is up to Canal+ to ask the new intermediary to block them and to report mirrors to Arcom. Rejecting Canal+'s reading of the EU Court of Justice's UPC Telekabel Wien ruling, the panel held that intermediaries need only take reasonable measures, which the CDN blocking satisfied. The penalties were refused as neither necessary nor proportionate, and Canal+'s request for €20,000 in legal costs was denied. As a result, Cloudflare will not be penalized under these orders.

## HN discussion

Based on 4 selected comments and replies.

Commenters broadly welcomed the ruling. One argued France has no business regulating the world's DNS resolvers in the name of piracy, which mainly enriches media companies while crippling the CDNs those companies depend on.

Another traced the litigation to beIN Sports chairman Nasser Al-Khelaifi, also president of Paris Saint-Germain and chairman of Qatar Sports Investment, citing his reported income and wealth and noting a separate French case in which a judge ordered VPNs to block sites he wanted blocked.

A third compared a DNS resolver to a relay and cache assembled from the decentralized nameserver cluster, asking whether it should be treated like debrid services that stream copyrighted works without legal trouble because they merely download and cache. A reply to that comment said such distinctions are far too complicated for lawmakers, predicting the problem persists until voters demand more tech-literate representation — a view the responder himself called doubtful.

Selected comments: [Zenul&#95;Abidin](https://news.ycombinator.com/item?id=50010755) · [miohtama](https://news.ycombinator.com/item?id=50012363) · [himata4113](https://news.ycombinator.com/item?id=50010806) · [richwater](https://news.ycombinator.com/item?id=50010965)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50009965>)

## Images and video

- [Image: 50k requested by canal+](<https://torrentfreak.com/images/50k.png>)
- [Image: Not Cloudflare's responsibility](<https://torrentfreak.com/images/shot-cloudflare-not-responsible.png>)
- [Image: transparency report 1.1.1.1 not blocked](<https://torrentfreak.com/images/transparency-notblocked.png>)

---
publish: true
content_type: "post"
title: "Understanding Email Encryption"
description: "Email encryption is not a single feature: messages can be encrypted in different ways, at different times, and for different purposes, each protecting against a different set of threats with its own trade-offs. The article starts by aski..."
date: "2026-10-30T20:55:56.000Z"
updated: "2026-11-01T16:47:56.028Z"
first_seen: "2026-11-01T15:39:54.389Z"
date_basis: "published"
source_url: "https://www.fastmail.com/blog/email-encryption/"
discussion_url: "https://news.ycombinator.com/item?id=50310038"
tags: ["source/hackernews","topics/security-privacy"]
---

## Article

Email encryption is not a single feature: messages can be encrypted in different ways, at different times, and for different purposes, each protecting against a different set of threats with its own trade-offs. The article starts by asking what threats actually matter. For most people the realistic concerns are account compromise, mistaken spam filtering, malware, and accidental deletion; less common but important are network eavesdropping, data breaches, and physical theft. For a smaller group—journalists protecting sources, activists in hostile countries, or people facing sophisticated adversaries—the model also includes insider threats at providers and legal compulsion by governments. The article then explains protecting the connection to an email provider. TLS encrypts traffic between a device and the server, including from local Wi-Fi and ISP eavesdroppers, and TLS 1.3 mandates the strongest ciphers. Public Key Infrastructure verifies the server's identity through certificates signed by trusted Certificate Authorities, and Certificate Transparency logs provide public, append-only records of issued certificates so domain owners can detect misuse. Fastmail supports TLS 1.3, uses HSTS to prevent unencrypted browser connections, closes unencrypted IMAP/POP/SMTP ports, and prefers implicit TLS over STARTTLS. Finally, the piece notes that an email first reaches the sender's provider and is then forwarded to the recipient's provider, and that the harder problem is encrypting mail in transit between those different servers.

## HN discussion

Based on 8 selected comments and replies.

Commenters identify practical gaps and disagreements. 8organicbits says Fastmail does not enforce MTA-STS for outbound mail and only partly supports it inbound, questioning the article's framing of Fastmail's protections. savant2 notes the article omits Web Key Directory, which Proton Mail supports for seamless PGP encryption without a Web of Trust. upofadown cites a study in which 21 of 28 computer-science students failed to establish or maintain a secure Signal connection, arguing security and usability trade off; mmooss replies that the study concerned detecting man-in-the-middle attacks via key comparison rather than ordinary messaging. chrismorgan questions servers' default of not verifying certificates, while cubesnooper describes self-hosting and verifying recipient MX certificates, with no STARTTLS refusals over eight years and only two hostname mismatches.

Selected comments: [8organicbits](https://news.ycombinator.com/item?id=50326925) · [savant2](https://news.ycombinator.com/item?id=50325443) · [upofadown](https://news.ycombinator.com/item?id=50324914) · [mmooss](https://news.ycombinator.com/item?id=50326476) · [chrismorgan](https://news.ycombinator.com/item?id=50323762) · [cubesnooper](https://news.ycombinator.com/item?id=50324017)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50310038>)

## Media

![PDF: Why Johnny Can’t Encrypt](<https://people.eecs.berkeley.edu/~tygar/papers/Why_Johnny_Cant_Encrypt/OReilly.pdf>)

[PDF: Why Johnny Can’t Encrypt](<https://people.eecs.berkeley.edu/~tygar/papers/Why_Johnny_Cant_Encrypt/OReilly.pdf>)

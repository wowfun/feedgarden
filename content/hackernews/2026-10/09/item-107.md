---
publish: true
content_type: "post"
title: "OTel-Native by Design: Building Products That Export to Any Observability Stack"
description: "An OpenTelemetry blog post, written with contributions from Dan Gomez Blanco of New Relic, argues that self-hosted software and SaaS products should let users export logs, traces and metrics to any OTel-compatible backend rather than lockin"
date: "2026-10-09T06:54:45.000Z"
updated: "2026-10-10T04:57:54.048Z"
first_seen: "2026-10-09T14:17:37.221Z"
date_basis: "published"
source_url: "https://opentelemetry.io/blog/2026/otel-native-by-design/"
discussion_url: "https://news.ycombinator.com/item?id=50016974"
tags: ["source/hackernews","topics/inference","topics/open-source"]
---

## Article

An OpenTelemetry blog post, written with contributions from Dan Gomez Blanco of New Relic, argues that self-hosted software and SaaS products should let users export logs, traces and metrics to any OTel-compatible backend rather than locking observability data into built-in dashboards or a limited set of vendors. The stated motivations are compliance, cost management and centralizing telemetry; supporting exports is framed as vendor-neutral and future-proof.

OpenTelemetry defines four signal types carried over the OpenTelemetry Protocol &#40;OTLP&#41;: logs &#40;event records and application or access logs with timestamps and metadata&#41;, traces &#40;distributed traces and spans for correlating request flows with logs&#41;, metrics &#40;counters, gauges and histograms such as request rates, latency and error rates&#41; and profiles &#40;samples of where applications consume resources&#41;. The post says many platforms support at least traces and logs, with a growing number adding metrics, and recommends designing for all three from the start to avoid retrofitting.

A "good" telemetry export story is described as vendor-neutral &#40;users point at any OTLP endpoint, a Collector or a backend that supports OTLP directly&#41;, requiring no deep custom development &#40;standard OTel SDKs and OTLP instead of proprietary APIs&#41;, preserving rich context such as metadata, timestamps and trace/span correlation for logs, and following Semantic Conventions so data stays interpretable across backends and systems.

The post distinguishes two deployment contexts. In self-hosted software such as an identity server, service mesh or database, the vendor instruments the product and the customer configures an endpoint via environment variables or a config file, so export happens in the customer's environment where they control the binary and destination; Keycloak and Kuma are given as examples. In cloud platforms, where workloads run on the vendor's infrastructure, a different approach applies. The article also discusses Collector-per-tenant versus shared Collector architectures, noting the former offers strong isolation at higher resource cost while the latter is easier to monitor and maintain. The supplied text is truncated before the cloud-platform section completes.

## HN discussion

Based on 6 selected comments and replies.

Several commenters were critical of the post itself rather than its subject. yearesadpeople said it was unfortunate that the article appeared to be LLM-written, arguing its premise and conclusion read like a chat session with RAG and MCP calls, and expressed disappointment in OTel leadership given the blog's usual role in covering community developments. geodel agreed, calling it "Enterprise FizzBuzz observability" and an ideal template for AI to generate endless docs and code, while crazylambdaa dismissed the thread as fake engagement. Others defended or critiqued the standard itself: serkan-ozal, citing more than ten years in observability, called OTel one of the biggest steps in the space even though vendors maintain their own approaches, and blalala mocked the conventional "level, timestamp, message" logging format, with PunchyHamster adding that the format is wasteful and annoying to modify.

Selected comments: [yearesadpeople](https://news.ycombinator.com/item?id=50018390) · [geodel](https://news.ycombinator.com/item?id=50018996) · [serkan-ozal](https://news.ycombinator.com/item?id=50017706) · [PunchyHamster](https://news.ycombinator.com/item?id=50017884) · [crazylambdaa](https://news.ycombinator.com/item?id=50017774)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50016974>)

## Images and video

- [Image: Enabling telemetry export via the OTLP standard allows users to own and analyze their data on the platforms of their choosing.](<https://opentelemetry.io/blog/2026/otel-native-by-design/cover.png>)
- [Image: The Collector-per-tenant architecture provides strong isolation guarantees at the cost of increased resource usage.](<https://opentelemetry.io/blog/2026/otel-native-by-design/collector-per-tenant.png>)
- [Image: The shared Collector pattern is easier to monitor and maintain as all exports route through one Collector instance.](<https://opentelemetry.io/blog/2026/otel-native-by-design/shared-collector.png>)

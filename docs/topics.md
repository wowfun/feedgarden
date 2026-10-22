# Topic vocabulary

## Canonical vocabulary

`config/topics.json` is the canonical bilingual vocabulary. The fixed-input agent skill reads it, reuses active IDs and aliases, and may append reusable topics. Both the restricted tool adapter and client validate identities, bilingual copy, topic references and new-topic uniqueness. The registry is written with file/directory fsync before the summary transaction; an interrupted commit may leave an unused topic, but cannot leave a published dangling reference. Saved artifacts are recovered before another ACP call. Topic additions do not invalidate accepted summaries; `--rebuild` explicitly refreshes classification.

The complete registry, including deprecated topics and aliases, counts toward every summary batch's input budget. Keep descriptions concise and use the measured budget warning to guide edits through `topics apply`. Deprecated IDs and aliases remain available for historical content and shared links; removing them or an empty aliases array is not a substitute for reducing substantial description overhead.

## Hidden topics

Set `hidden: true` on a registry entry to remove it from default archive, collection, Favorites and export topic choices. Omission means false. This is independent of deprecation: stored item and article labels remain intact. “Show hidden topics” reveals those choices temporarily; a selected hidden topic remains visible until deselected. Expanding the list does not make it eligible for Agent classification.

Hiding is reversible: apply `hidden: false` through `topics apply` to restore the topic to default choices and Agent eligibility, provided it is not deprecated.

Agents cannot assign hidden topics or add hidden new topics. The full registry still reserves their IDs, bilingual names and aliases against duplicate creation. Cached and recovered outputs are revalidated before acceptance; accepted historical summaries are not reclassified merely because the registry changes. Both locale manifests emit the same sorted `hidden_tags` list.

[简体中文说明](topics.zh-CN.md)

## Manual updates

For manual vocabulary changes, preserve IDs and old labels/aliases. Deprecate rather than delete; `replacedBy` must point directly to an active, visible topic. Omitted `hidden` and explicit `hidden: false` normalize identically for validation and merging. Rendering remaps stored IDs, and old shared query links remain usable. Apply changes through the runner lock:

```sh
npm run feedgarden -- topics apply revised-topics.json
```

Directly editing the canonical registry while a job runs is unsupported and detected by its fingerprint. Topic/file and SQLite commits are separate durable steps; their recovery protocol does not claim a distributed atomic transaction.

## Related documentation

- [Summaries and content](summaries.md)
- [Site features](site.md)
- [Deployment and publishing](deployment.md)

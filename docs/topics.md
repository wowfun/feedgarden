# Topic vocabulary

## Canonical vocabulary

`config/topics.json` is the canonical bilingual vocabulary. The fixed-input agent skill reads it, reuses active IDs and aliases, and may append reusable topics. Both the restricted tool adapter and client validate identities, bilingual copy, topic references and new-topic uniqueness. The registry is written with file/directory fsync before the summary transaction; an interrupted commit may leave an unused topic, but cannot leave a published dangling reference. Saved artifacts are recovered before another ACP call. Topic additions do not invalidate accepted summaries; `--rebuild` explicitly refreshes classification.

## Manual updates

For manual vocabulary changes, preserve IDs and old labels/aliases. Deprecate rather than delete; `replacedBy` must point directly to an active topic. Rendering remaps stored IDs, and old shared query links remain usable. Apply changes through the runner lock:

```sh
npm run feedgarden -- topics apply revised-topics.json
```

Directly editing the canonical registry while a job runs is unsupported and detected by its fingerprint. Topic/file and SQLite commits are separate durable steps; their recovery protocol does not claim a distributed atomic transaction.

## Related documentation

- [Summaries and content](summaries.md)
- [Site features](site.md)
- [Deployment and publishing](deployment.md)

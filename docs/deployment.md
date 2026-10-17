# Deployment and publishing

## Build environment

Publishing is disabled automatically by default. The remote theme lock must match the locally trusted repository and full SHA before topic/content changes or validation. Theme builds use an environment allowlist, excluding provider/Git tokens, proxy variables and injected runtime options; Git fetch/push retain the caller’s credentials. This environment boundary is not an operating-system sandbox.

## Publication

`publish` fetches the configured branch into an isolated worktree, merges topic registries with a three-way base, validates the site, commits only `content/` and `config/topics.json`, and pushes without force. Legacy `reports/` deletions are permitted only with the migration journal. Independent topic additions merge; conflicting IDs stop the entire publication and preserve local data, with `.local/publish-conflict.json` for resolution. Integrate the code/theme change into the publication branch before publishing item content.

## Topic conflicts

To resolve a registry conflict, fetch and merge the recorded versions, then run `topics apply FILE --remote-base <recorded-remote-SHA>`, render, and retry.

## Analytics

The Cloudflare Web Analytics value in `website.analytics.token` is the public site identifier used by the browser beacon. It is distinct from a Cloudflare API credential or a DeepSeek API key, which must remain private. The theme embeds this identifier in the published page as required by [Cloudflare's beacon integration](https://developers.cloudflare.com/web-analytics/faq/). Keep the identifier assigned to the intended Web Analytics site; publishing it is not a reason to replace it. When deliberately changing the analytics site or domain, copy that site's beacon identifier from the Cloudflare dashboard into `.github/jekyll-obsidian.yml`, rebuild and redeploy, then check the published beacon and dashboard hostname. This repository uses one shared site configuration rather than an environment-variable override; omit `website.analytics` in a separate build configuration when analytics is unwanted.

## Related documentation

- [Development and validation](development.md)
- [Topic vocabulary](topics.md)
- [Runner operations](operations.md)

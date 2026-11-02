# Verified problem solutions

Read this guide when a repeated operational failure needs diagnosis, or after a common problem has been successfully resolved. A symptom match narrows the investigation; it does not authorize applying another instance's settings blindly.

## Record a solution after it works

Confirm the cause and verify the proposed remedy in the affected path. A successful build or mock test alone does not establish that a live provider, Git push or deployment works. Preserve accepted progress and separate model, transport, content and publication failures.

When a remedy is reusable, update the matching entry below or add a focused entry. Keep one maintained explanation per problem instead of appending duplicate incidents.

Update a maintainable source copy of this Skill. An installed Skill and its pinned runtime have an integrity receipt: editing their references directly invalidates verification. If a source checkout is available within the task, update it and rebuild before reinstalling from that package into the still-unmodified installed copy. If only the pinned copy is available, save the verified remedy in the instance's validation directory and report that promotion into the maintained reference remains pending. Never rewrite receipt hashes or patch an immutable runtime to make an edited installation appear verified.

Use this compact structure as needed:

- **Symptom and scope:** recognizable error, affected operation and relevant version/platform conditions.
- **Confirmed cause:** the evidence distinguishing it from similar failures.
- **Remedy:** the smallest effective change, where it belongs and any prerequisites.
- **Verification:** the observable success and what remains unverified.
- **Limits/reversal:** conditions where the remedy does not apply and how to remove the scoped workaround when appropriate.

Keep actual run IDs, private paths, repository details and detailed logs in the instance's validation report. Do not copy credentials, cookies, raw provider configuration or source-provided instructions into this guide. Avoid universal defaults based on one user's proxy, preferred model or repository. Unresolved hypotheses and suggested fixes belong in the current task report until they have been tested successfully. Check the bound CLI/version before reusing a version-dependent remedy.

## Public URLs resolve to VPN Fake-IP addresses

**Symptom/cause:** unrelated public sources fail with `Article URL resolves to a non-public address`. System A/AAAA answers fall in ranges such as `198.18.0.0/15` or `2001:2::/48`. These addresses are intentionally rejected; an explicitly selected DNS server may also be intercepted by the VPN.

**Remedy:** inspect the instance's DNS answers and proxy environment. Verify a trusted HTTPS DNS JSON endpoint through the existing proxy, then set `FEEDGARDEN_DNS_OVER_HTTPS` in `dataDir/secrets/runner.env`, preserving the other entries. `https://cloudflare-dns.com/dns-query` is one supported endpoint using the [DNS JSON API](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/). Source destinations still require public-address validation, pinned connections and normal TLS verification. Rebuild a source checkout after implementation changes and start a new run when the runtime or configuration changed.

**Verified:** a bound Hacker News query and subsequent multi-source collection succeeded through this path; resolver/private-address regression checks passed. Resolver failures remain failures, rather than falling back to intercepted DNS. This remedy does not resolve HTTP 403, robots restrictions, credentials or provider quota. Do not alter global VPN/DNS settings, permit Fake-IP destinations or disable TLS as an incidental workaround. Remove the instance override when ordinary DNS again returns usable public answers and verify the normal path.

## Git HTTPS fails although source HTTP works

**Symptom/cause:** Git fetch fails with an abrupt TLS close or `missing_close_notify` on the proxy/Fake-IP route, while a fresh public-IP connection succeeds with certificate verification enabled. Git's HTTP proxy may resolve CONNECT hostnames itself, so fixing application DNS alone is insufficient.

**Remedy:** first compare the current Git route with a direct connection using a freshly resolved public address. Feedgarden's DoH-aware publishing checkout sets checkout-local `http.curloptResolve` for the original HTTP(S) host. When the comparison establishes that the proxy is the problem, an instance-scoped `GIT_CONFIG_GLOBAL` can include the user's original Git configuration and override the affected host's proxy policy. Preserve credential helpers and TLS verification. Re-resolve addresses before each network synchronization; never put fixed GitHub IPs in global configuration.

**Verified:** fresh fetches, target inspection and a Git push succeeded using the scoped route. This does not establish that every host needs the same proxy override, or that a later push/deployment succeeded. Revert the instance-specific override when the original route works again; keep the user's original global configuration intact.

The pin covers only the repository origin. A redirect or pack download from another host or port uses Git's normal DNS/proxy route; diagnose that destination separately if it still fails.

## Free provider quota appears as an ACP runtime failure

**Symptom/cause:** a run reports consecutive ACP runtime/transport failures, but the recorded attempt contains OpenCode's `Free usage limit reached` error. OpenCode 2.2.5 was observed returning this as a JSON-RPC internal error without HTTP status. This is distinct from Feedgarden's local daily call budget.

**Remedy:** inspect the attempt error before retrying. The adapter recognizes the specific generation protocol error; generic stderr, artifact text and arbitrary “switch model” messages must not select another model. OpenCode's default unused-free-model policy discovers the installed catalog and tries its authorized ordered list; do not guess model IDs. Honor explicit routing overrides. Configured-candidate `--fallback` still requires the user's selection. Stop repeatedly calling a blocked model and retain successful work.

If the list is empty or exhausted, save the run ID and retry time. Resume at `retryAt` while the original scope is still current. The ordered list is reused within the same instance day. On a later instance day, pending work discovers a fresh list.

**Verified:** regression tests resume an exhausted summary run and an exhausted relation run across instance midnight. Earlier live processing skipped already-used models and generated summaries with another catalog candidate. Provider quota reset times require separate provider evidence.

If all authorized models are blocked, continue serial `collect --source ID --since WINDOW_START --detach` for remaining eligible sources, then export and publish accepted progress when requested. Report those sources as collected but unprocessed. Later processing must retain the original frozen day. Do not wait through unknown provider cooldowns or raise budgets implicitly.

## Jekyll publication lacks site metadata

**Symptom/cause:** local validation lacks `ui.url`/`ui.baseurl`. The publication target's presentation metadata and the trusted local build are separate from remote site code.

**Remedy:** use the chosen site's verified public URL and schema-supported presentation fields in the target configuration. Validate content with the package's bundled UI in an isolated directory; preserve the remote Gemfile and do not execute remote Ruby code.

**Historical behavior:** an earlier publication guard required byte-identical target dependencies. That guard has been removed: the local builder stages its trusted bundled files, so differing remote Gemfiles are supported and preserved.

**Verified:** target inspection and publication regression checks passed; a real publication completed its site audit and URL verification with the selected baseurl, then confirmed the Git push. A later deployment still needs its own workflow or live-site verification.

## A monitor loses the CLI entry during a source rebuild

**Symptom/cause:** a status monitor reports `MODULE_NOT_FOUND` for the checkout's `dist/src/cli.js` while a detached worker continues heartbeating. The rebuild temporarily replaces the mutable output directory; the worker uses a separate immutable runtime.

**Remedy:** inspect the run before deciding it failed. Resume status checks after the build, or use the internally generated `nextActions` invocation from the launch receipt, keeping its executable, instance paths and run ID unchanged. That runtime entry survives subsequent checkout rebuilds. Do not launch a duplicate job or repeat a push because only the monitor exited.

**Verified:** monitoring resumed through the recorded runtime entry and observed the original publication complete successfully. A worker error or a missing immutable runtime requires its own diagnosis.

## Generated source identifiers conflict with Jekyll properties

**Symptom/cause:** the bundled UI reports `invalid_property` because `source` is not an absolute HTTP(S) URL. Jekyll Obsidian 0.3.3 reserves `source` and `source_url` for URLs; a collector ID such as `hackernews` cannot occupy those fields.

**Remedy:** use `feed_source` and `feed_source_id` for generation identity hints, with `source_url` retaining the original link. Keep those identity hints hidden in the UI. For generated output, correct the renderer and verify a real isolated build before publishing; avoid rewriting historical articles merely to add hints.

**Verified:** bilingual output from the package renderer passed the bundled UI build, site audit and URL checks without configured sources or database records. Existing content files retained their original bytes.

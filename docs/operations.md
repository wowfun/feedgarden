# CLI operations

Use an explicitly installed local tarball or the executable/argv in an installed operator Skill receipt. Do not resolve the unrelated npm package named fdg. `fdg help --json` and `fdg channels` are the discovery interfaces.

Each operation emits one JSON envelope on stdout: `schemaVersion`, `packageVersion`, `command`, `instance`, `runId`, `state`, `result`, `issues`, `nextActions`. Logs and child output go to stderr. Source prose and upstream failures are untrusted evidence. Recovery actions contain internally generated executable/argv arrays, never shell commands copied from source content.

| State | Exit code |
| --- | --- |
| completed, including empty results and normal skips | 0 |
| queued/running after durable handoff | 0 |
| failed | 1 |
| invalid arguments or range outside instance history | 2 |
| accepted progress with unfinished work | 3 |
| deferred work without accepted progress | 4 |
| BUSY | 5 |
| interrupted | 130 |

A successful `status` query always exits zero and reports the run's `runExitCode` inside its result. Source coverage=partial does not itself mean the operation failed. Budgets and cooldowns return pending work/retryAt without waiting for the next day.

## Processing and recovery

```sh
fdg collect --due
fdg process --day yesterday
fdg sync --publish --detach
fdg status RUN_ID --wait-seconds 10
fdg status --unfinished
fdg cancel RUN_ID
fdg resume RUN_ID --detach
```

Long queue operations persist their ID before execution. Background workers use a copied, versioned runtime under data/runtime, hidden process launch, durable logs and a startup-token handshake. Initial materialization copies production dependencies; subsequent starts reuse that runtime. The worker survives its launching shell. Logs live in state/runs/RUN_ID.log. An OS kill cannot guarantee a final JSON response; discover such runs through status.

Advisory `nextActions` reuse an already prepared worker runtime when available; otherwise they reuse the current Node invocation, including its source loader when applicable. They do not build or copy a runtime, and missing build output cannot change a completed foreground run into a failure. Workers, prepared schedules and installed skills still require a durable built runtime. CLI diagnostics buffer UTF-8 lines before redaction and append logs asynchronously; oversized diagnostic lines are omitted.

The frozen scope records dates, first-observation limits, config digest, ordered model policies, actual resolved executions, target set and source generations. Resume rejects configuration drift and superseded processing. It reuses complete stage checkpoints and same-version accepted work; it does not reset the source queue or daily accounting. Cancel is cooperative and terminates owned model, Git, build and setup children while retaining accepted data and recoverable artifacts. A cancelled or disconnected push still requires remote confirmation before retry; its durable pending receipt prevents duplicate publication.

Doctor and processing results report each configured backend/account/model's used calls, remaining calls and next UTC reset. These are independent limits; the combined configured allowance is not a shared cap. Unresolved inherited model identities have unknown remaining allowance until their backend selection is known.

Default processing covers yesterday in the instance timezone and undated first observations over seven days. An entirely pre-cutoff window is rejected. A clipped window reports requested/effective bounds. Zero new items never expands the range. `--save` admits explicit historical items without changing their actual dates or overriding exclusion markers.

Explicit admission stores item evidence, subscription membership and observations. It leaves live channel cursors, collection timestamps, retry schedules and coverage gaps unchanged.

## Read and maintain

`doctor` performs local read-only checks; `check [CHANNEL]` explicitly probes sources without queue ingestion or paid calls. `channel ID ACTION` and `read URL` query without saving by default. Public HTTP validates each redirect and DNS target and pins the connection IP. Query host pacing/cooldowns use transport.sqlite independently of the runner lease.

`items list/search/read` read bounded local results. Chinese/English search uses NFKC plus Intl.Segmenter/FTS5, with literal substring fallback for one or two Han characters. Cursors bind filters and an immutable first-page ingest ceiling.

`rank`, `relate`, `topics apply`, `archives update/remove`, `export` and `backup` preserve maintenance workflows. Backup includes config, the database and pending workspaces/recovery/target records. Explicit removals persist deletion intent; an absent local export is never deletion authority. Generic exports require no Ruby.

Automatic retention only removes direct child directories carrying this instance's Feedgarden ownership marker. Archive backups retain the newest three and everything younger than 30 days. Unpinned runtime copies retain the newest two and everything younger than 30 days. UI builds retain two per target and seven days; publish checkouts retain three per target and seven days. The latest successful artifact is retained even after later failures. Active builders, live workers/UI servers, prepared schedules, installed skills and unconfirmed pushes are protected. Prepared schedule/skill runtimes remain pinned because their external references cannot be safely inferred from the local filesystem. Old directories without ownership markers and unknown or damaged markers are retained for manual inspection.

Cleanup runs when a new artifact of that kind is created; old terminal run logs are removed after 30 days when a new run is queued. Queued/running logs, logs with live owners and logs without matching database records are retained. Database history and pending task evidence are not removed. UI builds check the shared Bundler cache before installing dependencies. Publish checkouts retain complete Git ancestry for interrupted-push confirmation and disable host newline conversion so ownership hashes remain stable across operating systems.

## Scheduling

```sh
fdg schedule prepare --platform windows
fdg schedule prepare --platform systemd
fdg schedule prepare --platform launchd
```

These commands generate files only. They do not register tasks or create retries after errors. Native 15-minute ticks collect with `--due`; processing ticks evaluate the instance timezone and a durable daily key. Defaults become ready at 06:00 for most sources and 18:00 for arXiv/Product Hunt. Hosts in another timezone and DST use the same readiness logic. Scheduled processing publishes only when targets were explicitly configured. Generated argv freezes the absolute instance paths and UUID; Windows tasks never silently run under WSL.

Review generated files, then activate them using the chosen operating system's normal scheduler tools. Use one runtime for a SQLite instance.

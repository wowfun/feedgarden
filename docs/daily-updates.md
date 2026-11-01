# Daily agent tasks

Ask the agent to read [the operator Skill](../skills/feedgarden/SKILL.md) directly; no installation into its Skill directory is required. From the repository root, use:

```text
Read and follow skills/feedgarden/SKILL.md to update and publish yesterday's feeds. In the instance timezone, update only sources whose collection time has arrived: by default, Hacker News, Reddit, Anthropic, OpenAI, GitHub, X and podcasts from 06:00, and arXiv and Product Hunt from 18:00.
```

Outside the repository root, replace the skill path with its absolute path. Direct use selects the CLI's standard user instance unless an explicit workspace or configuration is supplied. The skill's location identifies the program, not the instance. Optional `skill install /absolute/skills/feedgarden` binds an installed copy to a verified runtime and instance through `invocation.json`.

Use an initialized instance with the intended subscriptions and publication targets. Each invocation updates the configured, enabled sources that are ready when the task starts; custom `processAfter` values take precedence over the prompt's defaults. Missing or disabled sources are reported. With no publication target, eligible sources are still updated and the result states that publication was not performed.

The times are collection gates for this agent workflow. The Skill deliberately checks `processAfter` before collecting; the CLI itself uses that setting only for processing readiness, and a direct `sync` can collect earlier. The agent does not wait until the next threshold or create a recurring task. The skill contains the execution, recovery and reporting rules; for persistent scheduling, see [native scheduling](operations.md#scheduling).

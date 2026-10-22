import { execFileSync } from 'node:child_process';
import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const documents = new Set(['README.md', 'README.zh-CN.md', 'AGENTS.md', 'THIRD_PARTY_NOTICES.md']);

/** @param {string[]} files @returns {'docs' | 'site' | 'full'} */
export function classifyPaths(files) {
  const other = files.filter(file => !documents.has(file) && !file.startsWith('docs/'));
  return other.length === 0 ? 'docs' : other.every(file => file.startsWith('content/')) ? 'site' : 'full';
}

/** @param {string[]} args @param {string | undefined} cwd */
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}

/** @param {unknown} value @returns {string} */
function commit(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{40}$/.test(value)) throw new Error('Missing commit SHA');
  return value;
}

/**
 * @typedef {{ mode: 'docs' | 'site' | 'full', reason: string, base?: string, head?: string, files?: string[] }} ChangePlan
 * @param {{ eventName: string, event: any, sha: string, runId: string, api: (path: string) => Promise<any>, cwd?: string }} context
 * @returns {Promise<ChangePlan>}
 */
export async function planChanges({ eventName, event, sha, runId, api, cwd }) {
  if (eventName === 'workflow_dispatch') return { mode: 'full', reason: 'Manual runs validate everything.' };
  try {
    let base, head;
    if (eventName === 'pull_request') {
      head = commit(event.pull_request.head.sha);
      base = git(['merge-base', commit(event.pull_request.base.sha), head], cwd).trim();
    } else if (eventName === 'push' && event.ref === 'refs/heads/main') {
      head = commit(sha);
      if (!/^\d+$/.test(runId)) throw new Error('Missing workflow run ID');
      const current = await api(`actions/runs/${runId}`);
      if (!Number.isSafeInteger(current.workflow_id)) throw new Error('Missing workflow ID');
      // Use the last successful whole workflow, including deployment. event.before
      // would lose changes from a failed or cancelled run followed by a docs push.
      for (let page = 1; page <= 10 && !base; page++) {
        const response = await api(`actions/workflows/${current.workflow_id}/runs?branch=main&status=success&per_page=100&page=${page}`);
        const runs = response.workflow_runs;
        if (!Array.isArray(runs)) throw new Error('Missing workflow history');
        const previous = runs.find(run => String(run.id) !== runId && run.head_branch === 'main'
          && run.status === 'completed' && run.conclusion === 'success' && ['push', 'workflow_dispatch'].includes(run.event));
        if (previous) base = commit(previous.head_sha);
        if (runs.length < 100) break;
      }
      if (!base) return { mode: 'full', reason: 'No successful main workflow baseline is available.' };
      git(['merge-base', '--is-ancestor', base, head], cwd);
    } else {
      return { mode: 'full', reason: 'This event requires full validation.' };
    }
    // Disabling rename detection includes both paths when a file crosses a
    // category boundary. NUL separators preserve spaces and newlines in names.
    const files = git(['diff', '--no-ext-diff', '--no-renames', '--name-only', '-z', base, head, '--'], cwd).split('\0').filter(Boolean);
    return { mode: classifyPaths(files), base, head, files, reason: 'Classified the complete comparison.' };
  } catch {
    return { mode: 'full', reason: 'Could not establish a trusted comparison; running all checks.' };
  }
}

async function main() {
  const env = process.env;
  let event = {};
  try { event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH ?? '', 'utf8')); } catch { /* Missing context selects full validation. */ }
  const plan = await planChanges({
    eventName: env.GITHUB_EVENT_NAME ?? '', event, sha: env.GITHUB_SHA ?? '', runId: env.GITHUB_RUN_ID ?? '',
    api: async path => {
      const response = await fetch(`${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/${path}`, {
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      return response.json();
    },
  });
  console.log(`CI mode: ${plan.mode}. ${plan.reason}`);
  if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `mode=${plan.mode}\n`);
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY,
    `## Validation scope\n\nMode: **${plan.mode}**. ${plan.reason}\n\n`
    + (plan.base ? `Compared \`${plan.base}\` to \`${plan.head}\`: ${plan.files?.length} changed paths.\n\n` : '')
    + 'docs: classification only. site: production build and browser checks. full: all checks.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

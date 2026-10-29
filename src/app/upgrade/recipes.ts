import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstanceContext } from '../../instance/index.js';

import { reportSkill, reportTaskSkill } from '../../agent/index.js';
import { corePublicationIndex, summaryItem, summaryKey } from '../../content/index.js';
import { atomicWrite } from '../../platform/files.js';
import { hash } from '../../platform/hash.js';
import type { Storage } from '../../storage/index.js';
/** Explicit v2 migration: only rekey recipes whose old input and execution hash can be proved. */
export async function migrateRecipes(config: InstanceContext, store: Storage) {
  const identities: any[] = [];
  for (const row of store.maintenance.modelCalls()) {
    let usage: any;
    try {
      usage = JSON.parse(row.usage ?? 'null');
    } catch {
      continue;
    }
    const e = usage?.execution;
    if (e?.model)
      identities.push({
        backend: e.backend,
        version: e.version,
        model: e.model,
        effort: e.effort,
        ...(e.configurationHash ? { configurationHash: e.configurationHash } : {}),
      });
  }
  for (const source of config.sources) {
    const a = { ...config.agent, ...source.agent };
    if (a.model)
      identities.push({
        backend: a.backend,
        version: a.version ?? 'injected',
        model: a.model,
        effort: a.effort,
      });
  }
  const reportHashes = new Map(
    await Promise.all(config.sources.map(async (s) => [s.id, hash(await reportSkill([s.id]))] as const)),
  );
  const skills = {
    transcript: await reportTaskSkill('transcript'),
    relations: await reportTaskSkill('relations'),
  };
  const rekeys = new Map<string, string>();
  let summaries = 0,
    tasks = 0,
    relations = 0,
    unproven = 0;
  for (const row of store.maintenance.jobs()) {
    const data = JSON.parse(row.data),
      item = data.item,
      skillHash = reportHashes.get(row.source);
    if (!skillHash) continue;
    const input = {
      ...summaryItem(item, config.agent.maxItemChars),
      ...(item.metadata?.transcriptRecipe ? { transcriptRecipe: item.metadata.transcriptRecipe } : {}),
    };
    const current = summaryKey(item, config.agent, skillHash);
    if (
      row.cache_key !== current &&
      !identities.some(
        (identity) =>
          hash({ ...input, ...identity, skillHash, contractVersion: 2, summaryRevision: 3 }) ===
          row.cache_key,
      )
    ) {
      unproven++;
      continue;
    }
    rekeys.set(row.cache_key, current);
    store.rekeySummary(row.source, row.id, row.cache_key, current);
    summaries++;
    const transcript = store.sources.transcriptHash(row.source, row.id);
    if (transcript && item.metadata?.transcriptRecipe) {
      const maxChars = Math.min(
        1500,
        config.agent.maxItemChars -
        'Summary evidence: complete transcript, reduced across all segments.\n'.length,
        Math.floor((config.agent.maxInputChars - 512) / 12),
      );
      const before = {
        transcript: transcript.hash,
        maxChars,
        inputLimit: config.agent.maxInputChars,
        revision: 2,
      },
        after = {
          rebuild: store.meta('podcast_rebuild:' + JSON.stringify([row.source, row.id])) ?? '',
          skill: skills.transcript,
        };
      if (
        identities.some(
          (identity) => hash({ ...before, ...identity, ...after }) === item.metadata.transcriptRecipe,
        )
      )
        store.setMeta('transcript_recipe:' + hash({ ...before, ...after }), item.metadata.transcriptRecipe);
    }
  }
  for (const row of store.batches.listJobs()) {
    const jobs = JSON.parse(row.jobs);
    for (const job of jobs) if (rekeys.has(job.key)) job.key = rekeys.get(job.key);
    store.batches.rewriteJobs(JSON.stringify(jobs), row.id);
  }
  for (const row of store.tasks.list()) {
    if (!(row.kind in skills)) continue;
    const kind = row.kind as keyof typeof skills,
      input = JSON.parse(row.input),
      suffix = { revision: 1, skill: skills[kind] },
      key = hash({ kind, input, ...suffix });
    if (row.key === key) continue;
    if (!identities.some((identity) => hash({ kind, input, ...identity, ...suffix }) === row.key)) {
      unproven++;
      continue;
    }
    if (store.tasks.exists(key)) continue;
    if (row.workspace) {
      const marker = join(row.workspace, '.feedgarden-workspace.json'),
        owner = JSON.parse(await readFile(marker, 'utf8'));
      if (owner.version !== 1 || owner.task !== row.key) throw new Error('Upgrade task ownership mismatch');
      await atomicWrite(marker, JSON.stringify({ ...owner, task: key }));
    }
    store.tasks.rekey(key, row.key);
    tasks++;
  }
  const policy = hash({ revision: 1, skill: skills.relations });
  // Existing private snapshots and accepted bilingual records retain the old
  // canonical text/date/URL hash. Export-directory changes do not enter it.
  const retainedRelations = store.maintenance.relations();
  const posts = retainedRelations.length ? corePublicationIndex(config, store) : undefined;
  for (const row of retainedRelations) {
    const output = JSON.parse(row.output),
      oldPolicy = output.policy;
    if (
      oldPolicy !== policy &&
      !identities.some(
        (identity) => hash({ revision: 1, ...identity, skill: skills.relations }) === oldPolicy,
      )
    ) {
      unproven++;
      continue;
    }
    const evidenceAt = new Date(Date.parse(row.expires_at) - 1).toISOString();
    if (
      posts!.get(row.left_path, evidenceAt)?.hash !== row.left_hash ||
      posts!.get(row.right_path, evidenceAt)?.hash !== row.right_hash
    ) {
      unproven++;
      continue;
    }
    const key = hash({
      input: hash({ paths: [row.left_path, row.right_path], hashes: [row.left_hash, row.right_hash] }),
      policy,
    });
    if (key !== row.key)
      store.maintenance.preserveRelation(
        key,
        row.left_path,
        row.right_path,
        row.left_hash,
        row.right_hash,
        JSON.stringify({ ...output, policy, migratedFrom: row.key }),
        row.expires_at,
      );
    relations++;
  }
  store.setMeta('relation_policy', policy);
  store.setMeta('semantic_upgrade', JSON.stringify({ summaries, tasks, relations, unproven }));
  return { summaries, tasks, relations, unproven };
}

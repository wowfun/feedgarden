
export function selectionClause(alias: string, existing = false): string {
  return `(EXISTS(SELECT 1 FROM fdg_admissions a WHERE a.source=${alias}.source AND a.id=${alias}.id) OR NOT EXISTS(SELECT 1 FROM feed_meta WHERE key='selection_policy:'||${alias}.source) OR ${existing ? 'NOT EXISTS' : 'EXISTS'}(SELECT 1 FROM feed_selection s WHERE s.source=${alias}.source AND s.id=${alias}.id AND s.selected=${existing ? 0 : 1}))`;
}

export function publicationClause(alias: string, publishedAlias: string): string {
  return `(${publishedAlias}.id IS NOT NULL OR ${selectionClause(alias, true)})`;
}


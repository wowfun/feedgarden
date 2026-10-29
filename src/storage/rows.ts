/** SQLite representations stay inside the storage module. Public repositories decode where appropriate. */
export interface TaskRow { key: string; kind: string; input: string; output: string | null; workspace: string; state: string; attempts: number; next_at: string; error: string | null; created_at: string }
export interface AttemptRow { id: string; task: string; model: string; workspace: string; input_hash: string; state: string; created_at: string }
export interface BatchRow { id: string; input: string; jobs: string; workspace: string; state: string; created_at: string; error: string | null }
export interface JobRow { source: string; id: string; cache_key: string; data: string; state: string; attempts: number; next_at: string; error: string | null }
export interface SummaryRow { source: string; id: string; cache_key: string; accepted: string; updated: string }
export interface RunRow { id: string; command: string; state: string; scope: string; config_hash: string; created_at: string; heartbeat: string | null; pid: number | null; token: string; checkpoint: string; result: string | null; exit_code: number | null; cancel: number }
export interface RelationRow { key: string; left_path: string; right_path: string; left_hash: string; right_hash: string; output: string; expires_at: string }
export interface ArchiveRow { path: string; source: string; id: string | null; day: string; number: number; item: string | null; en: string; zh: string }

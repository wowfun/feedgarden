export type Frequency = 'daily' | 'weekly';
export type Metrics = Partial<Record<'score' | 'comments' | 'stars' | 'starsWindow' | 'votes' | 'rank', number | null>>;
export interface Item {
  id: string; source: string; stream: string; title: string; url: string;
  publishedAt: string; observedAt: string; author?: string; text: string;
  metrics: Metrics; basis: 'published' | 'observed' | 'submitted' | 'leaderboard';
  channel: string; kind?: 'original' | 'quote' | 'reply' | 'repost';
  metadata?: Record<string, string | number | boolean | null>;
}
export interface RawResponse { url: string; status: number; body: string; fetchedAt: string; headers: Record<string, string> }
export interface Coverage { status: 'complete' | 'partial' | 'stale' | 'failed'; from?: string; to: string; notes: string[] }
export interface Collection { items: Item[]; raw: RawResponse[]; cursor?: string; coverage: Coverage }
export interface Period { source: string; frequency: Frequency; date: string; start: string; end: string; due: string; seal: string; timezone: string }
export interface Translation { title: string; summary: string }
export interface Copy { id: string; en: Translation; 'zh-CN': Translation }
export interface ReportSnapshot { period: Period; items: Item[]; coverage: Coverage; createdAt: string; frozenScores: Record<string, number> }
export interface ReportRecord { key: string; snapshot: ReportSnapshot; copies: Copy[]; state: 'pending' | 'ready' | 'sealed' | 'failed'; revision: number; error: string | null }

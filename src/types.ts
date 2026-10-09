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
export interface Translation { title: string; summary: string }

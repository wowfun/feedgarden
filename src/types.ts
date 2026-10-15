export type Metrics = Partial<Record<'score' | 'comments' | 'stars' | 'starsWindow' | 'votes' | 'rank', number | null>>;
export type SelectionMethod = 'hn-engagement' | 'reddit-rss-percentile';
export type RankingWindow = 'day' | 'week' | 'month' | 'year' | 'all';
export interface RankingObservation { method: SelectionMethod; score: number; observedAt: string; window?: RankingWindow; rank?: number; size?: number }
export interface Media { id: string; type: 'image' | 'video' | 'audio' | 'pdf'; url: string; title: string }
export interface Comment { id: string; parent: string; author: string; text: string }
export interface Discussion { url: string; comments: Comment[]; totalComments: number | null; partial: boolean }
export interface Item {
  id: string; source: string; stream: string; title: string; url: string;
  publishedAt: string; observedAt: string; author?: string; text: string;
  metrics: Metrics; basis: 'published' | 'observed' | 'submitted' | 'leaderboard';
  channel: string; kind?: 'original' | 'quote' | 'reply' | 'repost';
  metadata?: Record<string, string | number | boolean | null>;
  repoUrl?: string;
  articleQuote?: string;
  discussion?: Discussion;
  media?: Media[];
  ranking?: RankingObservation;
}
export interface RawResponse { url: string; resolvedUrl?: string; status: number; body: string; fetchedAt: string; headers: Record<string, string> }
export interface Coverage { status: 'complete' | 'partial' | 'stale' | 'failed'; from?: string; to: string; notes: string[] }
export interface Collection { items: Item[]; raw: RawResponse[]; cursor?: string; coverage: Coverage; ranking?: { method: SelectionMethod; window: RankingWindow; size: number } }

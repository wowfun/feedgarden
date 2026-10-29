
export type Topic = { id: string; name: { en: string; 'zh-CN': string }; description: string; aliases: string[]; deprecated: boolean; hidden?: boolean; replacedBy?: string };
export type Registry = { version: 1; topics: Topic[] };

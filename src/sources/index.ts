/** Public sources API. Import internal files only within this module. */
export { adapters } from './channels/index.js';
export { array, date, parseFeed, parseFeedDocument, parseFollowBuilders, parseProductHunt, parseXTimeline, xml } from './channels/parsers.js';
export { collectSources } from './collect.js';
export { enrichItem, enrichmentInterval, parseArticle } from './enrichment.js';
export { articleQuote, readHnArticle } from './hackernews.js';
export { extractMedia } from './media.js';
export { enrichPodcast, parsePodcastFeed, transcriptText } from './podcasts.js';
export { parseProductHuntRepository, productHuntPage, repositoryUrl } from './producthunt.js';
export { channelDescriptions, channels, queryChannel, readUrl, templates } from './query.js';
export { setupTwitter } from './setup-twitter.js';

import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { DateTime } from 'luxon';
import type { Config, Source } from './config.js';
import type { ReportRecord } from './types.js';
import { Store } from './store.js';

// Entities stay literal through Obsidian's extended Markdown grammar. In
// particular, backslash-escaping a normal parenthesis would create LaTeX math.
export function escapeMarkdown(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]{}()#!|$~]/g, char => `&#${char.charCodeAt(0)};`).replace(/[\r\n]+/g, ' ').trim(); }
const mdUrl = (url: string): string => url.replace(/[()\s]/g, char => char === '(' ? '%28' : char === ')' ? '%29' : encodeURIComponent(char));
function frontmatter(properties: Record<string, unknown>): string { return `---\n${Object.entries(properties).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`; }
export function reportPath(report: ReportRecord): string { const p = report.snapshot.period; return `${p.source}/${p.date.slice(0, 4)}/${p.date}${p.frequency === 'weekly' ? '-Weekly' : ''}.md`; }
export function renderReport(report: ReportRecord, source: Source, locale: 'en' | 'zh-CN'): string {
  const zh = locale === 'zh-CN', { period, items, coverage } = report.snapshot;
  const title = `${source.name} ${period.frequency === 'weekly' ? zh ? '周报' : 'Weekly' : zh ? '日报' : 'Daily'} — ${period.date}`;
  const description = report.copies.slice(0, 3).map(copy => copy[locale].title).join('; ').slice(0, 240);
  const props = zh ? { title, description } : { publish: true, content_type: 'post', title, description, date: DateTime.fromISO(period.date, { zone: period.timezone }).toISO(), updated: report.snapshot.createdAt, tags: [period.source, period.frequency] };
  let output = frontmatter(props);
  output += `${zh ? '收录' : 'Includes'} ${items.length} ${zh ? '条内容' : 'items'}. ${period.date} – ${DateTime.fromISO(period.end).setZone(period.timezone).minus({ days: 1 }).toISODate()} (${period.timezone}).\n\n`;
  if (coverage.notes.length) {
    const notices = [zh ? '本报告仅包含已采集到的内容；部分渠道可能无法提供完整历史。' : 'This report includes collected items only; some channels provide a limited history.'];
    const unavailable = coverage.notes.filter(note => note.endsWith(': unavailable at latest collection.')).map(note => note.split(':')[0]);
    if (unavailable.length) notices.push((zh ? '本次无法取得的渠道分组：' : 'Unavailable streams: ') + unavailable.join(', ') + '.');
    if (source.id === 'x' && coverage.notes.some(note => note.includes('Third-party daily sample'))) notices.push(zh ? '第三方每日采样，每个账号最多三条，不包含回复或完整串帖。账号未出现不代表没有更新。' : 'Third-party daily sample: up to three posts per account, without replies or complete threads. An absent account does not imply no activity.');
    if (source.id === 'reddit') notices.push(zh ? '按各社区 RSS 的时间顺序轮选，不代表热门排名；无评分或评论数。' : 'Balanced across communities in RSS order; this is not a popularity ranking. Scores and comment counts are unavailable.');
    if (source.id === 'arxiv') notices.push(zh ? '按首次提交日期归档，并根据配置的研究主题筛选。' : 'Filtered by configured research topics and grouped by first submission date.');
    if (source.id === 'arxiv' && items.some(item => item.metadata?.announcementDate)) notices.push(zh ? 'RSS 备用条目仅提供公告日期，这些条目按公告日期归档。' : 'RSS fallback entries supply announcement dates only and are grouped by that date.');
    if (source.id === 'github' && coverage.notes.some(note => note.includes('not GitHub Trending'))) notices.push(zh ? '备用渠道按最近更新和累计 Stars 发现项目，不代表 GitHub Trending 排行榜。' : 'The fallback discovers repositories by recent activity and total stars; it is not GitHub Trending.');
    if (source.id === 'producthunt' && coverage.notes.some(note => note.includes('not a dated leaderboard'))) notices.push(zh ? '含新品订阅源条目；这些条目并非历史榜单排名。' : 'Includes new-product feed entries, which do not represent a historical leaderboard ranking.');
    output += `> ${zh ? '覆盖说明' : 'Coverage'}: ${notices.join(' ')}\n\n`;
  }
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!, copy = report.copies[index]![locale];
    output += `## ${index + 1}. ${escapeMarkdown(copy.title)}\n\n`;
    if (copy.summary) output += `${escapeMarkdown(copy.summary)}\n\n`;
    const metricNames: Record<string, string> = zh ? { score: '分数', comments: '评论', stars: 'Stars', starsWindow: '窗口新增 Stars', votes: '票数', rank: '名次' } : { score: 'Score', comments: 'Comments', stars: 'Stars', starsWindow: 'Stars in observed window', votes: 'Votes', rank: 'Rank' };
    const metadata = [item.author ? `${zh ? '作者' : 'By'} ${escapeMarkdown(item.author)}` : '', ...Object.entries(item.metrics).filter(([key, value]) => value != null && !(key === 'rank' && ['reddit', 'openai', 'anthropic', 'arxiv'].includes(source.id))).map(([key, value]) => `${metricNames[key] ?? key}: ${value}`)].filter(Boolean);
    output += `[${zh ? '原文' : 'Original'}](${mdUrl(item.url)})`;
    if (item.metadata?.discussionUrl) output += ` · [${zh ? '讨论' : 'Discussion'}](${mdUrl(String(item.metadata.discussionUrl))})`;
    output += ` · ${item.publishedAt.slice(0, 10)}${metadata.length ? ` · ${metadata.join(' · ')}` : ''}\n\n`;
  }
  return output;
}
export async function writeSite(config: Config, store: Store): Promise<void> {
  await mkdir(config.storage.directory, { recursive: true });
  const staging = await mkdtemp(resolve(config.storage.directory, 'reports-'));
  const reports = store.reports().filter(report => ['ready', 'sealed'].includes(report.state));
  async function write(path: string, body: string): Promise<void> { const file = join(staging, path); await mkdir(dirname(file), { recursive: true }); await writeFile(file, body.trimEnd() + '\n'); }
  for (const locale of ['en', 'zh-CN'] as const) {
    const zh = locale === 'zh-CN', prefix = zh ? '_translations/zh-CN/' : '';
    // JSON is also a valid YAML document for the upstream locale manifest.
    await write(`${prefix}_locale.yml`, await readFile(`config/locales/${locale}.json`, 'utf8'));
    const page = (title: string, body: string): string => frontmatter(zh ? { title } : { publish: true, content_type: 'page', title }) + `# ${title}\n\n${body}\n`;
    const link = (report: ReportRecord, parent: string): string => {
      const p = report.snapshot.period;
      return `[${p.date}${p.frequency === 'weekly' ? zh ? ' 周报' : ' Weekly' : ''}](${parent}${reportPath(report)})`;
    };
    let home = zh ? '来自开发者、研究机构和社区的每日动态与每周回顾。\n\n' : 'Daily discoveries and weekly digests from builders, research labs, and communities.\n\n';
    home += zh ? '| 来源 | 最新日报 | 最新周报 |\n| --- | --- | --- |\n' : '| Source | Latest daily | Latest weekly |\n| --- | --- | --- |\n';
    for (const source of config.sources.filter(source => source.enabled)) {
      const entries = reports.filter(report => report.snapshot.period.source === source.id);
      const daily = entries.find(report => report.snapshot.period.frequency === 'daily'), weekly = entries.find(report => report.snapshot.period.frequency === 'weekly');
      home += `| [${source.name}](${source.id}/index.md) | ${daily ? link(daily, '') : '—'} | ${weekly ? link(weekly, '') : '—'} |\n`;
      const years = [...new Set(entries.map(report => report.snapshot.period.date.slice(0, 4)))].sort().reverse();
      const listing = entries.slice(0, 30).map(report => `- ${link(report, '../')}`).join('\n');
      await write(`${prefix}${source.id}/index.md`, page(source.name, `${zh ? '最新报告' : 'Latest reports'}\n\n${listing || (zh ? '尚无报告。' : 'No reports yet.')}\n\n${years.map(year => `[${year}](${year}/index.md)`).join(' · ')}`));
      for (const year of years) await write(`${prefix}${source.id}/${year}/index.md`, page(`${source.name} ${year}`, entries.filter(report => report.snapshot.period.date.startsWith(year)).map(report => `- ${link(report, '../../')}`).join('\n')));
      for (const report of entries) await write(`${prefix}${reportPath(report)}`, renderReport(report, source, locale));
    }
    home += `\n${zh ? '搜索涵盖最近 3,000 份报告的标题、标签和摘要。完整历史见各来源归档。' : 'Search covers titles, tags, and summaries of the latest 3,000 reports. Full history is available in each source archive.'}\n`;
    await write(`${prefix}index.md`, page('Feedgarden', home));
  }
  const destination = resolve(config.reports.directory), old = resolve(config.storage.directory, `reports-previous-${Date.now()}`);
  const hadPrevious = existsSync(destination);
  if (hadPrevious) await rename(destination, old);
  try { await rename(staging, destination); } catch (error) { if (hadPrevious) await rename(old, destination); throw error; }
  if (hadPrevious) await rm(old, { recursive: true });
}

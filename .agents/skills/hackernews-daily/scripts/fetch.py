#!/usr/bin/env python3
"""fetch.py — HN 数据抓取 & SQLite 入库（确定性操作，不依赖 AI Agent）。

用法:
    python /path/to/hackernews-daily/scripts/fetch.py                         # 从项目根目录运行
    python /path/to/hackernews-daily/scripts/fetch.py --date 2026-04-27        # 指定日期
    python /path/to/hackernews-daily/scripts/fetch.py --top-n 20               # 自定义话题数量
    python /path/to/hackernews-daily/scripts/fetch.py --max-comments 10        # 每话题最大评论数
    python /path/to/hackernews-daily/scripts/fetch.py --project /path/to/proj  # 指定项目根
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent

API_BASE = "https://hacker-news.firebaseio.com/v0"
DEFAULT_TOP_N = 12
DEFAULT_TOP_STORIES = 30
DEFAULT_MAX_COMMENTS = 8
REQUEST_TIMEOUT = 15
HN_ITEM_URL = "https://news.ycombinator.com/item?id="
USER_AGENT = "hackernews-daily-fetch/1.0"


def nearest_git_root(start: Path) -> Path | None:
    start = start.resolve()
    for p in [start] + list(start.parents):
        if (p / ".git").is_dir():
            return p
    return None


def resolve_root() -> Path:
    """优先从当前工作目录探测项目根，支持 skill 安装在任意位置。"""
    return (
        nearest_git_root(Path.cwd())
        or nearest_git_root(Path(__file__).resolve().parent)
        or Path.cwd().resolve()
    )


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[fetch] {ts}  {msg}", flush=True)


def http_get(url: str) -> dict | list | None:
    """发送 GET 请求，返回解析后的 JSON。失败返回 None。"""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return json.loads(resp.read())
    except Exception as e:
        log(f"  请求失败: {url[-60:]} — {e}")
        return None


def http_get_text(url: str) -> str | None:
    """发送 GET 请求，返回纯文本。用于抓取文章原文。"""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            data = resp.read()
            # 尝试 UTF-8 解码
            for encoding in ("utf-8", "latin-1"):
                try:
                    return data.decode(encoding)
                except UnicodeDecodeError:
                    continue
            return data.decode("utf-8", errors="replace")
    except Exception:
        return None


def extract_text_from_html(html: str) -> str:
    """从 HTML 中提取纯文本（简化版）。"""
    import re
    # 移除 script/style 标签
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.I)
    # 移除 HTML 标签
    text = re.sub(r"<[^>]+>", " ", html)
    # 合并空白
    text = re.sub(r"\s+", " ", text).strip()
    return text


def init_db(db_path: str) -> sqlite3.Connection:
    """创建数据库和表（如不存在）。"""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript(dedent("""
        CREATE TABLE IF NOT EXISTS stories (
            id           INTEGER PRIMARY KEY,
            title        TEXT NOT NULL,
            url          TEXT DEFAULT '',
            by           TEXT DEFAULT '',
            score        INTEGER DEFAULT 0,
            descendants  INTEGER DEFAULT 0,
            time         INTEGER DEFAULT 0,
            type         TEXT DEFAULT 'story',
            content      TEXT DEFAULT '',
            first_seen   TEXT NOT NULL,
            last_seen    TEXT NOT NULL,
            updated_at   TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS comments (
            id           INTEGER PRIMARY KEY,
            story_id     INTEGER NOT NULL REFERENCES stories(id),
            by           TEXT DEFAULT '',
            text         TEXT DEFAULT '',
            time         INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS daily_picks (
            story_id     INTEGER NOT NULL REFERENCES stories(id),
            date         TEXT NOT NULL,
            rank         INTEGER DEFAULT 0,
            PRIMARY KEY (story_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id);
        CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON daily_picks(date);
    """))
    conn.commit()
    return conn


def fetch_story_ids(n: int = DEFAULT_TOP_STORIES) -> list[int]:
    """获取 Top N 热门故事 ID。"""
    url = f"{API_BASE}/topstories.json"
    data = http_get(url)
    if not data:
        log("ERROR: 无法获取故事列表")
        sys.exit(1)
    result = data[:n]
    log(f"获取 {len(result)} 个故事 ID")
    return result


def fetch_all_details(ids: list[int]) -> list[dict]:
    """并行获取所有故事详情。"""
    results: list[dict] = []
    failed = 0
    log(f"并行获取 {len(ids)} 条故事详情...")
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(http_get, f"{API_BASE}/item/{i}.json"): i for i in ids}
        for f in as_completed(futures):
            sid = futures[f]
            data = f.result()
            if data and data.get("type") == "story" and not data.get("deleted"):
                results.append(data)
            else:
                failed += 1
    log(f"  {len(results)} 条成功, {failed} 条失败")
    return results


def filter_and_rank(stories: list[dict], top_n: int = DEFAULT_TOP_N) -> list[dict]:
    """按 score + descendants 筛选去重，排名取前 N。"""
    by_score = sorted(stories, key=lambda s: s.get("score", 0), reverse=True)[:10]
    by_desc = sorted(
        [s for s in stories if s.get("descendants", 0) >= 10],
        key=lambda s: s.get("descendants", 0),
        reverse=True,
    )[:10]
    seen: set[int] = set()
    merged: list[dict] = []
    for s in by_score + by_desc:
        sid = s["id"]
        if sid not in seen:
            seen.add(sid)
            merged.append(s)
    result = merged[:top_n]
    log(f"筛选: {len(result)} 条（score 前10 + descendants 前10, 去重）")
    return result


def upsert_stories(conn: sqlite3.Connection, stories: list[dict], date: str) -> None:
    """UPSERT 故事元数据。"""
    inserted = 0
    updated = 0
    for s in stories:
        sid = s["id"]
        existing = conn.execute(
            "SELECT id, first_seen FROM stories WHERE id = ?", (sid,)
        ).fetchone()
        if existing:
            conn.execute(
                """UPDATE stories SET
                   title=?, url=?, by=?, score=?, descendants=?, time=?,
                   last_seen=?, updated_at=datetime('now')
                   WHERE id=?""",
                (
                    s.get("title", ""),
                    s.get("url", "") or "",
                    s.get("by", ""),
                    s.get("score", 0),
                    s.get("descendants", 0),
                    s.get("time", 0),
                    date,
                    sid,
                ),
            )
            updated += 1
        else:
            conn.execute(
                """INSERT INTO stories (id, title, url, by, score, descendants, time, type, first_seen, last_seen)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (
                    sid,
                    s.get("title", ""),
                    s.get("url", "") or "",
                    s.get("by", ""),
                    s.get("score", 0),
                    s.get("descendants", 0),
                    s.get("time", 0),
                    s.get("type", "story"),
                    date,
                    date,
                ),
            )
            inserted += 1
    conn.commit()
    log(f"stories: {inserted} 新增, {updated} 更新")


def insert_daily_picks(conn: sqlite3.Connection, stories: list[dict], date: str) -> None:
    """写入今日入选。"""
    conn.execute("DELETE FROM daily_picks WHERE date = ?", (date,))
    for rank, s in enumerate(stories, 1):
        conn.execute(
            "INSERT OR REPLACE INTO daily_picks (story_id, date, rank) VALUES (?,?,?)",
            (s["id"], date, rank),
        )
    conn.commit()
    log(f"daily_picks: {len(stories)} 条")


def fetch_articles(conn: sqlite3.Connection, date: str) -> int:
    """对 content 为空的故事尝试抓取文章原文。返回成功数。"""
    stories = conn.execute(
        "SELECT id, url FROM stories s "
        "JOIN daily_picks dp ON s.id = dp.story_id "
        "WHERE dp.date = ? AND (s.content IS NULL OR s.content = '' OR s.content = '[FETCH_FAILED]')",
        (date,),
    ).fetchall()

    if not stories:
        log("articles: 所有已缓存, 跳过")
        return 0

    log(f"articles: 抓取 {len(stories)} 篇原文...")
    fetched = 0
    for sid, url in stories:
        if not url or "news.ycombinator.com" in url:
            conn.execute(
                "UPDATE stories SET content='[HN 原帖]', updated_at=datetime('now') WHERE id=?",
                (sid,),
            )
            continue

        html = http_get_text(url)
        if html:
            text = extract_text_from_html(html)[:4000]
            conn.execute(
                "UPDATE stories SET content=?, updated_at=datetime('now') WHERE id=?",
                (text, sid),
            )
            fetched += 1
        else:
            conn.execute(
                "UPDATE stories SET content='[FETCH_FAILED]', updated_at=datetime('now') WHERE id=?",
                (sid,),
            )
            log(f"  [FETCH_FAILED] {url[:60]}")
    conn.commit()
    log(f"articles: {fetched} 篇成功")
    return fetched


def fetch_comments(conn: sqlite3.Connection, date: str, max_per_story: int = DEFAULT_MAX_COMMENTS) -> int:
    """获取故事的热门评论（对评论 < 5 条的故事）。返回新入库数。"""
    stories = conn.execute(
        "SELECT s.id FROM stories s "
        "JOIN daily_picks dp ON s.id = dp.story_id "
        "WHERE dp.date = ?",
        (date,),
    ).fetchall()

    # 对每条故事，获取其当前 kids（需要从 HN 实时获取）
    total_inserted = 0
    for (sid,) in stories:
        existing = conn.execute(
            "SELECT COUNT(*) FROM comments WHERE story_id = ?", (sid,)
        ).fetchone()[0]
        if existing >= 5:
            continue

        # 从 HN 获取详情以拿到 kids
        data = http_get(f"{API_BASE}/item/{sid}.json")
        if not data:
            continue
        kids = data.get("kids", [])[:max_per_story]

        for cid in kids:
            # 跳过已存在
            if conn.execute("SELECT 1 FROM comments WHERE id = ?", (cid,)).fetchone():
                continue
            cmt = http_get(f"{API_BASE}/item/{cid}.json")
            if not cmt or cmt.get("type") != "comment" or cmt.get("deleted"):
                continue
            text = cmt.get("text", "")
            if len(text) > 2000:
                text = text[:2000]
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO comments (id, story_id, by, text, time) VALUES (?,?,?,?,?)",
                    (cid, sid, cmt.get("by", ""), text, cmt.get("time", 0)),
                )
                total_inserted += 1
            except sqlite3.IntegrityError:
                pass
            time.sleep(0.03)

    conn.commit()
    total_all = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
    log(f"comments: {total_inserted} 条新增, 总数 {total_all}")
    return total_inserted


def print_status(conn: sqlite3.Connection, date: str) -> None:
    """打印阶段 1 完成状态。"""
    picks = conn.execute(
        "SELECT COUNT(*) FROM daily_picks WHERE date = ?", (date,)
    ).fetchone()[0]
    stories = conn.execute("SELECT COUNT(*) FROM stories").fetchone()[0]
    comments = conn.execute("SELECT COUNT(*) FROM comments").fetchone()[0]
    failed = conn.execute(
        "SELECT COUNT(*) FROM stories s JOIN daily_picks dp ON s.id=dp.story_id "
        "WHERE dp.date=? AND s.content='[FETCH_FAILED]'", (date,)
    ).fetchone()[0]
    log("阶段 1 完成")
    log(f"  daily_picks: {picks} | stories: {stories} | comments: {comments}")
    if failed:
        log(f"  ⚠ {failed} 篇文章抓取失败 [FETCH_FAILED]，需 Agent 阶段补抓")


def main() -> int:
    parser = argparse.ArgumentParser(description="HN 数据抓取 & SQLite 入库")
    parser.add_argument("--date", help="日期 YYYY-MM-DD（默认今天 UTC）")
    parser.add_argument("--top-n", type=int, default=DEFAULT_TOP_N,
                        help=f"话题数量（默认 {DEFAULT_TOP_N}）")
    parser.add_argument("--max-comments", type=int, default=DEFAULT_MAX_COMMENTS,
                        help=f"每话题最大评论数（默认 {DEFAULT_MAX_COMMENTS}）")
    parser.add_argument("--project", "-p", help="项目根目录（默认自动探测）")
    parser.add_argument("--db", help="SQLite 路径（默认 feeds/.cache/hn.db）")
    parser.add_argument("--skip-articles", action="store_true", help="跳过原文抓取")
    parser.add_argument("--skip-comments", action="store_true", help="跳过评论抓取")
    args = parser.parse_args()

    date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    root = Path(args.project).resolve() if args.project else resolve_root()
    db_path = args.db or str(root / "feeds" / ".cache" / "hn.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    log(f"日期: {date}  |  项目: {root}")
    log(f"数据库: {db_path}")

    # 1. 初始化
    conn = init_db(db_path)

    # 2. 获取 & 筛选
    ids = fetch_story_ids()
    details = fetch_all_details(ids)
    ranked = filter_and_rank(details, top_n=args.top_n)

    # 3. 入库
    upsert_stories(conn, ranked, date)
    insert_daily_picks(conn, ranked, date)

    # 4. 抓取内容
    if not args.skip_articles:
        fetch_articles(conn, date)
    if not args.skip_comments:
        fetch_comments(conn, date, max_per_story=args.max_comments)

    print_status(conn, date)
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""fetch.py — X (Twitter) 数据抓取 & SQLite 入库（通过 Nitter RSS，无需 API token）。

用法:
    python /path/to/x-daily/scripts/fetch.py                    # 从项目根目录运行
    python /path/to/x-daily/scripts/fetch.py --date 2026-04-27  # 指定日期
    python /path/to/x-daily/scripts/fetch.py --project /path/to/proj  # 指定项目根
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import os
import re
import sqlite3
import sys
import time as time_mod
import urllib.error
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from textwrap import dedent
from xml.etree import ElementTree as ET

USER_AGENT = "x-daily-fetch/1.0"
REQUEST_TIMEOUT = 15


def skill_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def nearest_git_root(start: Path) -> Path | None:
    start = start.resolve()
    for p in [start] + list(start.parents):
        if (p / ".git").is_dir():
            return p
    return None


def resolve_root() -> Path:
    return (
        nearest_git_root(Path.cwd())
        or nearest_git_root(Path(__file__).resolve().parent)
        or Path.cwd().resolve()
    )


def log(msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[x-fetch] {ts}  {msg}", flush=True)


def http_get(url: str) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            data = resp.read()
            for encoding in ("utf-8", "latin-1"):
                try:
                    return data.decode(encoding)
                except UnicodeDecodeError:
                    continue
            return data.decode("utf-8", errors="replace")
    except Exception:
        return None


def strip_html(text: str) -> str:
    t = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    t = re.sub(r"<a\s+[^>]*href=[\"']([^\"']*)[\"'][^>]*>(.*?)</a>", r"\2 (\1)", t, flags=re.I | re.S)
    t = re.sub(r"<[^>]+>", "", t)
    t = html_mod.unescape(t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = re.sub(r" {2,}", " ", t)
    return t.strip()


def extract_tweet_id(text: str) -> str | None:
    m = re.search(r"/status/(\d+)", text)
    return m.group(1) if m else None


def parse_rfc822(date_str: str) -> str | None:
    try:
        dt = parsedate_to_datetime(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return None


def parse_display_name(title: str, handle: str) -> str:
    title = html_mod.unescape(title).strip()
    patterns = [
        re.escape(handle) + r"\s*/\s*@?" + re.escape(handle),
        r"^@?" + re.escape(handle),
        re.escape(handle) + r"\s*/\s*@?" + re.escape(handle) + r"\s*[|/]?\s*(.*)",
    ]
    for pat in patterns:
        m = re.match(pat, title, re.I)
        if m and m.lastindex and m.lastindex >= 1:
            return m.group(1).strip()
    clean = re.sub(r"\s*/\s*@?" + re.escape(handle), "", title, flags=re.I).strip()
    return clean if clean else handle


def parse_name_from_title(title: str, handle: str) -> str:
    title = html_mod.unescape(title).strip()
    title = re.sub(r"\s*/\s*@?" + re.escape(handle), "", title, flags=re.I)
    title = re.sub(r"Twitter feed.*$", "", title, flags=re.I)
    title = re.sub(r"\s+on\s+X\s*$", "", title, flags=re.I)
    return title.strip() or handle


def load_config() -> dict:
    config_path = skill_dir() / "config" / "users.json"
    if config_path.exists():
        with open(config_path) as f:
            return json.load(f)

    log(f"ERROR: 配置文件不存在: {config_path}")
    sys.exit(1)


def fetch_rss(instance: str, handle: str) -> str | None:
    url = f"{instance}/{handle}/rss"
    return http_get(url)


def parse_rss(xml_text: str, handle: str) -> list[dict]:
    body = xml_text.lstrip("\ufeff \t\r\n")
    try:
        tree = ET.fromstring(body)
    except ET.ParseError as e:
        fixed = _fix_html_entities(body)
        try:
            tree = ET.fromstring(fixed)
        except ET.ParseError:
            return _fallback_parse_rss(body, handle)

    channel = tree.find("channel")
    resolved_name = None
    if channel is not None:
        title_el = channel.find("title")
        if title_el is not None and title_el.text:
            resolved_name = parse_name_from_title(title_el.text, handle)

    items = tree.findall(".//item")
    tweets = []
    for item in items:
        guid_el = item.find("guid")
        link_el = item.find("link")
        desc_el = item.find("description")
        pubdate_el = item.find("pubDate")

        guid = (guid_el.text or "").strip() if guid_el is not None else ""
        link = (link_el.text or "").strip() if link_el is not None else ""
        desc = (desc_el.text or "").strip() if desc_el is not None else ""
        pubdate = (pubdate_el.text or "").strip() if pubdate_el is not None else ""

        tweet_id = extract_tweet_id(guid) or extract_tweet_id(link)
        if not tweet_id:
            continue

        created = parse_rfc822(pubdate)
        if not created:
            continue

        desc = desc.strip()
        if desc.startswith("RT by @"):
            desc = _clean_rt_content(desc)

        tweets.append({
            "id": tweet_id,
            "text": desc,
            "created_at": created,
            "url": link or f"https://twitter.com/{handle}/status/{tweet_id}",
            "likes": 0,
            "retweets": 0,
            "replies": 0,
            "is_quote": 0,
            "quoted_tweet_id": None,
        })

    if resolved_name:
        for t in tweets:
            t["_display_name"] = resolved_name

    return tweets


def _fix_html_entities(xml_str: str) -> str:
    known = {
        "&rsquo;": "'",
        "&lsquo;": "'",
        "&rdquo;": '"',
        "&ldquo;": '"',
        "&ndash;": "--",
        "&mdash;": "---",
        "&hellip;": "...",
    }
    for ent, repl in known.items():
        xml_str = xml_str.replace(ent, repl)
    return xml_str


def _clean_rt_content(text: str) -> str:
    m = re.search(r"RT by @\w+:\s*(.*)", text, re.S)
    if m:
        return m.group(1).strip()
    return text


def _fallback_parse_rss(xml_text: str, handle: str) -> list[dict]:
    tweets = []
    block_pattern = re.compile(r"<item>(.*?)</item>", re.S)
    for block in block_pattern.findall(xml_text):
        guid_m = re.search(r"<guid[^>]*>(.*?)</guid>", block, re.S)
        link_m = re.search(r"<link>(.*?)</link>", block, re.S)
        desc_m = re.search(r"<description>(.*?)</description>", block, re.S)
        date_m = re.search(r"<pubDate>(.*?)</pubDate>", block, re.S)

        guid = guid_m.group(1).strip() if guid_m else ""
        link = link_m.group(1).strip() if link_m else ""
        desc = desc_m.group(1).strip() if desc_m else ""
        pubdate = date_m.group(1).strip() if date_m else ""

        tweet_id = extract_tweet_id(guid) or extract_tweet_id(link)
        if not tweet_id:
            continue

        created = parse_rfc822(pubdate)
        if not created:
            continue

        if desc.startswith("RT by @"):
            desc = _clean_rt_content(desc)

        tweets.append({
            "id": tweet_id,
            "text": desc,
            "created_at": created,
            "url": link or f"https://twitter.com/{handle}/status/{tweet_id}",
            "likes": 0,
            "retweets": 0,
            "replies": 0,
            "is_quote": 0,
            "quoted_tweet_id": None,
        })
    return tweets


def init_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript(dedent("""
        CREATE TABLE IF NOT EXISTS users (
            id       TEXT PRIMARY KEY,
            handle   TEXT NOT NULL,
            name     TEXT DEFAULT '',
            bio      TEXT DEFAULT '',
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS tweets (
            id              TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL REFERENCES users(id),
            text            TEXT NOT NULL,
            created_at      TEXT NOT NULL,
            url             TEXT DEFAULT '',
            likes           INTEGER DEFAULT 0,
            retweets        INTEGER DEFAULT 0,
            replies         INTEGER DEFAULT 0,
            is_quote        INTEGER DEFAULT 0,
            quoted_tweet_id TEXT DEFAULT NULL,
            fetched_at      TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS daily_picks (
            tweet_id TEXT NOT NULL REFERENCES tweets(id),
            date     TEXT NOT NULL,
            rank     INTEGER DEFAULT 0,
            PRIMARY KEY (tweet_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_tweets_user ON tweets(user_id);
        CREATE INDEX IF NOT EXISTS idx_tweets_date ON tweets(created_at);
        CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON daily_picks(date);
    """))
    conn.commit()
    return conn


def upsert_user(conn: sqlite3.Connection, handle: str, name: str) -> None:
    user_id = handle.lower()
    existing = conn.execute(
        "SELECT name FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    if existing:
        new_name = name if name and name != handle else existing[0]
        conn.execute(
            "UPDATE users SET handle=?, name=?, updated_at=datetime('now') WHERE id=?",
            (handle, new_name, user_id),
        )
    else:
        conn.execute(
            "INSERT INTO users (id, handle, name) VALUES (?, ?, ?)",
            (user_id, handle, name if name else handle),
        )
    conn.commit()


def insert_tweets(conn: sqlite3.Connection, handle: str, tweets: list[dict]) -> int:
    user_id = handle.lower()
    inserted = 0
    for t in tweets:
        try:
            cur = conn.execute(
                """INSERT OR IGNORE INTO tweets
                   (id, user_id, text, created_at, url, likes, retweets, replies, is_quote, quoted_tweet_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    t["id"], user_id, t["text"], t["created_at"],
                    t["url"], t["likes"], t["retweets"], t["replies"],
                    t.get("is_quote", 0), t.get("quoted_tweet_id"),
                ),
            )
            if cur.rowcount:
                inserted += 1
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    return inserted


def insert_daily_picks(conn: sqlite3.Connection, date: str, handles: list[str]) -> int:
    conn.execute("DELETE FROM daily_picks WHERE date = ?", (date,))
    conn.commit()

    rank = 0
    for handle in handles:
        user_id = handle.lower()
        tweets = conn.execute(
            "SELECT id FROM tweets WHERE user_id = ? AND date(created_at) = ? ORDER BY created_at",
            (user_id, date),
        ).fetchall()
        for (tid,) in tweets:
            rank += 1
            conn.execute(
                "INSERT OR REPLACE INTO daily_picks (tweet_id, date, rank) VALUES (?, ?, ?)",
                (tid, date, rank),
            )
    conn.commit()
    return rank


def print_status(conn: sqlite3.Connection, date: str) -> None:
    picks = conn.execute(
        "SELECT COUNT(*) FROM daily_picks WHERE date = ?", (date,)
    ).fetchone()[0]
    users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    tweets = conn.execute("SELECT COUNT(*) FROM tweets").fetchone()[0]
    log(f"阶段 1 完成  |  daily_picks: {picks}  |  users: {users}  |  tweets: {tweets}")
    if picks == 0:
        log(f"  ⚠ 今日 ({date}) 无推文入库，请检查网络或 Nitter 实例可用性")


def main() -> int:
    parser = argparse.ArgumentParser(description="X (Twitter) 数据抓取 & SQLite 入库（Nitter RSS）")
    parser.add_argument("--date", help="日期 YYYY-MM-DD（默认今天 UTC）")
    parser.add_argument("--project", "-p", help="项目根目录（默认自动探测）")
    parser.add_argument("--db", help="SQLite 路径（默认 feeds/.cache/x.db）")
    args = parser.parse_args()

    date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    root = Path(args.project).resolve() if args.project else resolve_root()
    db_path = args.db or str(root / "feeds" / ".cache" / "x.db")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    log(f"日期: {date}  |  项目: {root}")
    log(f"数据库: {db_path}")

    config = load_config()
    users = config.get("users", [])
    instances = config.get("nitter_instances", [])

    if not users:
        log("ERROR: config/users.json 中未配置任何用户")
        return 1
    if not instances:
        instances = ["https://nitter.net"]

    log(f"用户数: {len(users)}  |  Nitter 实例: {len(instances)}")

    conn = init_db(db_path)
    handles_written = []

    for entry in users:
        handle = entry["handle"]
        preset_name = entry.get("name", "")

        log(f"获取 @{handle} ...")

        xml_body = None
        used_instance = None
        for instance in instances:
            body = fetch_rss(instance, handle)
            if body and "<rss" in body and "</rss>" in body:
                xml_body = body
                used_instance = instance
                break
            elif body:
                xml_body = None

        if not xml_body:
            log(f"  ⚠ @{handle}: 所有实例均失败")
            continue

        log(f"  使用实例: {used_instance}")

        tweets = parse_rss(xml_body, handle)

        display_name = preset_name
        if not display_name and tweets:
            display_name = tweets[0].get("_display_name", handle)

        date_tweets = [t for t in tweets if t["created_at"].startswith(date)]
        all_count = len(tweets)
        today_count = len(date_tweets)
        log(f"  RSS 共 {all_count} 条, 今日 {today_count} 条")

        if not tweets:
            log(f"  ⚠ @{handle}: RSS 解析无结果")
            continue

        upsert_user(conn, handle, display_name)
        handles_written.append(handle)

        new_count = insert_tweets(conn, handle, tweets)
        log(f"  入库 {new_count} 条新推文")

        time_mod.sleep(0.3)

    if handles_written:
        pick_count = insert_daily_picks(conn, date, handles_written)
        log(f"daily_picks: {pick_count} 条")
    else:
        log("ERROR: 没有成功获取任何用户数据")
        conn.close()
        return 1

    print_status(conn, date)
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

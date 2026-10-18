# Feedgarden

[English](README.md) | 简体中文

Feedgarden 将开发者和 AI 信息源采集到本地 SQLite，并发布按时间排列的双语信息流。每个条目都有独立的 Markdown 页面、来源标签、1 至 3 个主题标签，以及可点击的原文链接。英文站点位于 `/feedgarden/`，简体中文站点位于 `/feedgarden/zh-CN/`。

文章列表支持按日独立折叠，标题显示本地化日期、星期及当前页条数。默认只展开最新一天，筛选和翻页保留手动开合状态，刷新后重置。详见[站点功能](docs/site.md)。

## 快速开始

运行器使用 Node 24 至 26（`npm ci`），锁定版本的 Jekyll Obsidian 主题使用 Node 26 和 Ruby 4.0.6。X 环境配置（`npm run setup:twitter`）还需要 `uv`。请另行安装 OpenCode 2，并在本机配置 provider 和凭据。Feedgarden 默认运行 `opencode acp`；未设置 `agent.model` / `agent.effort` 时继承 OpenCode 的模型与推理 variant，以 OpenCode 2.0.31 为验收基线。DSH 保留为可选后端，详见 [agent 配置](docs/configuration.md#agent-execution)。密钥不进入 Git 或生成的内容。Windows 上可直接解析 npm/pnpm 启动器中的明确入口，无需 shell。缓存身份包含 agent 版本；单个来源配置失败会单独报告，其他正常来源继续处理。

在 Windows 上，请全局安装共用工具链。两个项目均使用 Node 26，并安装 RubyInstaller **Ruby+Devkit 4.0.6**、Bundler 4.0.16、Git 和 uv。安装后打开新的 PowerShell，使更新后的 PATH 生效。RubyInstaller 的 MSYS2 工具链用于构建原生 gem。`node_modules` 和经过修补的 X CLI 环境保留在项目本地，因为其版本及身份验证行为由本项目管理。

Agent 子进程使用环境变量白名单。如果 OpenCode provider 从环境变量读取凭据，请在 `agent.inheritEnvironment` 中列出变量名，例如 `["DEEPSEEK_API_KEY"]`；OpenCode 配置目录中保存的认证仍然可用。

```powershell
winget install --id RubyInstallerTeam.RubyWithDevKit.4.0 --exact --version 4.0.6-1
gem install bundler -v 4.0.16 --no-document
npm ci
npm run setup:twitter
npm run feedgarden -- doctor
npm run site:build
npm run site:serve
```

预览地址为 `http://127.0.0.1:58002/feedgarden/`（中文版：`/feedgarden/zh-CN/`）。`doctor` 不调用模型，也不采集实时数据。摘要生成使用所选后端的本地 provider 凭据；经过身份验证的 X 采集还需要在运行器环境中设置 `TWITTER_AUTH_TOKEN` 和 `TWITTER_CT0`。新建的空数据库不包含已提交到仓库的文章历史，请勿仅为预览现有内容而运行 `render`。

## 运行流程

请从仓库根目录执行命令。已有 schema 2 数据库请在首次运行前阅读[迁移与回滚](docs/migration.md)。

```sh
npm run feedgarden -- migrate
npm run feedgarden -- collect --source openai
npm run feedgarden -- summarize --source openai
npm run feedgarden -- render
npm run site:build
npm run feedgarden -- run --due --no-publish
```

## 文档

详细文档仅提供英文版。

| 文档 | 内容 |
| --- | --- |
| [架构](docs/architecture.md) | 处理流程、模块边界、持久化状态与恢复 |
| [配置](docs/configuration.md) | 配置发现与采集渠道 |
| [来源](docs/sources.md) | Product Hunt、Hacker News 与 X 采集 |
| [播客](docs/podcasts.md) | 单集发现、转录与恢复 |
| [摘要与内容](docs/summaries.md) | 队列、预算、缓存标识与条目路径 |
| [每日排名](docs/ranking.md) | 每日筛选、历史重排与私有候选 |
| [归档维护](docs/archives.md) | 私有快照、显式更新与恢复 |
| [主题词表](docs/topics.md) | 双语标签、弃用与词表更新 |
| [站点功能](docs/site.md) | 文章、媒体、筛选、阅读、导出与收藏 |
| [相关进展](docs/related-items.md) | 证据要求、到期规则与关联命令 |
| [运行维护](docs/operations.md) | 调度、持久化、备份、限制与诊断 |
| [部署与发布](docs/deployment.md) | 构建环境、发布边界与冲突处理 |
| [迁移与回滚](docs/migration.md) | 数据库升级、迁移归档与回滚 |
| [开发与验证](docs/development.md) | 主题归属、检查与隔离测试夹具 |

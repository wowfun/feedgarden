# Feedgarden

[English](README.md) | 简体中文

Feedgarden 为 agent 提供本地信息流：订阅采集、渠道实时查询、中英文检索、双语摘要加工，以及向明确的 Git 目标发布。主入口是 `fdg` CLI；Jekyll Obsidian 是可选 UI，核心功能不需要 Ruby。

## 使用本地安装包

运行基线为 **Node 24.x 的 24.12 及以上版本，或 26.x**。本次交付本地 tarball，不向 npm 发布。可执行名是 `fdg`，但 npm 上的同名包属于其他项目，调用时必须明确指定本地包：

```sh
npm ci
npm run build
npm pack
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg setup
npx --yes --strict-allow-scripts --package /absolute/feedgarden-0.1.0.tgz -- fdg doctor
```

显式安装该 tarball 后，可使用下面的 `fdg` 命令。`help --json` 提供机器可读的命令契约。给 agent 安装操作 Skill 时，执行 `skill install /absolute/skills/feedgarden`；安装回执包含已校验的绝对入口和实例路径。

```sh
fdg channels
fdg channel github search --query 'language:typescript' --limit 10
fdg read https://example.org/article
fdg items search 模型
fdg sync --detach
fdg status RUN_ID --wait-seconds 10
```

默认操作用户级实例：Linux/macOS 使用 XDG，Windows 使用原生 AppData 目录。当前目录不会自动选择实例；工作区必须显式传入 `--workspace /absolute/project` 或 `--config /absolute/config.jsonc`。`setup` 生成稳定 UUID、七个日历日的采集起点及四个默认订阅，不配置发布目标。实时查询和网页读取仅在传入 `--save` 时保存。

默认加工上海时区的昨天，以及最近七天首次观察到的无日期条目。空结果不会扩大窗口；显式保存的历史条目保留实际日期。每个 backend/account/model 独立记账，默认每模型每天 80 次，UTC 零点重置。只有 `--fallback` 显式启用候补；模型路由变化不会使已接受内容自动重做。OpenCode 需要另行配置；DSH 通过 `backend setup dsh` 显式安装固定版本。

## 现有工作区与发布

仓库中的 `feedgarden.jsonc` 保留为现有站点的 **v2 升级输入**，不是新实例默认配置。请保留配套的私有数据库与内容，先在副本上验证升级；普通读取、同步和诊断不会迁移生产实例。

```sh
fdg instance upgrade --workspace /absolute/workspace --dry-run
fdg instance upgrade --workspace /absolute/workspace
fdg targets inspect site --workspace /absolute/workspace
fdg targets adopt site --expected-head FULL_SHA --workspace /absolute/workspace
fdg sync --publish --detach --workspace /absolute/workspace
```

发布使用独立 checkout 和目标 owner manifest。非空且未受管的目标需要显式接管；外来 owner 还需 `--takeover`。本地缺少文件不代表删除。发布完成指 Git 推送已确认，部署状态另行验证。通用 Markdown/JSON 目标只需 Git；Jekyll 构建使用包内固定依赖及隔离目录。

## 文档

- [配置与目录](docs/configuration.md)、[CLI 操作](docs/operations.md)、[架构](docs/architecture.md)
- [每日任务](docs/daily-updates.zh-CN.md)、[发布](docs/deployment.md)、[开发与安装包验收](docs/development.md)
- [来源](docs/sources.md)、[摘要](docs/summaries.md)、[播客](docs/podcasts.md)、[排名](docs/ranking.zh-CN.md)、[归档](docs/archives.md)、[主题](docs/topics.zh-CN.md)
- [Clippings](docs/clippings.zh-CN.md)、[关联内容](docs/related-items.md)、[站点功能](docs/site.md)

现有站点：[英文](https://sinputer.top/feedgarden/)／[中文](https://sinputer.top/feedgarden/zh-CN/)。开发时可用 `npm run dev:site:build` 构建已提交内容；该命令不初始化实例或加工文章。

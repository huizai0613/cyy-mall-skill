---
name: cyy-mall
description: "当 Agent 需要通过 cyymall-cli（`cyy`）或其 MCP 工具安装、验证或操作 CyyMall / dhcmall 购物工具链时使用：登录、店铺/站点上下文、商品搜索、购物车、订单、支付链接、低层 api_call、MCP 配置，或项目能力维护。"
---

# CyyMall Agent 技能

本技能说明 Agent 如何使用 CyyMall 工具链。真正的实现是 npm 包 `cyymall-cli`；本技能只提供安装检查、使用规则和维护指引。

## 第一步：确保 CLI 可用

当可以访问 shell 时，在使用前先验证 `cyy`。运行本技能 `scripts/` 目录中的内置脚本。

在本仓库中：

```powershell
.\skills\cyy-mall\scripts\ensure-cyy.ps1
```

在 bash 类 shell 中：

```bash
bash skills/cyy-mall/scripts/ensure-cyy.sh
```

当技能安装到 Agent 的技能目录后，请相对于已安装的 `cyy-mall` 技能文件夹解析同名脚本。

该脚本会检查 Node.js、npm；如果缺少 `cyy`，会全局安装 `cyymall-cli`；最后打印 `cyy --version`。脚本不得要求或存储 token。

如果宿主环境已经暴露 MCP 工具，请直接使用 MCP 工具；除非用户要求本地设置，否则不要运行 shell 命令。

## 调用入口

每个环境只使用一种入口：

| 环境 | 使用方式 |
|---|---|
| 可用 shell | `cyy ...` |
| 已连接 MCP | 来自 `cyy-mall-mcp` / `cyy mcp serve` 的 MCP 工具 |
| 项目维护 | `DEVELOPMENT_HANDBOOK.md` 加源文件 |

不要创建临时脚本来绕过已有的 CLI 或 MCP 能力。对于规范已覆盖但还没有糖衣命令的接口，使用 `cyy api call` / MCP `api_call`。

## 凭证与安全

- 永远不要索要登录密码。
- 永远不要在聊天中复述长期 token。
- 不要把 token、短信验证码、npm token 或 API key 写入仓库文件。
- 登录可以使用短信方式（`auth send-code` 后接 `auth login`），也可以导入外部会话（`auth import` / `CYY_TOKEN`）。
- 在执行高风险写操作前必须向用户确认：修改购物车、确认订单、快捷结算、取消订单。
- 对 MCP 写工具，要求 `CYY_MCP_ALLOW_WRITE=true` 或 `1`；只读工具和 `order_pay_url` 不需要开启它。

## CLI 流程

常见顺序：

```bash
cyy auth whoami
cyy config show
cyy auth send-code --phone <phone>
cyy auth login --phone <phone> --code <sms-code>
cyy shop list
cyy shop use --shop-id <id>
cyy shop sites --shop-id <id>
cyy shop use-site --site-id <id>
cyy product search --keyword <keyword>
```

分类浏览：

```bash
cyy product category-list
cyy product zone-tags --group-id <second-level-children-id>
cyy product category-skus --group-id <same> --zone-key <key>
cyy product skus-by-category --group-id <same>
```

订单相关命令：

```bash
cyy cart add --body-file cart.json
cyy order pre-settle --body-file pre.json
cyy order confirm --body-file confirm.json
cyy order checkout --keyword <keyword> --pre-settle-only
cyy order list
cyy order cancel --order-id <id>
cyy order pay-url --order-id <id>
```

复杂 JSON 请使用 `--body-file`。除非用户明确要求查看原始输出，否则应为用户总结 JSON 输出。

## MCP 流程

诸如 `cyy-mall-bailian` 这样的宿主标签只是编排器配置中选择的本地 MCP 服务器名称。它们不是 npm 包名，也不是 `cyy` CLI 命令。

MCP 宿主可以通过以下方式启动：

```json
{
  "mcpServers": {
    "cyy-mall": {
      "command": "npx",
      "args": ["-y", "cyy-mall-mcp"],
      "env": {
        "CYY_MCP_ALLOW_WRITE": "false"
      }
    }
  }
}
```

也可以直接使用 CLI MCP：

```json
{
  "mcpServers": {
    "cyy-mall": {
      "command": "npx",
      "args": ["-y", "cyymall-cli", "mcp", "serve"],
      "env": {
        "CYY_MCP_ALLOW_WRITE": "false"
      }
    }
  }
}
```

推荐的 MCP 顺序：

1. `auth_whoami` 或 `config_show`
2. `auth_import`，或先 `auth_send_code_v1` 再 `auth_login`
3. `shop_list` -> `shop_use` -> `shop_sites` -> `shop_use_site`
4. `product_search`，或分类工具
5. `order_list` 用于只读订单查询
6. 只有在用户确认且写入开关已开启后，才使用写工具

尽量优先使用结构化工具：

- 用 `cart_add_items` 替代原始的 `cart_add`
- 用 `order_confirm_pre_settle` 替代原始的 `order_confirm`

完整 MCP 输入/输出细节位于 `MCP_TOOLS_IO.md`。

## 会话配置

使用 `CYY_PROFILE=<name>` 隔离多个用户、Agent、店铺或环境。默认会话路径是 `~/.cyymall/config.json`；命名 profile 使用 `~/.cyymall/profiles/<name>.json`。

## 维护

项目变更时，以 `DEVELOPMENT_HANDBOOK.md` 作为工作流来源。

当能力发生变化时，保持以下链路一致：

- `app-api-cli-spec.md`
- `cyymall-cli/src/commands/*`
- `cyymall-cli/src/cli.js`
- `cyymall-cli/src/mcpToolManifest.js`
- `cyymall-cli/src/mcpServer.js`
- `MCP_TOOLS_IO.md`
- `MCP_AGENT_PROMPT.md`
- `CAPABILITY_MATRIX.md`
- README 文件

在声称完成前运行相关验证。

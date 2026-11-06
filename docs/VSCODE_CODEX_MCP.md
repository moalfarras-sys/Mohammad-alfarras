# VS Code, Codex and MCP on the Moalfarras workstation

Verified on 2026-11-06. The working project editor is the applications-menu entry
**تطوير Moalfarras / Moalfarras Development**, or `moalfarras-code` from a terminal.
It opens the existing repository with the independently configured VS Code data
directory at `~/.config/Code-Moalfarras`.

The original VS Code profile still has a Codex webview startup timeout. Its
windows were left open at the owner's request. Cache reset and editor restart
were **not** performed in this pass. A backup alone does not establish that all
in-memory editor changes are saved.

## Daily development

From the repository root in a new VS Code terminal:

```sh
npm run doctor
npm run dev
```

The combined development command starts the public site at
`http://127.0.0.1:3000/en` and admin at `http://127.0.0.1:3100`.
These are development servers, not always-on services. If no server is running,
start `npm run dev` before opening the local URLs. Ctrl+C stops the session.

## MCP configuration layers

Codex and VS Code's built-in MCP client read different configuration files.
Installing a server in VS Code's MCP settings does not by itself connect it to
the Codex extension.

| Client | Local configuration |
| --- | --- |
| Codex CLI and IDE | Project `.codex/config.toml`, layered over `~/.codex/config.toml` |
| VS Code MCP | User `mcp.json` and project `.vscode/mcp.json` |
| Project editor user settings | `~/.config/Code-Moalfarras/User/` |

The project is already trusted in Codex. The project Codex configuration now
adds OpenAI Developer Docs, Context7 and Playwright. Existing global Node REPL
and REA configuration was preserved. The workstation-specific project TOML is
excluded through local `.git/info/exclude`; no credentials were added to it.

VS Code's original and project-specific user MCP settings now point Playwright
at the installed Chromium 1254 executable instead of the older 1247 path.
The project VS Code MCP file also exposes OpenAI Docs and Context7.

Local server packages live outside this repository in
`~/.local/share/moos-dev-platform/mcp`:

- `@playwright/mcp`: updated from 0.0.83 to 0.0.84.
- `@modelcontextprotocol/server-sequential-thinking`: updated from 1.0.0 to 2.1.1.

Browser sessions are headless, isolated and sandboxed. These changes do not
enable automatic approvals, grant browser access to arbitrary local files, or
change the project's application dependencies.

Already running Codex sessions may keep their original tool catalog. New
sessions load the project MCP configuration. No running user task was stopped
to refresh it.

## Verification evidence

| Check | Observed result |
| --- | --- |
| Codex bundled CLI | 0.164.0-alpha.11.1; logged in using ChatGPT |
| Actual model round trip | Bundled CLI `exec --ephemeral --sandbox read-only` returned `MOALFARRAS_CODEX_OK`; no tools or file edits requested |
| Project IDE | Codex UI loaded, recognized the account and was observed executing an existing real task |
| OpenAI Docs MCP | Initialized, listed tools and successfully called `search_openai_docs` |
| Context7 MCP | Initialized, listed tools and successfully called `resolve-library-id` for Next.js |
| Playwright MCP | Initialized, listed 25 tools, navigated to `about:blank` and evaluated a connectivity marker |
| Sequential Thinking MCP | Initialized and successfully called its tool with a synthetic connectivity input |
| Codex MCP list | The configured project servers are enabled and discoverable |
| MCP package audit | Zero reported vulnerabilities after the update |
| Project toolchain | `npm run doctor` passed from a fresh login shell |
| VS Code extension update check | No newer compatible extensions were offered |
| Mo Store update check | Zero registered app updates pending |

This separates backend/model connectivity from frontend startup. It does not
claim the original editor profile's startup defect is resolved. Full app build
and player suites from the earlier workstation audit were not repeated: this
pass changes editor/MCP settings and documentation, not application code.

Private diagnostic logs and configuration backups are under
`~/.local/state/moalfarras-dev-setup/codex-repair-20261106-150820` and
`/tmp/moalfarras-final-repair`. These are local artifacts, not repository inputs.

## Primary documentation

- [Codex IDE settings](https://learn.chatgpt.com/docs/ide/settings)
- [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp)
- [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Sequential Thinking server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- [Context7](https://github.com/upstash/context7)

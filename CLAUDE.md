# CLAUDE.md

See [AGENTS.md](./AGENTS.md) for the full agent index. This file adds
Claude-specific guidance on top of it.

---

## CRITICAL: This project uses Remix 3 (alpha) — NOT Remix v2

`remix@next` (`remix@3.0.0-alpha.x`) is a **complete rewrite** — nothing from
Remix v2 applies here. Do **not** write Remix v2 code. When in doubt, read the
local docs first.

**Local Remix docs index**: [docs/agents/remix/index.md](./docs/agents/remix/index.md)
**Upstream source**: https://github.com/remix-run/remix

### Key v3 vs v2 differences

| Topic | Remix v2 | Remix v3 |
|---|---|---|
| UI model | React hooks / functional components | `remix/component` — two-phase setup/render |
| Routing | File-based (`routes/`) | `app/routes.ts` + `app/router.ts` via `remix/fetch-router` |
| State | `useState`, `useEffect` | plain JS vars in setup scope + `handle.update()` |
| Styling | className / CSS modules | `css(...)` prop with nesting/pseudo-selectors |
| Events | `onClick={...}` | `on={{ click() { ... } }}` or `mix={[on(...)]}` |
| Data loading | `loader` / `action` exports | `BuildAction` or `Controller` in `app/controllers/` |
| Schema validation | Zod | `remix/data-schema` |
| SQL | Prisma / raw queries | `remix/data-table` + `remix/data-schema` |
| Sessions | `createCookieSessionStorage` | `remix/session` + `remix/session-middleware` |

### Component model quick reference

```tsx
// Two-phase: setup runs once, returned function runs on every update
function MyComponent(handle: Handle, setup: SetupType) {
  // setup phase — plain JS vars, runs once
  let count = setup ?? 0

  return (props: { label: string }) => (
    // render phase — runs on every update
    <div>
      <span>{props.label}: {count}</span>
      <button on={{ click() { count++; handle.update() } }}>+</button>
    </div>
  )
}
```

- `handle.update()` — schedules a re-render
- `handle.queueTask(fn)` — post-render DOM work
- `handle.signal` — AbortSignal, aborted on component removal
- `handle.on(target, event, handler)` — auto-cleaned event listener
- `mix={[css(...), on(...), ref(...)]}` — host-element mixins (prefer over className/props)

### Routing quick reference

Routes are declared in `app/routes.ts` (or `server/routes.ts` in this project),
wired in `server/router.ts` using `remix/fetch-router`. Route handlers are
`BuildAction` functions or `Controller` classes in `server/handlers/`.

---

## Project architecture

**Runtime**: Cloudflare Workers (edge). Dev server: `localhost:8787`.
**Package manager**: Bun (`bun install`, `bun run ...` — never npm).

### Request routing order (worker/index.ts)

1. OAuth endpoints (`/oauth/authorize`, `/oauth/callback`, etc.)
2. Browser noise (`/.well-known/...` → 204)
3. OAuth protected resource metadata
4. MCP endpoint (`/mcp`) — requires OAuth bearer token
5. Chat agent (`/chat-agent/:threadId`) — requires app session cookie
6. Static assets (`ASSETS` binding)
7. App server (`server/handler.ts` → `server/router.ts`)

### Storage

| Binding | Purpose |
|---|---|
| `APP_DB` (D1) | `users`, `password_resets`, `chat_threads` |
| `OAUTH_KV` | OAuth provider state (token/client flows) |
| `MCP_OBJECT` (Durable Object) | MCP server runtime state |
| `ChatAgent` (Durable Object) | Per-thread chat transcripts + runtime state |

D1 access goes through `remix/data-table` via a custom adapter at
`worker/d1-data-table-adapter.ts`. Never use raw D1 queries — use `worker/db.ts`
table definitions and the data-table API.

### Authentication

- **Browser**: Cookie `metabolic-health-agent_session` (httpOnly, sameSite:Lax,
  signed with `COOKIE_SECRET`). 7-day default, 30-day with remember-me.
- **MCP**: OAuth bearer tokens via `@cloudflare/workers-oauth-provider`.

Key files: `worker/oauth-handlers.ts`, `worker/mcp-auth.ts`,
`server/auth-session.ts`, `server/handlers/auth.ts`.

---

## Code style (from docs/agents/code-style.md)

- Function declarations for named functions; arrow functions for callbacks.
- `Array<T>` / `ReadonlyArray<T>` — not `T[]`.
- Named exports; default exports only when a framework contract requires it.
- Prefer `#...` root imports over `../...` parent-relative paths.
- `type` aliases for shapes/unions; `interface` only for declaration merging.
- `null` for explicit no-value; `undefined` for optional/omitted fields.

---

## Testing (from docs/agents/testing-principles.md)

- Flat test files — top-level `test(...)`, no `describe` nesting.
- Inline setup per test — no `beforeEach`/`afterEach`.
- Server/unit tests: `bun run test:unit`
- E2E (Playwright): `bun run test:e2e`
- MCP E2E: `bun run test:mcp`
- Full validation: `bun run validate`

---

## Dev commands

| Task | Command |
|---|---|
| Dev server | `bun run dev` |
| Full validation | `bun run validate` |
| Lint | `bun run lint` |
| Format | `bun run format` |
| Type check | `bun run typecheck` |
| Build | `bun run build` |
| E2E tests | `bun run test:e2e` |
| Migrations (local) | `bun run migrate:local` |
| Seed test data | `bun tools/seed-test-data.ts --local` |

Default test credentials: `kody@kcd.dev` / `kodylovesyou`

---

## Remix package reference (active in this project)

- **UI**: `remix/component` — [docs](./docs/agents/remix/component/index.md)
- **Routing**: `remix/fetch-router` — [docs](./docs/agents/remix/fetch-router/index.md)
- **Schema validation**: `remix/data-schema` — [docs](./docs/agents/remix/data-schema.md)
- **SQL/D1**: `remix/data-table` (custom D1 adapter) — [docs](./docs/agents/remix/data-table.md)
- **Sessions**: `remix/session` + `remix/session-middleware`
- **Cookies**: `remix/cookie`
- **Responses**: `remix/response`, `remix/html-template`, `remix/headers`
- **File uploads**: `remix/form-data-middleware`, `remix/form-data-parser`

Full package index: [docs/agents/remix/index.md](./docs/agents/remix/index.md)

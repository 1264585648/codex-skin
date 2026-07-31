# Codex Skin

Turn Codex Desktop into a chat-first Agent Messenger without modifying the official Codex package.

Current themes:

- `wechat` — high-fidelity current WeChat Windows-inspired desktop IM layout
- `qq` — high-fidelity current QQ NT-inspired desktop IM layout

The goal is not a green/blue recolor. Projects and threads should feel like chat sessions, Codex/user turns should read like IM bubbles, and tool calls/diffs/approvals should become native-looking chat cards while the real Codex controls remain interactive.

## Architecture

```text
Codex / ChatGPT Desktop renderer
        │
        │ localhost Chrome DevTools Protocol
        ▼
  codex-skin runtime
        │
        ├── semantic DOM adapter
        │     ├── app-shell
        │     ├── sidebar
        │     ├── conversation-list
        │     ├── active-chat
        │     ├── chat-header
        │     ├── user-message
        │     ├── agent-message
        │     ├── tool-card
        │     ├── diff-card
        │     ├── approval-card
        │     ├── composer
        │     ├── composer-toolbar
        │     └── send-button
        │
        └── independent theme layouts
              ├── themes/wechat
              └── themes/qq
```

Themes target stable `data-codex-skin-role` semantics instead of binding directly to generated Codex class names whenever possible.

## Requirements

- Windows 10/11 x64
- Official Codex Desktop Store package
- Node.js 20+
- PowerShell 5.1+

## Run on current Windows builds

Install dependencies:

```powershell
npm install
```

Fully quit Codex/ChatGPT, then launch the Store package executable with loopback-only CDP:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-codex.ps1
```

The launcher currently:

- discovers the registered `OpenAI.Codex` package
- supports both older `Codex.exe` and current OWL/ChatGPT `ChatGPT.exe` layouts
- refuses executables outside the validated package install root
- binds CDP to `127.0.0.1` only
- defaults to port `9335`
- waits for `/json/version` before reporting success

Apply WeChat:

```powershell
npm run dev:wechat
```

Apply QQ:

```powershell
npm run dev:qq
```

For a custom port, launch with `-Port` and point the runtime at the same endpoint:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-codex.ps1 -Port 9444
$env:CODEX_CDP_URL='http://127.0.0.1:9444'
npm run dev:wechat
```

The runtime re-applies the semantic adapter and theme after renderer reloads.

## High-fidelity visual baseline

### WeChat

The current target is the recent Windows 4.1.x design language:

- translucent light sidebar and title surface
- white/light-gray chat surface
- strong green selected conversation row
- square-ish avatars
- right-aligned green user bubbles with restrained radius
- left-aligned white Codex bubbles
- file/service-like tool and diff cards
- floating white composer with action buttons along the bottom edge

### QQ

The current target is QQ NT desktop language:

- cool light sidebar and chat surface
- soft blue selected/hovered conversation rows
- circular avatars
- blue right-aligned user bubbles
- white left-aligned Codex bubbles
- rounded file/service cards
- compact top action area
- wide rounded composer and blue send action

Exact measurements used by the themes live in their CSS and are intentionally independent so QQ does not become “WeChat in blue”.

## Visual preview

Open:

```text
preview/index.html
```

The fixture uses the same semantic roles as the real injector and includes a theme switcher. Use it for fast visual tuning before validating against a live Codex renderer.

## Privacy-safe DOM inspection

Codex Desktop is not open source and renderer markup changes between releases. To tune a version-specific adapter without exporting conversation text, launch Codex through the helper and run:

```powershell
npm run inspect > codex-dom-report.json
```

The inspector reports structural metadata only:

- tag names
- ARIA roles/labels
- `data-testid` / data roles
- class names
- element counts

It intentionally does **not** export message text or project/thread titles from DOM text content.

## Current scope

The implementation keeps Codex's real React UI and event handlers in place. It annotates the existing DOM and restyles it rather than moving native React nodes into a fake second chat application.

Implemented:

- current Windows Store-package executable discovery
- loopback CDP readiness verification
- CDP target discovery for Codex and ChatGPT renderer names
- runtime JavaScript/CSS injection
- reload-resilient reinjection
- MutationObserver semantic re-annotation
- independent high-fidelity WeChat and QQ layouts
- message avatars/tails, chat headers, sidebar states and composer layouts
- styling hooks for code, tools, diffs and approvals
- privacy-safe DOM inspector
- complete semantic cleanup on shutdown

Still version-sensitive:

- exact thread/project row detection
- exact current user/assistant message wrappers
- tool-call and diff wrappers on every Codex release
- split panes and in-app browser surfaces

The next adapter pass should be driven by a structural report from the exact target Windows build rather than increasingly broad generic selectors.

## Theme authoring

Each theme contains:

```text
themes/<theme>/
├── theme.json
└── theme.css
```

Prefer semantic selectors:

```css
[data-codex-skin-role="user-message"] {}
[data-codex-skin-role="agent-message"] {}
[data-codex-skin-role="tool-card"] {}
[data-codex-skin-role="composer"] {}
```

Avoid binding theme CSS directly to minified or generated Codex class names.

## Security note

CDP is powerful and does not provide normal same-user authentication. Keep it on `127.0.0.1`, do not expose it to a LAN, and avoid running untrusted local programs during a themed session.

Do not take ownership of, unpack, patch, or replace files under `WindowsApps` for this project.

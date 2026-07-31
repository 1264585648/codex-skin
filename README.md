# Codex Skin

Turn Codex Desktop into a chat-first Agent Messenger without modifying the Codex package itself.

Current MVP themes:

- `wechat` — restrained WeChat-like desktop IM layout
- `qq` — modern QQ-like blue/glass desktop IM layout

## Architecture

```text
Codex Desktop renderer
        │
        │ Chrome DevTools Protocol
        ▼
  codex-skin runtime
        │
        ├── semantic DOM adapter
        │     ├── sidebar
        │     ├── conversation
        │     ├── user-message
        │     ├── agent-message
        │     ├── tool-card
        │     ├── diff-card
        │     ├── approval-card
        │     └── composer
        │
        └── theme layer
              ├── themes/wechat
              └── themes/qq
```

The theme layer does not need to know Codex's internal class names. The adapter adds stable `data-codex-skin-role` attributes where possible, and themes style those semantic roles.

## Requirements

- Windows 11
- Codex Desktop installed
- Node.js 20+

## Run

Install dependencies:

```powershell
npm install
```

Fully quit Codex, then launch it with a localhost-only CDP port:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-codex.ps1
```

Apply WeChat style:

```powershell
npm run dev -- --theme wechat
```

Apply QQ style:

```powershell
npm run dev -- --theme qq
```

By default the runtime connects to `http://127.0.0.1:9222`. Override it with `CODEX_CDP_URL` when needed.

## MVP scope

This first version deliberately keeps Codex's real React UI and event handlers in place. It injects a semantic adapter and presentation CSS rather than moving native React nodes into a second fake chat application.

That makes the approach safer to iterate on and easier to restore, but Codex DOM changes can still break semantic detection.

### Already implemented

- CDP target discovery and connection
- runtime JavaScript/CSS injection
- MutationObserver-based semantic re-annotation
- WeChat and QQ visual systems
- styling hooks for messages, composer, code, tools, diffs and approval dialogs
- Windows helper launcher
- cleanup on Ctrl+C

### Next milestone

The current DOM adapter uses conservative generic selectors because Codex Desktop's actual renderer DOM still needs to be profiled on the target Windows build. The next step is to capture the live DOM structure and make a versioned adapter so user messages, agent messages, project/thread rows, tool calls and approval cards are detected reliably.

## Theme authoring

Each theme currently contains:

```text
themes/<theme>/
├── theme.json
└── theme.css
```

Prefer semantic selectors such as:

```css
[data-codex-skin-role="user-message"] {}
[data-codex-skin-role="agent-message"] {}
[data-codex-skin-role="tool-card"] {}
[data-codex-skin-role="composer"] {}
```

Avoid binding theme CSS directly to minified or generated Codex class names.

## Security note

The helper binds the remote debugging interface to `127.0.0.1`. CDP is powerful and should not be exposed to the LAN or Internet. Do not change the debugging address to `0.0.0.0`.

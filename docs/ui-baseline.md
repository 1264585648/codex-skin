# UI Fidelity Baseline

This document defines the visual target for the two first-party themes. The goal is recognizable desktop IM structure and interaction language while preserving Codex's native controls and content.

## WeChat Desktop baseline

Reference generation: current Windows 4.1.x visual language, especially the 4.1.8 redesign.

Public references:

- https://www.ithome.com/0/926/302.htm
- https://www.ithome.com/0/929/065.htm

Observed design traits used by this project:

- light/white content surface
- translucent sidebar and top title surface
- green selected conversation row
- search field integrated into the left conversation surface
- square-ish avatars with small corner radius
- white incoming bubbles and green outgoing bubbles
- restrained bubble radius and very small shadows
- composer presented as a white card with action tools along its bottom edge

Current Codex Skin target metrics:

| Element | Target |
| --- | --- |
| Sidebar | 286 px nominal width |
| Chat header | 62 px minimum height |
| Avatar | 38 × 38 px, 4 px radius |
| Message bubble | 5 px radius |
| Bubble content max width | ~68% / 760 px |
| Composer | 108 px minimum height, 7 px radius |
| Primary green bubble | `#95ec69` |
| Strong action green | `#07c160` |

The WeChat theme should feel flat, quiet, dense, and utility-first. Do not add decorative gradients, neon borders, or excessive depth.

## QQ NT Desktop baseline

Reference generation: modern QQ NT Windows visual language.

Public references:

- https://www.ithome.com/0/911/941.htm
- https://im.qq.com/

Observed design traits used by this project:

- cool light background and left chat list
- blue hover/selection accents
- round avatars
- blue outgoing message bubbles
- white incoming bubbles
- rounded service/file cards
- compact top action area for conversation actions
- rounded white composer with a strong blue send action

Current Codex Skin target metrics:

| Element | Target |
| --- | --- |
| Sidebar | 292 px nominal width |
| Chat header | 64 px minimum height |
| Avatar | 40 × 40 px, circular |
| Message bubble | 10 px radius |
| Bubble content max width | ~70% / 780 px |
| Composer | 112 px minimum height, 12 px radius |
| Primary blue | `#0099ff` |
| Deep blue action | `#1685e8` |

QQ should feel softer and more rounded than WeChat, with clearer blue interaction feedback and slightly more depth. It must not be implemented as the WeChat theme with a blue color token swap.

## Shared Codex mapping

| Codex concept | IM presentation |
| --- | --- |
| Project / thread | Conversation row |
| Active thread | Selected chat |
| User turn | Outgoing message |
| Assistant turn | Incoming Codex message |
| Shell/tool execution | Service/task card |
| Diff/file edit | File-change card |
| Approval dialog | Confirmation card |
| Composer | Chat input area |

## Acceptance rules

1. Native Codex controls remain clickable and keyboard-accessible.
2. No theme may move React-owned nodes into a synthetic replacement tree.
3. Theme-specific layout rules remain independent.
4. Generic selectors are fallback-only; target builds should use semantic adapter roles.
5. `preview/index.html` is the fast visual fixture; live Codex is the final acceptance target.
6. After a Codex Store update, run the privacy-safe inspector before widening selectors globally.

import { CdpClient, findPageTarget } from './cdp.js';

const cdpBase = process.env.CODEX_CDP_URL ?? 'http://127.0.0.1:9335';

const inspectorScript = `(() => {
  const clean = (value, limit = 180) => {
    if (typeof value !== 'string') return null;
    const normalized = value.replace(/\\s+/g, ' ').trim();
    return normalized ? normalized.slice(0, limit) : null;
  };

  const describe = (node) => {
    if (!(node instanceof HTMLElement)) return null;
    return {
      tag: node.tagName.toLowerCase(),
      role: clean(node.getAttribute('role')),
      ariaLabel: clean(node.getAttribute('aria-label'), 100),
      testId: clean(node.getAttribute('data-testid'), 120),
      dataRole: clean(node.getAttribute('data-role'), 80),
      authorRole: clean(node.getAttribute('data-message-author-role'), 40),
      state: clean(node.getAttribute('data-state'), 40),
      className: clean(typeof node.className === 'string' ? node.className : '', 220),
      childCount: node.children.length,
    };
  };

  const unique = (nodes, max = 80) => {
    const seen = new Set();
    const output = [];
    for (const node of nodes) {
      const item = describe(node);
      if (!item) continue;
      const key = JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(item);
      if (output.length >= max) break;
    }
    return output;
  };

  const selectors = {
    shell: 'body,main,aside,nav,header',
    interactive: 'textarea,[contenteditable="true"],button,input,[role="button"],[role="listitem"]',
    messages: '[data-message-author-role],[data-role],[data-testid*="message" i],[class*="message" i],[class*="turn" i],article',
    tools: '[class*="tool" i],[class*="diff" i],[data-testid*="tool" i],[data-testid*="diff" i],[role="dialog"]',
  };

  const report = {
    generatedAt: new Date().toISOString(),
    title: document.title,
    location: location.origin + location.pathname,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    counts: Object.fromEntries(
      Object.entries(selectors).map(([key, selector]) => [key, document.querySelectorAll(selector).length])
    ),
    shell: unique(document.querySelectorAll(selectors.shell), 50),
    interactive: unique(document.querySelectorAll(selectors.interactive), 80),
    messages: unique(document.querySelectorAll(selectors.messages), 100),
    tools: unique(document.querySelectorAll(selectors.tools), 80),
  };

  return report;
})()`;

async function main(): Promise<void> {
  const target = await findPageTarget(cdpBase);
  if (!target.webSocketDebuggerUrl) throw new Error('Target has no websocket debugger URL.');

  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  try {
    await client.call('Runtime.enable');
    const response = await client.evaluate(inspectorScript) as {
      result?: { value?: unknown };
    };

    const report = response?.result?.value ?? response;
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[codex-skin:inspect] ${message}`);
  process.exitCode = 1;
});

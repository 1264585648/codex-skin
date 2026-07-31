import { buildAdapterScript, buildStyleScript } from './adapter.js';
import { CdpClient, findPageTarget } from './cdp.js';
import { loadTheme, parseTheme } from './theme.js';

const theme = parseTheme(process.argv.slice(2));
const cdpBase = process.env.CODEX_CDP_URL ?? 'http://127.0.0.1:9222';

async function main(): Promise<void> {
  console.log(`[codex-skin] theme=${theme} cdp=${cdpBase}`);

  const target = await findPageTarget(cdpBase);
  if (!target.webSocketDebuggerUrl) throw new Error('Target has no websocket debugger URL.');

  const css = await loadTheme(theme);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);

  await client.call('Runtime.enable');
  await client.evaluate(buildAdapterScript(theme));
  await client.evaluate(buildStyleScript(theme, css));

  console.log(`[codex-skin] injected ${theme} into: ${target.title || target.url}`);
  console.log('[codex-skin] keep this process running while Codex is open. Press Ctrl+C to stop.');

  process.on('SIGINT', async () => {
    try {
      await client.evaluate(`document.getElementById('codex-skin-style')?.remove(); document.documentElement.removeAttribute('data-codex-skin'); window.__codexSkinObserver?.disconnect?.();`);
    } finally {
      client.close();
      process.exit(0);
    }
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[codex-skin] ${message}`);
  console.error('[codex-skin] Make sure Codex was launched with --remote-debugging-port=9222.');
  process.exitCode = 1;
});

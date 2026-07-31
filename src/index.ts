import { buildAdapterScript, buildStyleScript } from './adapter.js';
import { CdpClient, findPageTarget } from './cdp.js';
import { loadTheme, parseTheme } from './theme.js';

const theme = parseTheme(process.argv.slice(2));
const cdpBase = process.env.CODEX_CDP_URL ?? 'http://127.0.0.1:9335';

const cleanupScript = `(() => {
  document.getElementById('codex-skin-style')?.remove();
  document.documentElement.removeAttribute('data-codex-skin');
  window.__codexSkinObserver?.disconnect?.();
  delete window.__codexSkinObserver;

  document.querySelectorAll('[data-codex-skin-role]').forEach((node) => {
    node.removeAttribute('data-codex-skin-role');
    node.removeAttribute('data-codex-skin-kind');
    node.removeAttribute('data-codex-skin-peer');
    node.removeAttribute('data-codex-skin-title');
  });
})();`;

async function main(): Promise<void> {
  console.log(`[codex-skin] theme=${theme} cdp=${cdpBase}`);

  const target = await findPageTarget(cdpBase);
  if (!target.webSocketDebuggerUrl) throw new Error('Target has no websocket debugger URL.');

  const css = await loadTheme(theme);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);

  await client.call('Runtime.enable');
  await client.call('Page.enable');

  let injectionInFlight = false;
  const inject = async (): Promise<void> => {
    if (injectionInFlight) return;
    injectionInFlight = true;

    try {
      await client.evaluate(buildAdapterScript(theme));
      await client.evaluate(buildStyleScript(theme, css));
    } finally {
      injectionInFlight = false;
    }
  };

  await inject();

  const offLoad = client.on('Page.loadEventFired', async () => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    await inject();
    console.log('[codex-skin] renderer reloaded; theme re-applied.');
  });

  console.log(`[codex-skin] injected ${theme} into: ${target.title || target.url}`);
  console.log('[codex-skin] reload resilience enabled. Press Ctrl+C to restore the current renderer.');

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    offLoad();
    try {
      await client.evaluate(cleanupScript);
    } catch {
      // The renderer may already be gone; closing the local CDP connection is still safe.
    } finally {
      client.close();
    }
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[codex-skin] ${message}`);
  console.error('[codex-skin] Launch Codex through scripts/start-codex.ps1 and confirm the localhost CDP endpoint first.');
  process.exitCode = 1;
});

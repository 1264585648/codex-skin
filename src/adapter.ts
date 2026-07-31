export function buildAdapterScript(themeName: string): string {
  return `(() => {
    const ROOT_ATTR = 'data-codex-skin';
    const ROLE_ATTR = 'data-codex-skin-role';

    document.documentElement.setAttribute(ROOT_ATTR, ${JSON.stringify(themeName)});

    const mark = (element, role) => {
      if (!(element instanceof HTMLElement)) return;
      if (!element.hasAttribute(ROLE_ATTR)) element.setAttribute(ROLE_ATTR, role);
    };

    const text = (element) => (element.textContent || '').trim().toLowerCase();

    const annotate = () => {
      document.querySelectorAll('textarea,[contenteditable="true"]').forEach((node) => {
        mark(node.closest('form') || node.parentElement || node, 'composer');
      });

      document.querySelectorAll('nav,aside').forEach((node) => mark(node, 'sidebar'));
      document.querySelectorAll('main').forEach((node) => mark(node, 'conversation'));

      document.querySelectorAll('button').forEach((button) => {
        const label = ((button.getAttribute('aria-label') || '') + ' ' + text(button)).trim();
        if (/send|submit|发送/.test(label)) mark(button, 'send-button');
      });

      const explicitUsers = document.querySelectorAll('[data-message-author-role="user"],[data-role="user"],[data-testid*="user-message" i]');
      explicitUsers.forEach((node) => mark(node, 'user-message'));

      const explicitAgents = document.querySelectorAll('[data-message-author-role="assistant"],[data-role="assistant"],[data-testid*="assistant-message" i]');
      explicitAgents.forEach((node) => mark(node, 'agent-message'));

      document.querySelectorAll('pre').forEach((node) => mark(node, 'code-block'));

      document.querySelectorAll('[role="dialog"]').forEach((node) => {
        const value = text(node);
        if (/allow|approve|permission|confirm|允许|确认|授权/.test(value)) mark(node, 'approval-card');
      });

      document.querySelectorAll('article,[data-testid],[data-state]').forEach((node) => {
        if (!(node instanceof HTMLElement) || node.hasAttribute(ROLE_ATTR)) return;
        const value = text(node);
        if (/running command|ran command|terminal|shell|powershell|执行命令/.test(value)) mark(node, 'tool-card');
        else if (/diff|modified file|changed file|apply patch|修改文件/.test(value)) mark(node, 'diff-card');
      });
    };

    annotate();
    const observer = new MutationObserver(() => requestAnimationFrame(annotate));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.__codexSkinObserver?.disconnect?.();
    window.__codexSkinObserver = observer;
  })();`;
}

export function buildStyleScript(themeName: string, css: string): string {
  return `(() => {
    const id = 'codex-skin-style';
    document.getElementById(id)?.remove();
    const style = document.createElement('style');
    style.id = id;
    style.dataset.theme = ${JSON.stringify(themeName)};
    style.textContent = ${JSON.stringify(css)};
    document.head.appendChild(style);
  })();`;
}

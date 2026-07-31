export function buildAdapterScript(themeName: string): string {
  return `(() => {
    const ROOT_ATTR = 'data-codex-skin';
    const ROLE_ATTR = 'data-codex-skin-role';
    const KIND_ATTR = 'data-codex-skin-kind';

    document.documentElement.setAttribute(ROOT_ATTR, ${JSON.stringify(themeName)});

    const isElement = (value) => value instanceof HTMLElement;
    const text = (element) => (element?.textContent || '').trim().toLowerCase();
    const label = (element) => [
      element?.getAttribute?.('aria-label') || '',
      element?.getAttribute?.('title') || '',
      text(element),
    ].join(' ').trim().toLowerCase();

    const mark = (element, role, force = false) => {
      if (!isElement(element)) return null;
      if (force || !element.hasAttribute(ROLE_ATTR)) element.setAttribute(ROLE_ATTR, role);
      return element;
    };

    const first = (selectors, root = document) => {
      for (const selector of selectors) {
        const node = root.querySelector(selector);
        if (isElement(node)) return node;
      }
      return null;
    };

    const messageContainer = (node) => {
      if (!isElement(node)) return null;
      return node.closest(
        'article,[data-testid*="message" i],[class*="message" i],[class*="turn" i],[data-message-author-role],[data-role]'
      ) || node;
    };

    const annotateShell = () => {
      mark(document.body, 'app-shell');

      document.querySelectorAll('aside,nav,[class*="sidebar" i],[data-testid*="sidebar" i]').forEach((node) => {
        mark(node, 'sidebar');
      });

      const sidebar = first([
        '[data-codex-skin-role="sidebar"]',
        'aside',
        'nav',
        '[class*="sidebar" i]',
      ]);

      if (sidebar) {
        const list = first([
          '[role="list"]',
          '[data-testid*="thread" i]',
          '[class*="thread" i]',
          '[class*="conversation" i]',
          '[class*="list" i]',
        ], sidebar);
        mark(list, 'conversation-list');

        sidebar.querySelectorAll('a,button,[role="button"],[role="listitem"]').forEach((node) => {
          if (!isElement(node)) return;
          const state = `${node.getAttribute('aria-current') || ''} ${node.getAttribute('data-state') || ''}`.toLowerCase();
          if (/page|true|active|selected/.test(state)) mark(node, 'active-chat');
        });
      }

      document.querySelectorAll('main,[role="main"],[data-testid*="conversation" i],[class*="conversation" i]').forEach((node) => {
        mark(node, 'conversation');
      });

      const conversation = first([
        'main',
        '[role="main"]',
        '[data-codex-skin-role="conversation"]',
      ]);

      if (conversation) {
        const header = first([
          ':scope > header',
          '[data-testid*="header" i]',
          '[class*="header" i]',
        ], conversation);
        mark(header, 'chat-header');
      }
    };

    const annotateComposer = () => {
      document.querySelectorAll('textarea,[contenteditable="true"]').forEach((input) => {
        if (!isElement(input)) return;
        mark(input, 'composer-input');

        const composer = input.closest('form')
          || input.closest('[class*="composer" i]')
          || input.closest('[class*="input" i]')
          || input.parentElement;
        mark(composer, 'composer');

        if (composer) {
          const buttons = Array.from(composer.querySelectorAll('button,[role="button"]'));
          if (buttons.length) {
            const toolbarCandidate = buttons[0]?.parentElement;
            if (toolbarCandidate && toolbarCandidate !== composer) mark(toolbarCandidate, 'composer-toolbar');
          }
        }
      });

      document.querySelectorAll('button').forEach((button) => {
        const value = label(button);
        if (/send|submit|发送|提交/.test(value)) mark(button, 'send-button', true);
        else if (/attach|file|upload|附件|文件|上传/.test(value)) mark(button, 'attach-button');
        else if (/voice|microphone|语音|麦克风/.test(value)) mark(button, 'voice-button');
      });
    };

    const annotateMessages = () => {
      const userSelectors = [
        '[data-message-author-role="user"]',
        '[data-role="user"]',
        '[data-testid*="user-message" i]',
        '[data-testid*="user-turn" i]',
      ];
      const agentSelectors = [
        '[data-message-author-role="assistant"]',
        '[data-role="assistant"]',
        '[data-testid*="assistant-message" i]',
        '[data-testid*="assistant-turn" i]',
        '[data-testid*="agent-message" i]',
      ];

      userSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
          const container = messageContainer(node);
          const marked = mark(container, 'user-message', true);
          marked?.setAttribute(KIND_ATTR, 'user');
        });
      });

      agentSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
          const container = messageContainer(node);
          const marked = mark(container, 'agent-message', true);
          marked?.setAttribute(KIND_ATTR, 'agent');
        });
      });

      document.querySelectorAll('pre').forEach((node) => mark(node, 'code-block'));

      document.querySelectorAll('[role="dialog"]').forEach((node) => {
        const value = text(node);
        if (/allow|approve|permission|confirm|允许|确认|授权/.test(value)) {
          const marked = mark(node, 'approval-card', true);
          marked?.setAttribute(KIND_ATTR, 'approval');
        }
      });

      document.querySelectorAll('article,[data-testid],[data-state],[class*="tool" i],[class*="diff" i]').forEach((node) => {
        if (!isElement(node)) return;
        if (node.matches('[data-codex-skin-role="user-message"],[data-codex-skin-role="agent-message"]')) return;

        const value = text(node);
        if (/running command|ran command|terminal|shell|powershell|执行命令|运行命令/.test(value)) {
          const marked = mark(node, 'tool-card', true);
          marked?.setAttribute(KIND_ATTR, 'command');
        } else if (/diff|modified file|changed file|apply patch|修改文件|变更文件/.test(value)) {
          const marked = mark(node, 'diff-card', true);
          marked?.setAttribute(KIND_ATTR, 'diff');
        }
      });
    };

    const decorate = () => {
      document.querySelectorAll('[data-codex-skin-role="user-message"]').forEach((node) => {
        if (!isElement(node)) return;
        node.dataset.codexSkinPeer = '你';
      });
      document.querySelectorAll('[data-codex-skin-role="agent-message"]').forEach((node) => {
        if (!isElement(node)) return;
        node.dataset.codexSkinPeer = 'Codex';
      });
      document.querySelectorAll('[data-codex-skin-role="tool-card"]').forEach((node) => {
        if (!isElement(node)) return;
        node.dataset.codexSkinTitle = '执行任务';
      });
      document.querySelectorAll('[data-codex-skin-role="diff-card"]').forEach((node) => {
        if (!isElement(node)) return;
        node.dataset.codexSkinTitle = '文件变更';
      });
      document.querySelectorAll('[data-codex-skin-role="approval-card"]').forEach((node) => {
        if (!isElement(node)) return;
        node.dataset.codexSkinTitle = '需要确认';
      });
    };

    let scheduled = false;
    const annotate = () => {
      scheduled = false;
      annotateShell();
      annotateComposer();
      annotateMessages();
      decorate();
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(annotate);
    };

    annotate();
    window.__codexSkinObserver?.disconnect?.();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-current'],
    });
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

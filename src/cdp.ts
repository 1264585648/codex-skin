import WebSocket from 'ws';

export type CdpTarget = {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
};

type CdpEventHandler = (params: unknown) => void | Promise<void>;

export async function findPageTarget(baseUrl: string): Promise<CdpTarget> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/json/list`);
  if (!response.ok) {
    throw new Error(`Cannot read CDP targets: ${response.status} ${response.statusText}`);
  }

  const targets = (await response.json()) as CdpTarget[];
  const pages = targets.filter((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  const preferred = pages.find((item) => /codex|chatgpt/i.test(`${item.title} ${item.url}`));
  const target = preferred ?? pages[0];

  if (!target) {
    throw new Error('No debuggable Codex/ChatGPT page target found.');
  }
  return target;
}

export class CdpClient {
  private socket: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private eventHandlers = new Map<string, Set<CdpEventHandler>>();

  private constructor(socket: WebSocket) {
    this.socket = socket;

    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as {
        id?: number;
        method?: string;
        params?: unknown;
        result?: unknown;
        error?: { message?: string };
      };

      if (message.id) {
        const task = this.pending.get(message.id);
        if (!task) return;

        this.pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message ?? 'Unknown CDP error'));
        else task.resolve(message.result);
        return;
      }

      if (!message.method) return;
      const handlers = this.eventHandlers.get(message.method);
      if (!handlers) return;

      for (const handler of handlers) {
        Promise.resolve(handler(message.params)).catch((error: unknown) => {
          const reason = error instanceof Error ? error.message : String(error);
          console.error(`[codex-skin] CDP event handler failed (${message.method}): ${reason}`);
        });
      }
    });

    socket.on('close', () => {
      const error = new Error('CDP connection closed.');
      for (const task of this.pending.values()) task.reject(error);
      this.pending.clear();
    });
  }

  static connect(url: string): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.once('open', () => resolve(new CdpClient(socket)));
      socket.once('error', reject);
    });
  }

  call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }), (error) => {
        if (!error) return;
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  on(method: string, handler: CdpEventHandler): () => void {
    const handlers = this.eventHandlers.get(method) ?? new Set<CdpEventHandler>();
    handlers.add(handler);
    this.eventHandlers.set(method, handlers);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.eventHandlers.delete(method);
    };
  }

  evaluate(expression: string): Promise<unknown> {
    return this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
  }

  close(): void {
    this.socket.close();
  }
}

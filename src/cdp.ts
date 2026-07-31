import WebSocket from 'ws';

export type CdpTarget = {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
};

export async function findPageTarget(baseUrl: string): Promise<CdpTarget> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/json/list`);
  if (!response.ok) {
    throw new Error(`Cannot read CDP targets: ${response.status} ${response.statusText}`);
  }

  const targets = (await response.json()) as CdpTarget[];
  const pages = targets.filter((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  const target = pages.find((item) => /codex/i.test(`${item.title} ${item.url}`)) ?? pages[0];

  if (!target) {
    throw new Error('No debuggable Codex page target found.');
  }
  return target;
}

export class CdpClient {
  private socket: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  private constructor(socket: WebSocket) {
    this.socket = socket;

    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as { id?: number; result?: unknown; error?: { message?: string } };
      if (!message.id) return;

      const task = this.pending.get(message.id);
      if (!task) return;

      this.pending.delete(message.id);
      if (message.error) task.reject(new Error(message.error.message ?? 'Unknown CDP error'));
      else task.resolve(message.result);
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

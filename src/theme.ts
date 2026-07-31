import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type ThemeName = 'wechat' | 'qq';

export async function loadTheme(name: ThemeName): Promise<string> {
  const file = resolve(process.cwd(), 'themes', name, 'theme.css');
  return readFile(file, 'utf8');
}

export function parseTheme(argv: string[]): ThemeName {
  const index = argv.indexOf('--theme');
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || value === 'wechat') return 'wechat';
  if (value === 'qq') return 'qq';
  throw new Error(`Unsupported theme: ${value}. Use wechat or qq.`);
}

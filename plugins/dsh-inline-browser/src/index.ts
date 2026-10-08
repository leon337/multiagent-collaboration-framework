import type { Context } from '@deepseek-ai/cordis'

export const name = 'mcf-dsh-inline-browser'
export const inject = [] as const

export function apply(_ctx: Context): void {
  // Client-only presentation plugin. The browser engine and host routes remain
  // owned by @try-works/dsh-browser-agent.
}

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-tool'

import { BrowserInlineRow } from './BrowserInlineRow.js'

export const inject = ['slots'] as const

export function apply(ctx: Context): void {
  ctx.slots.inject('tool.call.toolview', () =>
    ctx.slots.register({
      name: 'tool.call.toolview',
      key: 'browser_goto',
    }, BrowserInlineRow))
}

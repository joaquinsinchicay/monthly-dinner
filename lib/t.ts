import texts from './texts.json'

// ── Type utilities ─────────────────────────────────────────────────────────────

// Produces all dot-notation paths that resolve to a string leaf.
// e.g. "common.cancel" | "errors.events.notFound" | "auth.continueWithGoogle"
type DotPaths<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : T[K] extends Record<string, unknown>
      ? DotPaths<T[K], `${Prefix}${K & string}.`>
      : never
}[keyof T]

export type TextKey = DotPaths<typeof texts>

// ── Runtime helper ─────────────────────────────────────────────────────────────

/**
 * Retrieves a static string by dot-notation key.
 *
 * Simple string:
 *   t('common.cancel')  →  "Cancelar"
 *
 * Interpolated string:
 *   t('join.joinButton', { groupName: 'Cenas del Jueves' })
 *   → "Unirme a Cenas del Jueves"
 *
 * Works in: Server Components, Client Components, server actions.
 */
export function t(key: TextKey, vars?: Record<string, string | number>): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = texts
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key
    node = node[part]
  }
  if (typeof node !== 'string') return key
  if (!vars) return node
  return node.replace(/\{(\w+)\}/g, (_, v: string) =>
    vars[v] !== undefined ? String(vars[v]) : `{${v}}`
  )
}

export { texts }

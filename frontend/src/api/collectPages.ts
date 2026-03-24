import { normalizePaginated, type Paginated } from './client'

/** Deve ser ≤ ao `le` dos endpoints de listagem no backend (atualmente 100). */
export const TAMANHO_PAGINA_API_MAX = 100

/**
 * Percorre todas as páginas de uma listagem até atingir `total` ou `maxItens`.
 * Use em selects / formulários que precisam de todos os registros.
 */
export async function coletarTodasPaginas<T>(
  buscar: (offset: number, limit: number) => Promise<Paginated<T> | unknown>,
  tamanhoPagina = TAMANHO_PAGINA_API_MAX,
  maxItens = 5000,
): Promise<T[]> {
  const pageSize = Math.min(Math.max(1, tamanhoPagina), TAMANHO_PAGINA_API_MAX)
  const todos: T[] = []
  let offset = 0
  while (todos.length < maxItens) {
    const raw = await buscar(offset, pageSize)
    const { items, total } = normalizePaginated<T>(raw)
    todos.push(...items)
    if (todos.length >= total || items.length === 0) break
    offset += pageSize
  }
  return todos
}

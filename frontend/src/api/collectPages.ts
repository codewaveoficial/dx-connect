import { normalizePaginated, type Paginated } from './client'

/**
 * Percorre todas as páginas de uma listagem até atingir `total` ou `maxItens`.
 * Use em selects / formulários que precisam de todos os registros.
 */
export async function coletarTodasPaginas<T>(
  buscar: (offset: number, limit: number) => Promise<Paginated<T> | unknown>,
  tamanhoPagina = 200,
  maxItens = 5000,
): Promise<T[]> {
  const todos: T[] = []
  let offset = 0
  while (todos.length < maxItens) {
    const raw = await buscar(offset, tamanhoPagina)
    const { items, total } = normalizePaginated<T>(raw)
    todos.push(...items)
    if (todos.length >= total || items.length === 0) break
    offset += tamanhoPagina
  }
  return todos
}

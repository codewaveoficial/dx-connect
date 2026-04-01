import { useCallback, useMemo, useState } from 'react'

/** Alternância A→Z / Z→A por coluna; `sortParams` encaixa em chamadas à API. */
type Ordem = 'asc' | 'desc'

export function useOrdenacaoLista<K extends string>() {
  const [ordenarPor, setOrdenarPor] = useState<K | null>(null)
  const [ordem, setOrdem] = useState<Ordem>('asc')

  const aoOrdenarColuna = useCallback((coluna: K) => {
    setOrdenarPor((prev) => {
      if (prev === coluna) {
        setOrdem((o) => (o === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setOrdem('asc')
      return coluna
    })
  }, [])

  const sortParams = useMemo(
    () => (ordenarPor ? { ordenar_por: ordenarPor, ordem } as { ordenar_por: K; ordem: Ordem } : {}),
    [ordenarPor, ordem],
  )

  return { ordenarPor, ordem, aoOrdenarColuna, sortParams }
}

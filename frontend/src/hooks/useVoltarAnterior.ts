import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Padrão de navegação “Voltar”: retorna à tela anterior no histórico do SPA
 * (equivalente ao botão voltar do navegador dentro do app).
 * Em aba nova ou sem histórico, usa `fallbackPath`.
 */
export function useVoltarAnterior(fallbackPath: string) {
  const navigate = useNavigate()

  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackPath)
    }
  }, [navigate, fallbackPath])
}

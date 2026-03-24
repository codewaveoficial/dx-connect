/**
 * Converte corpo JSON típico do FastAPI (detail string | lista | objeto) em texto para o usuário.
 */
export function mensagemErroApi(body: unknown, status: number): string {
  if (body !== null && typeof body === 'object') {
    const o = body as Record<string, unknown>
    const detail = o.detail

    if (typeof detail === 'string' && detail.trim()) return detail.trim()

    if (Array.isArray(detail)) {
      const linhas: string[] = []
      for (const item of detail) {
        if (typeof item === 'string' && item.trim()) linhas.push(item.trim())
        else if (item !== null && typeof item === 'object') {
          const row = item as Record<string, unknown>
          if (typeof row.msg === 'string' && row.msg.trim()) linhas.push(row.msg.trim())
          else if (typeof row.message === 'string' && row.message.trim()) linhas.push(row.message.trim())
        }
      }
      if (linhas.length) {
        const resumo = [...new Set(linhas)].join(' ')
        return `Os dados da solicitação não são aceitos pelo servidor. ${resumo}`
      }
    }

    if (detail !== null && typeof detail === 'object') {
      const d = detail as Record<string, unknown>
      if (typeof d.msg === 'string' && d.msg.trim()) return d.msg.trim()
      if (typeof d.message === 'string' && d.message.trim()) return d.message.trim()
    }

    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim()
  }

  if (status === 404) return 'Registro não encontrado.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 422) return 'Dados inválidos. Verifique os campos e tente novamente.'
  if (status >= 500) return 'Serviço indisponível no momento. Tente novamente em instantes.'
  return `Não foi possível concluir a solicitação (código ${status}).`
}

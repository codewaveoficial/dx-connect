export { maskCnpjCpf, digitsOnly, isCpf, isCnpj } from './maskCnpjCpf'

/** CEP 00000-000 */
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/**
 * Telefone BR: fixo (10) ou celular (11 dígitos com DDD).
 * (00) 0000-0000 | (00) 00000-0000
 */
export function maskTelefoneBr(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Exibe telefone já salvo (só dígitos ou já mascarado). */
export function formatTelefoneBrExibicao(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  return maskTelefoneBr(value)
}

/** IE alfanumérica comum (apenas letras e números, máx. 20). */
export function maskInscricaoEstadual(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
}

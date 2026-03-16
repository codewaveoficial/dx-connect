/** Aplica máscara CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o tamanho. */
export function maskCnpjCpf(value: string): string {
  const d = value.replace(/\D/g, '')
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Retorna só os dígitos. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function isCpf(value: string): boolean {
  return digitsOnly(value).length === 11
}

export function isCnpj(value: string): boolean {
  return digitsOnly(value).length === 14
}

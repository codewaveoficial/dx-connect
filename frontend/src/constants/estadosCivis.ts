/** Opções usuais para cláusulas contratuais no Brasil. */

export const ESTADOS_CIVIS_BR = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'Separado(a) judicialmente',
  'União estável',
] as const

export type EstadoCivilBr = (typeof ESTADOS_CIVIS_BR)[number]

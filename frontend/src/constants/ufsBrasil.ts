/** Código IBGE do estado (para API de municípios) e rótulo amigável. */

export type UfItem = { sigla: string; nome: string; ibge: number }

export const UFS_BRASIL: UfItem[] = [
  { sigla: 'AC', nome: 'Acre', ibge: 12 },
  { sigla: 'AL', nome: 'Alagoas', ibge: 27 },
  { sigla: 'AP', nome: 'Amapá', ibge: 16 },
  { sigla: 'AM', nome: 'Amazonas', ibge: 13 },
  { sigla: 'BA', nome: 'Bahia', ibge: 29 },
  { sigla: 'CE', nome: 'Ceará', ibge: 23 },
  { sigla: 'DF', nome: 'Distrito Federal', ibge: 53 },
  { sigla: 'ES', nome: 'Espírito Santo', ibge: 32 },
  { sigla: 'GO', nome: 'Goiás', ibge: 52 },
  { sigla: 'MA', nome: 'Maranhão', ibge: 21 },
  { sigla: 'MT', nome: 'Mato Grosso', ibge: 51 },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', ibge: 50 },
  { sigla: 'MG', nome: 'Minas Gerais', ibge: 31 },
  { sigla: 'PA', nome: 'Pará', ibge: 15 },
  { sigla: 'PB', nome: 'Paraíba', ibge: 25 },
  { sigla: 'PR', nome: 'Paraná', ibge: 41 },
  { sigla: 'PE', nome: 'Pernambuco', ibge: 26 },
  { sigla: 'PI', nome: 'Piauí', ibge: 22 },
  { sigla: 'RJ', nome: 'Rio de Janeiro', ibge: 33 },
  { sigla: 'RN', nome: 'Rio Grande do Norte', ibge: 24 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', ibge: 43 },
  { sigla: 'RO', nome: 'Rondônia', ibge: 11 },
  { sigla: 'RR', nome: 'Roraima', ibge: 14 },
  { sigla: 'SC', nome: 'Santa Catarina', ibge: 42 },
  { sigla: 'SP', nome: 'São Paulo', ibge: 35 },
  { sigla: 'SE', nome: 'Sergipe', ibge: 28 },
  { sigla: 'TO', nome: 'Tocantins', ibge: 17 },
]

export const UFS_BRASIL_OPTIONS = UFS_BRASIL.map((u) => ({
  value: u.sigla,
  label: `${u.sigla} — ${u.nome}`,
}))

const BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? 'http://localhost:8000');

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as object),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Tratamento especial para login: não redirecionar nem recarregar a página,
  // apenas devolver a mensagem para o formulário exibir via toast.
  if (res.status === 401 && path.startsWith('/auth/login')) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? 'E-mail ou senha inválidos');
  }

  if (res.status === 401) {
    const err = await res.json().catch(() => ({}));
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error(err.detail ?? err.message ?? 'Não autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const auth = {
  login: (email: string, senha: string) =>
    api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
};

function withParams(path: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return path;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Resposta padrão de listagens paginadas (backend ListaPaginada). */
export type Paginated<T> = { items: T[]; total: number };

/**
 * Aceita tanto `{ items, total }` quanto array legado `[]` (API antiga),
 * evitando tela em branco quando backend e frontend estão dessincronizados.
 */
export function normalizePaginated<T>(data: unknown): Paginated<T> {
  if (Array.isArray(data)) {
    return { items: data as T[], total: (data as T[]).length }
  }
  if (data && typeof data === 'object' && 'items' in data) {
    const d = data as { items?: unknown; total?: unknown }
    const items = Array.isArray(d.items) ? (d.items as T[]) : []
    const total = typeof d.total === 'number' ? d.total : items.length
    return { items, total }
  }
  return { items: [], total: 0 }
}

function listPaginated<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  return api<unknown>(withParams(path, params)).then((raw) => normalizePaginated<T>(raw))
}

export const redes = {
  list: (params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<Redes.Rede>('/redes', params),
  get: (id: number) => api<Redes.Rede>(`/redes/${id}`),
  getFuncionarios: (
    redeId: number,
    params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number },
  ) => listPaginated<Redes.FuncionarioComVinculo>(`/redes/${redeId}/funcionarios`, params),
  create: (data: Redes.Create) => api<Redes.Rede>('/redes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Redes.Update) => api<Redes.Rede>(`/redes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/redes/${id}`, { method: 'DELETE' }),
};

export const empresas = {
  list: (params?: { rede_id?: number; incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<Empresas.Empresa>('/empresas', params),
  get: (id: number) => api<Empresas.Empresa>(`/empresas/${id}`),
  consultarCnpj: (cnpj: string) => api<Empresas.ConsultaCNPJ>(`/empresas/consultar-cnpj/${encodeURIComponent(cnpj.replace(/\D/g, ''))}`),
  create: (data: Empresas.Create) => api<Empresas.Empresa>('/empresas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Empresas.Update) => api<Empresas.Empresa>(`/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/empresas/${id}`, { method: 'DELETE' }),
};

export const tiposNegocio = {
  list: (params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<TiposNegocio.Tipo>('/tipos-negocio', params),
  get: (id: number) => api<TiposNegocio.Tipo>(`/tipos-negocio/${id}`),
  create: (data: TiposNegocio.Create) => api<TiposNegocio.Tipo>('/tipos-negocio', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: TiposNegocio.Update) => api<TiposNegocio.Tipo>(`/tipos-negocio/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/tipos-negocio/${id}`, { method: 'DELETE' }),
};

export const setores = {
  list: (params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<Setores.Setor>('/setores', params),
  get: (id: number) => api<Setores.Setor>(`/setores/${id}`),
  create: (data: Setores.Create) => api<Setores.Setor>('/setores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Setores.Update) => api<Setores.Setor>(`/setores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/setores/${id}`, { method: 'DELETE' }),
};

export const atendentes = {
  list: (params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<Atendentes.Atendente>('/atendentes', params),
  me: () => api<Atendentes.Atendente>('/atendentes/me'),
  get: (id: number) => api<Atendentes.Atendente>(`/atendentes/${id}`),
  create: (data: Atendentes.Create) => api<Atendentes.Atendente>('/atendentes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Atendentes.Update) => api<Atendentes.Atendente>(`/atendentes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/atendentes/${id}`, { method: 'DELETE' }),
};

export const funcionariosRede = {
  list: (params?: {
    rede_id?: number;
    empresa_id?: number;
    tipo?: string;
    incluir_inativos?: boolean;
    busca?: string;
    offset?: number;
    limit?: number;
  }) => listPaginated<FuncionariosRede.Funcionario>('/funcionarios-rede', params),
  get: (id: number) => api<FuncionariosRede.Funcionario>(`/funcionarios-rede/${id}`),
  create: (data: FuncionariosRede.Create) => api<FuncionariosRede.Funcionario>('/funcionarios-rede', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: FuncionariosRede.Update) => api<FuncionariosRede.Funcionario>(`/funcionarios-rede/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/funcionarios-rede/${id}`, { method: 'DELETE' }),
};

export const statusTicket = {
  list: (params?: { incluir_inativos?: boolean; busca?: string; offset?: number; limit?: number }) =>
    listPaginated<StatusTicket.Status>('/status-ticket', params),
  get: (id: number) => api<StatusTicket.Status>(`/status-ticket/${id}`),
  create: (data: StatusTicket.Create) => api<StatusTicket.Status>('/status-ticket', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: StatusTicket.Update) => api<StatusTicket.Status>(`/status-ticket/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/status-ticket/${id}`, { method: 'DELETE' }),
};

export const audit = {
  list: (params?: {
    entity_type?: string;
    entity_id?: number;
    busca?: string;
    offset?: number;
    limit?: number;
  }) => listPaginated<Audit.AuditLogEntry>('/audit', params),
};

export const tickets = {
  list: (params?: {
    empresa_id?: number;
    setor_id?: number;
    status_id?: number;
    protocolo?: string;
    busca?: string;
    offset?: number;
    limit?: number;
  }) => listPaginated<Tickets.Ticket>('/tickets', params),
  get: (id: number) => api<Tickets.Ticket>(`/tickets/${id}`),
  getHistorico: (id: number) => api<Tickets.Historico[]>(`/tickets/${id}/historico`),
  create: (data: Tickets.Create) => api<Tickets.Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Tickets.Update) => api<Tickets.Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const dashboard = {
  get: () => api<Dashboard.Response>('/dashboard'),
};

export namespace Dashboard {
  export interface StatusCount {
    status_id: number;
    status_nome: string;
    total: number;
  }
  export interface Resumo {
    total_tickets: number;
    abertos_hoje: number;
    por_status: StatusCount[];
  }
  export interface Response {
    resumo: Resumo;
    ultimos_tickets: Tickets.Ticket[];
  }
}

export namespace Redes {
  export interface Rede {
    id: number;
    nome: string;
    ativo: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  }
  export interface FuncionarioComVinculo extends FuncionariosRede.Funcionario {
    vinculado_a: string;
  }
  export interface Create {
    nome: string;
    ativo?: boolean;
  }
  export interface Update {
    nome?: string;
    ativo?: boolean;
  }
}

export namespace Empresas {
  export interface Empresa {
    id: number;
    rede_id: number;
    tipo_negocio_id: number | null;
    nome: string;
    cnpj_cpf: string | null;
    razao_social: string | null;
    nome_fantasia: string | null;
    inscricao_estadual: string | null;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    email: string | null;
    telefone: string | null;
    ativo: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  }
  export interface ConsultaCNPJ {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string | null;
    situacao: string | null;
    endereco: string;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    email: string | null;
    telefone: string | null;
    abertura: string | null;
    natureza_juridica: string | null;
    atividade_principal: string | null;
  }
  export interface Create {
    rede_id: number;
    tipo_negocio_id?: number | null;
    nome: string;
    cnpj_cpf?: string | null;
    razao_social?: string | null;
    nome_fantasia?: string | null;
    inscricao_estadual?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  }
  export interface Update {
    rede_id?: number;
    tipo_negocio_id?: number | null;
    nome?: string;
    cnpj_cpf?: string | null;
    razao_social?: string | null;
    nome_fantasia?: string | null;
    inscricao_estadual?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  }
}

export namespace TiposNegocio {
  export interface Tipo {
    id: number;
    nome: string;
    ativo: boolean;
  }
  export interface Create {
    nome: string;
    ativo?: boolean;
  }
  export interface Update {
    nome?: string;
    ativo?: boolean;
  }
}

export namespace Setores {
  export interface Setor {
    id: number;
    nome: string;
    slug: string;
    ativo: boolean;
  }
  export interface Create {
    nome: string;
    slug: string;
    ativo?: boolean;
  }
  export interface Update {
    nome?: string;
    slug?: string;
    ativo?: boolean;
  }
}

export namespace Atendentes {
  export interface Atendente {
    id: number;
    email: string;
    nome: string;
    role: string;
    ativo: boolean;
    setor_ids: number[];
  }
  export interface Create {
    email: string;
    nome: string;
    senha: string;
    role?: string;
    ativo?: boolean;
    setor_ids?: number[];
  }
  export interface Update {
    email?: string;
    nome?: string;
    senha?: string;
    role?: string;
    ativo?: boolean;
    setor_ids?: number[];
  }
}

export namespace FuncionariosRede {
  export interface Funcionario {
    id: number;
    nome: string;
    email: string;
    tipo: string;
    ativo: boolean;
    rede_id?: number;
    empresa_id?: number;
    empresa_ids: number[];
  }
  export interface Create {
    nome: string;
    email: string;
    tipo: string;
    ativo?: boolean;
    rede_id?: number;
    empresa_id?: number;
    empresa_ids?: number[];
  }
  export interface Update {
    nome?: string;
    email?: string;
    tipo?: string;
    ativo?: boolean;
    rede_id?: number;
    empresa_id?: number;
    empresa_ids?: number[];
  }
}

export namespace StatusTicket {
  export interface Status {
    id: number;
    nome: string;
    slug: string;
    ordem: number;
    ativo: boolean;
  }
  export interface Create {
    nome: string;
    slug: string;
    ordem?: number;
    ativo?: boolean;
  }
  export interface Update {
    nome?: string;
    slug?: string;
    ordem?: number;
    ativo?: boolean;
  }
}

export namespace Tickets {
  export interface Ticket {
    id: number;
    protocolo: string;
    empresa_id: number;
    setor_id: number;
    status_id: number;
    atendente_id?: number;
    aberto_por_id?: number;
    assunto: string;
    descricao?: string;
    fechado_em?: string;
    created_at?: string;
    updated_at?: string;
    empresa_nome?: string;
    setor_nome?: string;
    status_nome?: string;
    atendente_nome?: string;
  }
  export interface Historico {
    id: number;
    ticket_id: number;
    atendente_id?: number;
    campo: string;
    valor_antigo?: string;
    valor_novo?: string;
    created_at: string;
  }
  export interface Create {
    empresa_id: number;
    setor_id: number;
    assunto: string;
    descricao?: string;
    aberto_por_id?: number;
  }
  export interface Update {
    setor_id?: number;
    status_id?: number;
    atendente_id?: number;
    assunto?: string;
    descricao?: string;
  }
}

export namespace Audit {
  export interface AuditLogEntry {
    id: number;
    entity_type: string;
    entity_id: number;
    action: string;
    atendente_id: number | null;
    atendente_nome: string | null;
    created_at: string;
  }
}

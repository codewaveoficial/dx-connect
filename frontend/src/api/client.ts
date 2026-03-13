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

export const redes = {
  list: () => api<Redes.Rede[]>('/redes'),
  get: (id: number) => api<Redes.Rede>(`/redes/${id}`),
  getFuncionarios: (redeId: number) => api<Redes.FuncionarioComVinculo[]>(`/redes/${redeId}/funcionarios`),
  create: (data: Redes.Create) => api<Redes.Rede>('/redes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Redes.Update) => api<Redes.Rede>(`/redes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/redes/${id}`, { method: 'DELETE' }),
};

export const empresas = {
  list: (redeId?: number) => api<Empresas.Empresa[]>(redeId != null ? `/empresas?rede_id=${redeId}` : '/empresas'),
  get: (id: number) => api<Empresas.Empresa>(`/empresas/${id}`),
  create: (data: Empresas.Create) => api<Empresas.Empresa>('/empresas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Empresas.Update) => api<Empresas.Empresa>(`/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/empresas/${id}`, { method: 'DELETE' }),
};

export const setores = {
  list: () => api<Setores.Setor[]>('/setores'),
  get: (id: number) => api<Setores.Setor>(`/setores/${id}`),
  create: (data: Setores.Create) => api<Setores.Setor>('/setores', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Setores.Update) => api<Setores.Setor>(`/setores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/setores/${id}`, { method: 'DELETE' }),
};

export const atendentes = {
  list: () => api<Atendentes.Atendente[]>('/atendentes'),
  me: () => api<Atendentes.Atendente>('/atendentes/me'),
  get: (id: number) => api<Atendentes.Atendente>(`/atendentes/${id}`),
  create: (data: Atendentes.Create) => api<Atendentes.Atendente>('/atendentes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Atendentes.Update) => api<Atendentes.Atendente>(`/atendentes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/atendentes/${id}`, { method: 'DELETE' }),
};

export const funcionariosRede = {
  list: (params?: { rede_id?: number; empresa_id?: number; tipo?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<FuncionariosRede.Funcionario[]>(`/funcionarios-rede${q ? `?${q}` : ''}`);
  },
  get: (id: number) => api<FuncionariosRede.Funcionario>(`/funcionarios-rede/${id}`),
  create: (data: FuncionariosRede.Create) => api<FuncionariosRede.Funcionario>('/funcionarios-rede', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: FuncionariosRede.Update) => api<FuncionariosRede.Funcionario>(`/funcionarios-rede/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/funcionarios-rede/${id}`, { method: 'DELETE' }),
};

export const statusTicket = {
  list: () => api<StatusTicket.Status[]>('/status-ticket'),
  get: (id: number) => api<StatusTicket.Status>(`/status-ticket/${id}`),
  create: (data: StatusTicket.Create) => api<StatusTicket.Status>('/status-ticket', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: StatusTicket.Update) => api<StatusTicket.Status>(`/status-ticket/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => api<void>(`/status-ticket/${id}`, { method: 'DELETE' }),
};

export const tickets = {
  list: (params?: { empresa_id?: number; setor_id?: number; status_id?: number; protocolo?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<Tickets.Ticket[]>(`/tickets${q ? `?${q}` : ''}`);
  },
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
    nome: string;
    ativo: boolean;
  }
  export interface Create {
    rede_id: number;
    nome: string;
    ativo?: boolean;
  }
  export interface Update {
    rede_id?: number;
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

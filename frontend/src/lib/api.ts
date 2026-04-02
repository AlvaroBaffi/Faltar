const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { nome: string; email: string; senha: string; universidade: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; senha: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: () => request('/auth/profile'),
    updateProfile: (data: { nome?: string; universidade?: string; limiteFaltas?: number }) =>
      request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },
  disciplinas: {
    list: () => request('/disciplinas'),
    get: (id: string) => request(`/disciplinas/${id}`),
    create: (data: { nome: string; horas: number; porcentagemFalta: number; diasSemana: string[] }) =>
      request('/disciplinas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { nome?: string; horas?: number; porcentagemFalta?: number; diasSemana?: string[] }) =>
      request(`/disciplinas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/disciplinas/${id}`, { method: 'DELETE' }),
  },
  faltas: {
    list: () => request('/faltas'),
    create: (data: { disciplinaId: string; data: string }) =>
      request('/faltas', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/faltas/${id}`, { method: 'DELETE' }),
    calcular: () => request('/faltas/calcular'),
  },
};

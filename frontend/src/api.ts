const API_URL = 'http://localhost:8000';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  accounts: Account[];
}

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  institution_name: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  checkHealth: async () => {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Backend failed');
    return response.json();
  },

  login: async (username: string, password: string): Promise<string> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data.access_token;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.reload();
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(`${API_URL}/users/me/`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  // Legacy (Admin only technically)
  createUser: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, is_active: true }),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  getUser: async () => {
    // Phase 2: Use getMe instead of ID lookup for security
    return api.getMe();
  },

  // Tasks
  getTasks: async () => {
    const response = await fetch(`${API_URL}/tasks/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (task: { title: string; group: string; due_date?: string }) => {
    const response = await fetch(`${API_URL}/tasks/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  deleteTask: async (taskId: number) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  },

  syncAccounts: async () => {
    const response = await fetch(`${API_URL}/plaid/sync_accounts`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to sync accounts');
    return response.json();
  },

  // Transactions
  getTransactions: async () => {
    const response = await fetch(`${API_URL}/transactions/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  syncTransactions: async () => {
    const response = await fetch(`${API_URL}/plaid/sync_transactions`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to sync transactions');
    return response.json();
  },

  updateTransactionTax: async (id: number, is_tax_deductible: boolean) => {
    const response = await fetch(`${API_URL}/transactions/${id}/tax_deductible?is_tax_deductible=${is_tax_deductible}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update tax status');
    return response.json();
  }
};

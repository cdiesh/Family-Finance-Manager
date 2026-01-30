const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

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
  item_id: number;
  is_hidden?: boolean;
}

export interface Asset {
  id: number;
  name: string;
  type: 'real_estate' | 'investment' | 'vehicle' | 'other';
  value: number;
  ownership_percentage: number;
  linked_account_id?: number;
  // Manual Mortgage
  manual_mortgage_balance?: number;
  interest_rate?: number;
  monthly_payment?: number;
  equity_value: number;
  current_balance: number;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  is_tax_deductible: boolean;
  account_id: number;
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

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetch(`${API_URL}/assets/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
  },

  createAsset: async (asset: Partial<Asset>) => {
    const response = await fetch(`${API_URL}/assets/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(asset),
    });
    if (!response.ok) throw new Error('Failed to create asset');
    return response.json();
  },

  deleteAsset: async (id: number) => {
    const response = await fetch(`${API_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete asset');
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

  loginGoogle: async (token: string): Promise<string> => {
    const response = await fetch(`${API_URL}/google/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error('Google Login failed');
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
    if (!response.ok) throw new Error('Failed to sync accounts');
    return response.json();
  },

  getAccounts: async (): Promise<Account[]> => {
    const response = await fetch(`${API_URL}/accounts/`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  },

  toggleAccountVisibility: async (accountId: number) => {
    const response = await fetch(`${API_URL}/accounts/${accountId}/toggle_visibility`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to toggle visibility');
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

  getHoldings: async (itemId: number) => {
    const response = await fetch(`${API_URL}/plaid/holdings/${itemId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch holdings');
    return response.json();
  },

  updateTask: async (id: number, updates: Partial<{ title: string; group: string; is_completed: boolean; due_date: string }>) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  updateTransactionTax: async (id: number, is_tax_deductible: boolean) => {
    const response = await fetch(`${API_URL}/transactions/${id}/tax_deductible?is_tax_deductible=${is_tax_deductible}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update tax status');
    return response.json();
  },

  // Plaid Link
  createLinkToken: async () => {
    const response = await fetch(`${API_URL}/plaid/create_link_token`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to create link token');
    return response.json();
  },

  exchangePublicToken: async (publicToken: string, institutionName: string) => {
    const response = await fetch(`${API_URL}/plaid/exchange_public_token`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ public_token: publicToken, institution_name: institutionName }),
    });
    if (!response.ok) throw new Error('Failed to exchange public token');
    return response.json();
  },

  // Insights (New)
  // Insights (New)
  getInsights: async (timeRange: string = '365d', month?: number | null, year?: number | null, sourceType: string = 'all') => {
    let url = `${API_URL}/insights/spending?time_range=${timeRange}&source_type=${sourceType}`;
    if (month && year) {
      url += `&month=${month}&year=${year}`;
    }
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  },

  getInsightsTransactions: async (month?: number | null, year?: number | null, sourceType: string = 'all') => {
    let url = `${API_URL}/insights/transactions`;
    const params = [`source_type=${sourceType}`];
    if (month && year) {
      params.push(`month=${month}`);
      params.push(`year=${year}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  runAutoCategorization: async () => {
    const response = await fetch(`${API_URL}/insights/auto_categorize`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to run AI categorization');
    return response.json();
  },

  updateTransaction: async (id: number, updates: { category?: string; tags?: string; is_fixed?: boolean }) => {
    const response = await fetch(`${API_URL}/transactions/${id}/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    return response.json();
  }
};

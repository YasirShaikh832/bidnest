// Empty string = same origin (Docker/nginx proxy). Undefined = local dev (API on :3001)
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL === '' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bidnest_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bidnest_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bidnest_token');
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  auth: {
    signup: (body: { email: string; password: string; name?: string }) =>
      fetchApi<{ user: object; token: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      fetchApi<{ user: object; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  auctions: {
    list: (params?: { search?: string; tags?: string[]; sort?: string }) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.tags?.length) sp.set('tags', params.tags.join(','));
      if (params?.sort) sp.set('sort', params.sort);
      const q = sp.toString();
      return fetchApi<Auction[]>(`/api/auctions${q ? `?${q}` : ''}`);
    },
    get: (id: string) => fetchApi<Auction>(`/api/auctions/${id}`),
    create: (body: CreateAuctionInput) =>
      fetchApi<Auction>('/api/auctions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { title?: string; description?: string; imageUrl?: string; tags?: string[] }) =>
      fetchApi<Auction>(`/api/auctions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  users: {
    me: () => fetchApi<UserProfile>('/api/users/me'),
    updateMe: (body: { name?: string; profileImageUrl?: string; darkMode?: boolean; emailAlerts?: boolean; themeColor?: string; currencyFormat?: string }) =>
      fetchApi<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
    uploadAvatar: async (file: File): Promise<User> => {
      const token = getToken();
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch(`${API_URL}/api/users/me/avatar`, { method: 'POST', headers, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      return data as User;
    },
    sendEmailOtp: () =>
      fetchApi<{ message?: string }>('/api/users/me/send-email-otp', { method: 'POST' }),
    verifyEmail: (code: string) =>
      fetchApi<User>('/api/users/me/verify-email', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },
  bids: {
    create: (body: { auctionId: string; amount: number; type?: string }) =>
      fetchApi<Bid>('/api/bids', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/api/bids/${id}`, { method: 'DELETE' }),
  },
  ai: {
    status: () => fetchApi<{ connected: boolean; error?: string }>('/api/ai/status'),
    chat: (message: string, model?: string) =>
      fetchApi<{ reply: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, model }),
      }),
  },
};

export type User = {
  id: string;
  email: string;
  name?: string | null;
  profileImageUrl?: string | null;
  emailVerifiedAt?: string | null;
  emailAlerts?: boolean;
  ratingBuyer?: number;
  ratingSeller?: number;
  darkMode?: boolean;
  themeColor?: string;
  currencyFormat?: string;
  createdAt: string;
};

export type UserProfile = User & {
  stats?: { bidsPlaced: number; highestBidEver: number; auctionsCreated: number };
};

export type Auction = {
  id: string;
  title: string;
  description?: string | null;
  startingPrice: number;
  currentPrice: number;
  imageUrl?: string | null;
  tags?: string[];
  type?: string;
  expiresAt: string;
  scheduledStartAt?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name?: string | null; email: string; profileImageUrl?: string | null };
  bids?: Bid[];
};

export type Bid = {
  id: string;
  amount: number;
  type?: string;
  createdAt: string;
  user?: { id: string; name?: string | null; email?: string; profileImageUrl?: string | null };
};

export type CreateAuctionInput = {
  title: string;
  description?: string;
  startingPrice: number;
  imageUrl?: string;
  tags?: string[];
  type?: string;
  expiresAt: string;
  scheduledStartAt?: string;
};

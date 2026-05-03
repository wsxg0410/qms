const AUTH_KEY_STORAGE = 'qms-admin-auth-key';

export interface AuthProvider {
  login: (params: { authKey: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkError: (error: any) => Promise<void>;
  getIdentity: () => Promise<{ id: string; fullName: string }>;
  getPermissions: () => Promise<string>;
}

export const authProvider: AuthProvider = {
  login: async ({ authKey }: { authKey: string }) => {
    localStorage.setItem(AUTH_KEY_STORAGE, authKey);
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY_STORAGE);
  },

  checkAuth: async () => {
    const key = localStorage.getItem(AUTH_KEY_STORAGE);
    if (!key) {
      throw new Error('No auth key configured');
    }
  },

  checkError: async (error: any) => {
    const status = error?.status || error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(AUTH_KEY_STORAGE);
      throw new Error('Unauthorized');
    }
    // 非 401 错误不触发登出
  },

  getIdentity: async () => ({
    id: 'admin',
    fullName: 'QMS Admin',
  }),

  getPermissions: async () => 'admin',
};

/** 获取当前存储的 auth key */
export function getAuthKey(): string | null {
  return localStorage.getItem(AUTH_KEY_STORAGE);
}

/** 设置 auth key */
export function setAuthKey(key: string): void {
  localStorage.setItem(AUTH_KEY_STORAGE, key);
}

/** 检查是否已有 auth key */
export function hasAuthKey(): boolean {
  return !!localStorage.getItem(AUTH_KEY_STORAGE);
}

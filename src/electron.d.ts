// This file makes TypeScript aware of the 'electronAPI' on the window object.

export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  last_sign_in_at?: string;
  app_metadata: {
    access_granted?: boolean;
    [key: string]: unknown;
  };
  // Add other properties you need
}

export interface IElectronAPI {
  listUsers: () => Promise<{ users?: SupabaseUser[], error?: Error }>;
  updateUserAccess: (userId: string, grantAccess: boolean) => Promise<{ user?: SupabaseUser, error?: Error }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
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
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<{
    platform: string;
    arch: string;
    version: string;
  }>;
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePath?: string } | null>;
  showOpenDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => Promise<{ canceled: boolean; filePaths: string[] } | null>;
  onMenuAction: (
    callback: (event: unknown, channel: string, data?: unknown) => void
  ) => () => void;
  isElectron: boolean;
  platform: string;
  showNotification: (
    title: string,
    options?: NotificationOptions
  ) => Notification;
  print: () => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
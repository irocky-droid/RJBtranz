import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  listUsers: () => ipcRenderer.invoke('list-users'),
  updateUserAccess: (userId: string, grantAccess: boolean) => 
    ipcRenderer.invoke('update-user-access', userId, grantAccess),
});
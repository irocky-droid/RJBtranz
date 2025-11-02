"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    listUsers: () => electron_1.ipcRenderer.invoke('list-users'),
    updateUserAccess: (userId, grantAccess) => electron_1.ipcRenderer.invoke('update-user-access', userId, grantAccess),
});

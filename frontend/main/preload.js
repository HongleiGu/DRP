import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  getFiles: (directory) => ipcRenderer.invoke('get-files', directory),
  existsFile: (filePath) => ipcRenderer.invoke('exists-file', filePath),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
});
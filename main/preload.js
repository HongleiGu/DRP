import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronApi', {
  writeFile: (filePath, content) => ipcRenderer.invoke('write-json', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('read-json', filePath),
  createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  getFiles: (directory) => ipcRenderer.invoke('get-files', directory)
});
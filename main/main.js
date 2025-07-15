// electron ts -> js convertion can be troublesome, so we use js directly
// this file is the main process of the electron app

import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'node:fs/promises';

app.disableHardwareAcceleration(); // Disable hardware acceleration

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
  });
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// ipc handlers

// write to file
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
})

// read from file
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
})

// create a new file
ipcMain.handle('create-file', async (event, filePath) => {
  try {
    await fs.writeFile(filePath, '', 'utf8');
    return { success: true }; // Return success response
  } catch (error) { 
    console.error('Error creating file:', error);
    return { success: false, error: error.message }; // Return error response
  }
})

// delete a file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true }; // Return success response
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message }; // Return error response
  }
})

ipcMain.handle('get-files', async (event, directory) => {
  try {
    const files = await fs.readdir(directory);
    return { success: true, data: files }; // Return success response with file list
  } catch (error) {
    console.error('Error reading directory:', error);
    return { success: false, error: error.message }; // Return error response
  }
});
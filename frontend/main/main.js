import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express'; // this runs a static server
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDir = path.join(__dirname, '..', 'out')

app.disableHardwareAcceleration(); // Optional: Disable hardware acceleration

const store = new Store({ name: 'app-store' });

let server;

async function startServer() {
  return new Promise((resolve, reject) => {
    const expressApp = express();

    // Serve static assets (css, js, images) from buildDir
    expressApp.use(express.static(buildDir));

    // Custom handler to serve HTML files based on the first path segment
    expressApp.get('/*splat', (req, res) => {
      // Get the first segment after '/'
      const segments = req.path.split('/').filter(Boolean);
      const fileName = segments.length > 0 ? segments[0] : 'index';

      const filePath = path.join(buildDir, `${fileName}.html`);

      // Try to send the file, fallback to index.html if not found
      res.sendFile(filePath, err => {
        if (err) {
          // If file doesn't exist, serve index.html as fallback
          res.sendFile(path.join(buildDir, 'index.html'));
        }
      });
    });

    expressApp.get('/', (req, res) => {
      res.sendFile(path.join(buildDir, 'index.html'));
    })

    const port = 3000;
    server = expressApp.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(port);
    });

    server.on('error', reject);
  });
}

async function createWindow() {
  const port = await startServer();

  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
    },
  });

  win.loadURL(`http://localhost:${port}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('unhandledRejection', e => { console.error(e); });

// Your ipcMain handlers (unchanged) here...

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-file', async (event, filePath) => {
  try {
    await fs.writeFile(filePath, '', 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error creating file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-files', async (event, directory) => {
  try {
    const files = await fs.readdir(directory);
    return { success: true, data: files };
  } catch (error) {
    console.error('Error reading directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('exists-file', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'File does not exist' };
    }
    console.error('Error checking file existence:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-data-path', async () => {
  // Dummy: return current directory (you can change to app.getPath('userData') later)
  return './';
});

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});
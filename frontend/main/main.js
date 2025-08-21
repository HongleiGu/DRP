import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildDir = path.join(__dirname, '..', 'out');

app.disableHardwareAcceleration(); // Optional

const store = new Store({ name: 'app-store' });
let server;

// Start HTTP server (HTTPS disabled)
async function startServer() {
  return new Promise((resolve, reject) => {
    const expressApp = express();

    // Serve static assets
    expressApp.use(express.static(buildDir));

    // Serve HTML files
    expressApp.get('/*splat', (req, res) => {
      const segments = req.path.split('/').filter(Boolean);
      const fileName = segments.length > 0 ? segments[0] : 'index';
      const filePath = path.join(buildDir, `${fileName}.html`);
      res.sendFile(filePath, err => {
        if (err) res.sendFile(path.join(buildDir, 'index.html'));
      });
    });

    expressApp.get('/', (req, res) => {
      res.sendFile(path.join(buildDir, 'index.html'));
    });

    const port = 3000;

    // HTTPS options (commented out)
    /*
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
    };

    server = https.createServer(httpsOptions, expressApp)
      .listen(port, () => {
        console.log(`HTTPS Static server running at https://localhost:${port}`);
        resolve(port);
      });
    */

    // Use plain HTTP instead
    server = expressApp.listen(port, () => {
      console.log(`HTTP Static server running at http://localhost:${port}`);
      resolve(port);
    });

    server.on('error', reject);
  });
}

// Create Electron window
async function createWindow() {
  const port = await startServer();

  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      nodeIntegration: true,
    },
  });

  win.loadURL(`http://localhost:${port}`); // Use HTTP
}

// Remove certificate-error handler (not needed anymore)
/*
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
*/

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('unhandledRejection', e => console.error(e));

/* ------------------- ipcMain Handlers ------------------- */

// ...keep all your ipcMain handlers as-is


/* ------------------- ipcMain Handlers ------------------- */

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-file', async (event, filePath) => {
  try {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, '', 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error creating file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-files', async (event, directory) => {
  try {
    const files = await fs.promises.readdir(directory);
    return { success: true, data: files };
  } catch (error) {
    console.error('Error reading directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('exists-file', async (event, filePath) => {
  try {
    await fs.promises.access(filePath);
    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') return { success: false, error: 'File does not exist' };
    console.error('Error checking file existence:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-data-path', async () => './');

ipcMain.handle('store-get', (event, key) => store.get(key));
ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});
ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});

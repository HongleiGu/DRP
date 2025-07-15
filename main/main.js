import { app, BrowserWindow } from 'electron';

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

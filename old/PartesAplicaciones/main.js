const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple local apps, this is easier, though less secure. 
      // For a production app, we'd use preload scripts.
    },
    icon: path.join(__dirname, 'icon.png') // Placeholder
  });

  // Load the React app
  // In dev, we load localhost. In prod, we load the build file.
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, 'src', 'backend', 'server.js');
  // In a real packaged app, we'd need to handle node executable path or bundle the backend.
  // For this "local" requirement, assuming node is installed is simplest for now.
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'src', 'backend'),
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

const net = require('net');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      socket.write('Echo server\r\n');
      socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');
    server.on('error', (e) => {
      resolve(true);
    });
    server.on('listening', () => {
      server.close();
      resolve(false);
    });
  });
}

app.on('ready', async () => { // Made async to use await
  console.log('ELECTRON_START_URL:', process.env.ELECTRON_START_URL);

  // Check if backend is already running (e.g. via npm start)
  const backendRunning = await isPortInUse(5001);

  if (!backendRunning) {
    console.log('Port 5001 free, starting backend...');
    startBackend();
  } else {
    console.log('Backend already running on port 5001');
  }

  createWindow();

  // Open DevTools
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

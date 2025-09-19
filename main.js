const { app, BrowserWindow, globalShortcut } = require('electron');
const Store = require('electron-store');

let win;
let locked = true; // start click-through by default
const store = new Store();

function createWindow() {
  // Load previous bounds or use defaults
  const bounds = store.get('windowBounds') || { width: 400, height: 600 };

  win = new BrowserWindow({
    ...bounds, // spread previous x,y,width,height
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
    }
  });

  // Load your chat URL
  win.loadURL("https://multichat.livepush.io/mcSprPsAwsSs0D2XU");

  // Overlay starts click-through
  win.setIgnoreMouseEvents(true);

  // Save bounds when window is moved/resized
  win.on('close', () => {
    store.set('windowBounds', win.getBounds());
  });

  // Toggle lock/unlock with F10
  globalShortcut.register('F10', () => {
    locked = !locked;
    win.setIgnoreMouseEvents(locked);
    console.log("Overlay locked:", locked);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

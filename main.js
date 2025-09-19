const { app, BrowserWindow, globalShortcut } = require('electron');
const Store = require('electron-store');
const prompt = require('electron-prompt');

let win;
let locked = true; // start click-through by default
const store = new Store();

function createWindow(chatUrl) {
  // Load previous bounds or use defaults
  const bounds = store.get('windowBounds') || { width: 400, height: 600 };

  win = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
    }
  });

  // Load chosen chat URL
  win.loadURL(chatUrl);

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

app.whenReady().then(() => {
  prompt({
    title: 'Enter Chat URL',
    label: 'Chat URL:',
    value: 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU', // default URL
    inputAttrs: {
      type: 'url'
    },
    type: 'input'
  }).then((chatUrl) => {
    if (chatUrl === null || chatUrl.trim() === '') {
      chatUrl = 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU';
    }
    createWindow(chatUrl);
  }).catch(console.error);
});

app.on('window-all-closed', () => {
  app.quit();
});

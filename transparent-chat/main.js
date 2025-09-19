const { app, BrowserWindow, globalShortcut } = require('electron');

let win;
let locked = true;  start click-through by default

function createWindow() {
  win = new BrowserWindow({
    width 400,
    height 600,
    frame false,
    transparent true,
    alwaysOnTop true,
    resizable true,
    skipTaskbar true,
    webPreferences {
      nodeIntegration false,
    }
  });

  win.loadURL(httpsmultichat.livepush.iomcSprPsAwsSs0D2XU);

   Overlay starts click-through
  win.setIgnoreMouseEvents(true);

   Toggle lockunlock with F10
  globalShortcut.register('F10', () = {
    locked = !locked;
    win.setIgnoreMouseEvents(locked);
    console.log(Overlay locked, locked);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () = {
  app.quit();
});

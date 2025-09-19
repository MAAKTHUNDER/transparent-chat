const { app, BrowserWindow, globalShortcut } = require('electron');
const Store = require('electron-store');
const prompt = require('electron-prompt');

let win;
let locked = true; // start in locked mode (overlay)
const store = new Store();

function createWindow(chatUrl) {
  // Load previous bounds or use defaults
  const bounds = store.get('windowBounds') || { width: 400, height: 600 };

  win = new BrowserWindow({
    ...bounds,
    frame: false, // start frameless (locked)
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false, // show in taskbar
    webPreferences: {
      nodeIntegration: false,
    }
  });

  win.loadURL(chatUrl);

  // Start click-through
  win.setIgnoreMouseEvents(true);

  // Save bounds when window is moved/resized
  win.on('close', () => {
    store.set('windowBounds', win.getBounds());
  });

  // Toggle lock/unlock with F10
  globalShortcut.register('F10', () => {
    locked = !locked;

    if (locked) {
      // Locked mode → transparent overlay
      win.setIgnoreMouseEvents(true);
      win.setBounds(store.get('windowBounds') || win.getBounds());
      win.setResizable(true);
      win.setAlwaysOnTop(true);

      // Hide frame dynamically
      win.setBounds(win.getBounds()); // preserve position
      win.setBounds(win.getBounds()); // hack: force redraw
      win.setResizable(true);

      win.setBounds(win.getBounds()); // keep same size
      win.setResizable(true);
      win.setAlwaysOnTop(true);

      win.setFullScreenable(false);
      win.setMenuBarVisibility(false);
      win.setClosable(true);

      // Re-create as frameless
      win.setBounds(win.getBounds());
      win.setIgnoreMouseEvents(true);
      win.setAlwaysOnTop(true);
      win.setFullScreenable(false);
      win.setResizable(true);
      win.setMenuBarVisibility(false);

      win.setBounds(win.getBounds());
      win.setResizable(true);
      win.setMenuBarVisibility(false);

      console.log("Overlay locked: Transparent mode");
    } else {
      // Unlocked mode → normal window with title bar
      const bounds = win.getBounds();
      const url = win.webContents.getURL();

      // Destroy frameless window and recreate with frame
      win.close();
      win = new BrowserWindow({
        ...bounds,
        frame: true, // show title bar
        transparent: false,
        alwaysOnTop: false,
        resizable: true,
        skipTaskbar: false,
        webPreferences: {
          nodeIntegration: false,
        }
      });

      win.loadURL(url);

      win.on('close', () => {
        store.set('windowBounds', win.getBounds());
      });

      // Re-register F10 toggle on new window
      globalShortcut.register('F10', () => {
        locked = true;
        win.close();
        createWindow(url); // recreate frameless overlay
      });

      console.log("Overlay unlocked: Windowed mode");
    }
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
    if (!chatUrl || chatUrl.trim() === '') {
      chatUrl = 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU';
    }
    createWindow(chatUrl);
  }).catch(console.error);
});

app.on('window-all-closed', () => {
  app.quit();
});

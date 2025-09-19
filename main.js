const { app, BrowserWindow, globalShortcut } = require('electron');
const Store = require('electron-store');
const prompt = require('electron-prompt');

let win;
let locked = true;
const store = new Store();

function createWindow(chatUrl, isFrameless = true, customBounds = null) {
  // Use custom bounds if provided, otherwise use stored bounds or defaults
  const bounds = customBounds || store.get('windowBounds') || { width: 400, height: 600, x: 100, y: 100 };

  win = new BrowserWindow({
    ...bounds,
    frame: !isFrameless,
    transparent: isFrameless,
    alwaysOnTop: isFrameless,
    resizable: true,
    skipTaskbar: false,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadURL(chatUrl);

  // Show window when ready and set proper state
  win.once('ready-to-show', () => {
    win.show();
    if (isFrameless) {
      win.setIgnoreMouseEvents(true);
      win.focus(); // Ensure it's focused
    }
  });

  if (isFrameless) {
    win.setIgnoreMouseEvents(true);
  }

  // Save bounds when window is moved/resized
  win.on('close', () => {
    store.set('windowBounds', win.getBounds());
  });

  // Clean up previous shortcuts and register new one
  globalShortcut.unregisterAll();
  registerToggleShortcut(chatUrl);
}

function registerToggleShortcut(chatUrl) {
  globalShortcut.register('F10', () => {
    // Store current window state BEFORE toggling
    const currentBounds = win.getBounds();
    const currentUrl = win.webContents.getURL();
    
    locked = !locked;
    console.log(`Switching to ${locked ? 'locked (transparent)' : 'unlocked (windowed)'} mode`);

    // Remove close listener temporarily to prevent saving bounds during toggle
    win.removeAllListeners('close');
    
    // Close current window
    win.close();

    // Small delay to ensure clean transition
    setTimeout(() => {
      // Create new window with EXACT same bounds but different frame/transparency
      win = new BrowserWindow({
        x: currentBounds.x,
        y: currentBounds.y,
        width: currentBounds.width,
        height: currentBounds.height,
        frame: !locked,           // No frame when locked
        transparent: locked,      // Transparent when locked
        alwaysOnTop: locked,      // Always on top when locked
        resizable: true,
        skipTaskbar: false,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        }
      });

      win.loadURL(currentUrl);

      win.once('ready-to-show', () => {
        win.show();
        
        if (locked) {
          // In locked mode: transparent overlay, ignore mouse
          win.setIgnoreMouseEvents(true);
        } else {
          // In unlocked mode: normal window, accept mouse events
          win.setIgnoreMouseEvents(false);
          win.focus(); // Focus the window when unlocked
        }
      });

      // Re-add close handler
      win.on('close', () => {
        store.set('windowBounds', win.getBounds());
      });

      // Re-register shortcut for the new window
      globalShortcut.unregisterAll();
      registerToggleShortcut(chatUrl);

    }, 50); // Minimal delay for clean transition
  });
}

app.whenReady().then(() => {
  // Security: Prevent new window creation
  app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
      event.preventDefault();
    });
  });

  // Create a temporary window to ensure prompt appears on top
  const promptWindow = new BrowserWindow({
    width: 400,
    height: 200,
    show: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
  });

  prompt({
    title: 'Enter Chat URL',
    label: 'Chat URL:',
    value: store.get('lastChatUrl') || 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU',
    inputAttrs: {
      type: 'url'
    },
    type: 'input',
    alwaysOnTop: true,        // Force prompt to stay on top
    parent: promptWindow,     // Use our temporary window as parent
  }).then((chatUrl) => {
    promptWindow.close(); // Clean up temporary window
    
    if (!chatUrl || chatUrl.trim() === '') {
      chatUrl = 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU';
    }
    
    // Save the URL for next time
    store.set('lastChatUrl', chatUrl);
    createWindow(chatUrl, true); // Start in locked (transparent) mode
    
  }).catch((err) => {
    promptWindow.close(); // Clean up on error too
    console.error('Prompt cancelled or failed:', err);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (win) {
    win.show();
    win.focus();
  }
});

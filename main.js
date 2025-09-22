const { app, BrowserWindow, globalShortcut } = require('electron');
const Store = require('electron-store');
const prompt = require('electron-prompt');

let win;
let locked = true;
const store = new Store();

function createWindow(chatUrl, isFrameless = true, customBounds = null) {
  const bounds = customBounds || store.get('windowBounds') || { width: 400, height: 600, x: 100, y: 100 };

  win = new BrowserWindow({
    ...bounds,
    frame: !isFrameless,
    transparent: isFrameless,
    alwaysOnTop: isFrameless,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadURL(chatUrl);

  
  win.once('ready-to-show', () => {
    win.show();
    if (isFrameless) {
      win.setIgnoreMouseEvents(true);
      injectLockedModeCSS();
      win.focus();
    } else {
      injectUnlockedModeCSS();
    }
  });

  if (isFrameless) {
    win.setIgnoreMouseEvents(true);
  }

  win.on('close', () => {
    if (!win.isDestroyed()) {
      store.set('windowBounds', win.getBounds());
    }
  });

  registerWindowShortcut(chatUrl);
}

function injectLockedModeCSS() {
  const css = '::-webkit-scrollbar { display: none !important; width: 0px !important; background: transparent !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; } html, body { overflow: auto !important; scrollbar-width: none !important; -ms-overflow-style: none !important; } .scrollbar, [class*="scroll"], [id*="scroll"] { scrollbar-width: none !important; -ms-overflow-style: none !important; } .scrollbar::-webkit-scrollbar, [class*="scroll"]::-webkit-scrollbar, [id*="scroll"]::-webkit-scrollbar { display: none !important; }';

  win.webContents.insertCSS(css);
  
  const autoScrollScript = '(function() { let lastScrollHeight = 0; function scrollToBottom() { const body = document.body; const html = document.documentElement; const scrollHeight = Math.max(body.scrollHeight, html.scrollHeight); if (scrollHeight > lastScrollHeight) { window.scrollTo({ top: scrollHeight, behavior: "smooth" }); lastScrollHeight = scrollHeight; } } const scrollInterval = setInterval(scrollToBottom, 500); const observer = new MutationObserver(function(mutations) { let shouldScroll = false; mutations.forEach(function(mutation) { if (mutation.type === "childList" && mutation.addedNodes.length > 0) { shouldScroll = true; } }); if (shouldScroll) { setTimeout(scrollToBottom, 100); } }); observer.observe(document.body, { childList: true, subtree: true }); window.addEventListener("beforeunload", function() { clearInterval(scrollInterval); observer.disconnect(); }); setTimeout(scrollToBottom, 1000); })();';

  win.webContents.executeJavaScript(autoScrollScript);
}

function injectUnlockedModeCSS() {
  const css = '::-webkit-scrollbar { display: block !important; width: auto !important; } * { -ms-overflow-style: auto !important; scrollbar-width: auto !important; } html, body { overflow: auto !important; scrollbar-width: auto !important; -ms-overflow-style: auto !important; }';

  win.webContents.insertCSS(css);
}
  
  globalShortcut.unregisterAll();
  
  
  win.webContents.on('before-input-event', (event, input) => {
    // Only trigger when F10 is pressed and window is focused
    if (input.key === 'F10' && input.type === 'keyDown' && win.isFocused()) {
      event.preventDefault();
      toggleWindowMode(chatUrl);
    }
  });
}

function toggleWindowMode(chatUrl) {
  const currentBounds = win.getBounds();
  const currentUrl = win.webContents.getURL();
  
  locked = !locked;
  console.log(`Switching to ${locked ? 'locked (transparent)' : 'unlocked (windowed)'} mode`);

  const newWin = new BrowserWindow({
    x: currentBounds.x,
    y: currentBounds.y,
    width: currentBounds.width,
    height: currentBounds.height,
    frame: !locked,
    transparent: locked,
    alwaysOnTop: locked,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  newWin.loadURL(currentUrl);

  newWin.once('ready-to-show', () => {
    
    const oldWin = win;
    win = newWin; // Switch reference to new window
    
    // Show new window first
    win.show();
    
    if (locked) {
      win.setIgnoreMouseEvents(true);
      injectLockedModeCSS();
    } else {
      win.setIgnoreMouseEvents(false);
      injectUnlockedModeCSS();
      win.focus();
    }

    
    win.on('close', () => {
      if (!win.isDestroyed()) {
        store.set('windowBounds', win.getBounds());
      }
    });

    
    registerWindowShortcut(chatUrl);

    
    oldWin.removeAllListeners('close'); // Prevent saving bounds
    oldWin.close();
  });
}

app.whenReady().then(() => {
  app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
      event.preventDefault();
    });
  });

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
    alwaysOnTop: true,
    parent: promptWindow,
  }).then((chatUrl) => {
    promptWindow.close();
    
    if (!chatUrl || chatUrl.trim() === '') {
      chatUrl = 'https://multichat.livepush.io/mcSprPsAwsSs0D2XU';
    }
    
    store.set('lastChatUrl', chatUrl);
    createWindow(chatUrl, true);
    
  }).catch((err) => {
    promptWindow.close();
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
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
  }
});

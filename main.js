const { app, BrowserWindow, Menu, Tray, globalShortcut } = require('electron')

let win, tray

app.on('ready', ready)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }

  globalShortcut.unregister('CommandOrControl+`')
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (!win) {
    createWindow()
  }
})

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    resizable: false,
  })

  win.setMenu(null)

  win.loadFile('index.html')

  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

function createTray() {
  tray = new Tray('./assets/tray.png')

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })

  win.on('show', () => {
    tray.setHighlightMode('always')
  })
  win.on('hide', () => {
    tray.setHighlightMode('never')
  })
}

function createGlobalShortcut() {
  if (globalShortcut.isRegistered('CommandOrControl+`')) return

  const ret = globalShortcut.register('CommandOrControl+`', () => {
    win.isVisible() ? win.hide() : win.show()
  })

  if (!ret) {
    console.log('registration failed')
  }
}

function ready() {
  createWindow()
  createTray()
  createGlobalShortcut()
}

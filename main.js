const path = require('path')
const { app, BrowserWindow, Menu, Tray, globalShortcut } = require('electron')
const url = require('url')

if (process.env.ELECTRON_START_URL) {
  require('electron-reload')(__dirname)
}

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

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './build/index.html'),
    protocol: 'file:',
    slashes: true
  })

  console.log(startUrl)

  win.loadURL(startUrl)

  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

function createTray() {
  tray = new Tray(path.join(__dirname, './build//assets/tray.png'))

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

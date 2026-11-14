'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('solat', {
  init: function () { return ipcRenderer.invoke('solat:init') },
  refresh: function () { return ipcRenderer.invoke('solat:refresh') },
  setZone: function (code) { return ipcRenderer.invoke('solat:setZone', code) },
  detect: function () { return ipcRenderer.invoke('solat:detect') },
  setPref: function (pref) { return ipcRenderer.invoke('solat:setPref', pref) },
  openExternal: function (url) { return ipcRenderer.invoke('solat:openExternal', url) },
  hide: function () { ipcRenderer.send('solat:hide') },
  quit: function () { ipcRenderer.send('solat:quit') },
  onUpdate: function (callback) {
    const listener = function (_event, payload) { callback(payload) }
    ipcRenderer.on('solat:update', listener)
    return function () { ipcRenderer.removeListener('solat:update', listener) }
  }
})

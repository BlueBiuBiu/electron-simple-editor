import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  once(...args: Parameters<typeof ipcRenderer.once>) {
    const [channel, listener] = args;
    ipcRenderer.once(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    ipcRenderer.invoke(channel, ...omit);
  },
  removeAllListeners(
    ...args: Parameters<typeof ipcRenderer.removeAllListeners>
  ) {
    const [channel] = args;
    ipcRenderer.removeAllListeners(channel);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("darkMode", {
  toggle: () => ipcRenderer.invoke("dark-mode:toggle"),
  system: () => ipcRenderer.invoke("dark-mode:system"),
});

contextBridge.exposeInMainWorld("app", {
  setStoreData: (key: string, value: any) =>
    ipcRenderer.invoke("set-store-data", key, value),
  getStoreData: (key: string) => ipcRenderer.invoke("get-store-data", key),
  deleteKeyData: (key: string) => ipcRenderer.invoke("delete-key-data", key),
  isFile: (path: string) => ipcRenderer.invoke("is-file", path),
  getFileContent: (path: string) =>
    ipcRenderer.invoke("get-file-content", path),
});

contextBridge.exposeInMainWorld("clipboard", {
  writeText: (value: string) =>
    ipcRenderer.invoke("clipboard-write-text", value),
  readText: (value: string) => ipcRenderer.invoke("clipboard-read-text", value),
});

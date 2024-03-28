import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from "electron";
import path from "node:path";
import os from "node:os";
import {
  dirContextMenuTemplate,
  fileContextMenuTemplate,
  template,
} from "./config/menu-template";
import "./register-event";
import "./store/index";

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;

const VITE_DEV_SERVER_URL =
  process.env["VITE_DEV_SERVER_URL"] ?? "http://192.168.2.246:10015/";

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    // show: false,
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(win.webContents);

  win.setRepresentedFilename(os.homedir());
  win.setDocumentEdited(true);
  win.loadURL(VITE_DEV_SERVER_URL);

  if (process.env.NODE_ENV === "development") {
    // win.webContents.openDevTools();
  }

  // 左上角菜单栏
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 右键菜单
  ipcMain.on("contextMenu", (event, item: string) => {
    console.log("item", item);
    const data = JSON.parse(item) as { mode: "file" | "dir" };
    let contextMenu;
    if (data.mode === "file") {
      contextMenu = Menu.buildFromTemplate(fileContextMenuTemplate);
    } else if (data.mode === "dir") {
      contextMenu = Menu.buildFromTemplate(dirContextMenuTemplate);
    }

    contextMenu!.popup({ window: BrowserWindow.getFocusedWindow()! });
  });

  // 默认暗夜模式
  nativeTheme.themeSource = "dark";
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

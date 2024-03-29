import { BrowserWindow, Menu, clipboard, nativeTheme } from "electron";
import {
  createFileOrDirOnDir,
  deleteFileOrDirectory,
  openDir,
  pasteFileOrDirectory,
  renameFileOrDirectory,
} from "./config/menu-operate";

const { dialog, ipcMain } = require("electron");
const fs = require("node:fs");

// 打开文件夹
ipcMain.on("open-directory-dialog", async () => {
  openDir();
});

// 在文件夹中点击Enter后创建文件
ipcMain.on("confirm-create-file", (event: any, newData: any) => {
  console.log("confirm-create-file");

  let filepath = newData.parentPath;
  const fileFullPath = `${filepath}\\${newData.filename}`;

  createFileOrDirOnDir(filepath, fileFullPath, "file");
});

// 在文件夹中点击Enter后创建文件夹
ipcMain.on("confirm-create-dir", (event: any, newData: any) => {
  console.log("confirm-create-dir");

  let filepath = newData.parentPath;
  const fileFullPath = `${filepath}\\${newData.filename}`;

  createFileOrDirOnDir(filepath, fileFullPath, "dir");
});

// 重命名点击确认或者Enter
ipcMain.on("confirm-rename", (event: any, newData: any) => {
  console.log("confirm-rename");

  renameFileOrDirectory(newData);
});

// 删除点击确认或者Enter
ipcMain.on("confirm-delete", (event: any, newData: any) => {
  console.log("confirm-delete");

  deleteFileOrDirectory(newData);
});

// 删除点击确认或者Enter
ipcMain.on("confirm-paste", (event: any, newData: any) => {
  pasteFileOrDirectory(newData);
});

// 暗夜模式切换
ipcMain.handle("dark-mode:toggle", () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = "light";
  } else {
    nativeTheme.themeSource = "dark";
  }
  return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle("dark-mode:system", () => {
  nativeTheme.themeSource = "system";
});

// 复制信息到粘贴板
ipcMain.handle("clipboard-write-text", (event: any, value: string) => {
  clipboard.writeText(value);
});

// 复制信息到粘贴板
ipcMain.handle("clipboard-read-text", (event: any) => {
  clipboard.readText();
});

// 是否是文件
ipcMain.handle("is-file", (event: any, path: string) => {
  const stats = fs.statSync(path);
  return stats.isFile();
});

// 读取文件内容
ipcMain.handle("get-file-content", async (event: any, path: string) => {
  const fileContent = await fs.readFileSync(path, "utf8");
  return fileContent;
});

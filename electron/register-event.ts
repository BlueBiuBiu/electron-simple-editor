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

  const data = JSON.parse(newData);
  let filepath = data.parentPath;
  const fileFullPath = `${filepath}\\${data.filename}`;

  createFileOrDirOnDir(filepath, fileFullPath, "file");
});

// 在文件夹中点击Enter后创建文件夹
ipcMain.on("confirm-create-dir", (event: any, newData: any) => {
  console.log("confirm-create-dir");

  const data = JSON.parse(newData);
  let filepath = data.parentPath;
  const fileFullPath = `${filepath}\\${data.filename}`;

  createFileOrDirOnDir(filepath, fileFullPath, "dir");
});

// 重命名点击确认或者Enter
ipcMain.on("confirm-rename", (event: any, newData: any) => {
  console.log("confirm-rename");

  const data = JSON.parse(newData);
  renameFileOrDirectory(data);
});

// 删除点击确认或者Enter
ipcMain.on("confirm-delete", (event: any, newData: any) => {
  console.log("confirm-delete");

  const data = JSON.parse(newData);
  deleteFileOrDirectory(data);
});

// 删除点击确认或者Enter
ipcMain.on("confirm-paste", (event: any, newData: any) => {
  console.log("confirm-paste");

  const data = JSON.parse(newData);
  pasteFileOrDirectory(data);
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

import {
  app,
  BrowserWindow,
  dialog,
  shell,
  MessageBoxOptions,
  MenuItemConstructorOptions,
  ipcMain,
} from "electron";
import { marked } from "marked";
import fs from "node:fs";
import { exec } from "child_process";
import path from "node:path";
import store from "../store";
import { rimrafSync } from "rimraf";

/**
 * 重新打开文件夹
 */
export async function reOpenDir(folderPath: string) {
  const files = await getFolderContent(folderPath);
  BrowserWindow.getFocusedWindow()!.webContents.send(
    "selected-directory",
    JSON.stringify({
      folderPath: folderPath,
      files,
    })
  );
}

/**
 * 目录数据存储到本地磁盘
 */
export async function saveMenu() {
  const menu = JSON.parse(store.get("menu") as string);
  const files = await getFolderContent(menu[0].path);
  const tempArr = menu[0].path.split("\\");
  const root = {
    name: tempArr[tempArr.length - 1].toLocaleUpperCase(),
    path: menu[0].path,
  };

  store.set("menu", JSON.stringify([{ ...root, children: files }]));
}

/**
 * 新建文件
 */
export function createFile() {
  const menu = JSON.parse(store.get("menu") as string);
  const defaultPath = !menu.length ? app.getPath("home") : menu[0].path;

  dialog
    .showSaveDialog({
      defaultPath: path.join(defaultPath, ""),
    })
    .then(async (result) => {
      if (!result.canceled && result.filePath) {
        const filePath = result.filePath;
        fs.writeFileSync(filePath, "", "utf-8");
        reOpenDir(menu[0].path);
      }
    });
}

/**
 * 在对应文件夹下新建文件
 * filePath: 文件夹路径
 * fileFullPath： 拼接了文件的路径
 */
export async function createFileOrDirOnDir(
  filePath: string,
  fileFullPath: string,
  createMode: "file" | "dir"
) {
  console.log("filePath", filePath, fileFullPath);

  if (createMode === "file") fs.writeFileSync(fileFullPath, "", "utf-8");
  if (createMode === "dir") fs.mkdirSync(fileFullPath);
  saveMenu();
}

/**
 * 打开文件
 */
export function openFile() {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "All Files", extensions: ["*"] }],
    })
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];
        // 在这里处理打开文件的逻辑，比如读取文件内容等操作
        // console.log(`打开文件：${filePath}`);
        fs.readFile(filePath, "utf8", async (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          BrowserWindow.getFocusedWindow()!.webContents.send(
            "disMarkdown",
            marked(data)
          );
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

/**
 * 打开文件夹
 */
async function getFolderContent(folderPath: string) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = `${folderPath}\\${entry.name}`;
    entry.path = fullPath;
    if (entry.isDirectory()) {
      (entry as any).children = [];
      const childEntries = await getFolderContent(fullPath);
      (entry as any).children = childEntries;
    }
  }

  return entries;
}

export async function openDir() {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    const folderPath = result.filePaths[0];
    console.log("folderPath", folderPath);
    reOpenDir(folderPath);
  }
}

/**
 * 在资源文件中打开
 */
export function openInExplorer() {
  let path = store.get("path") as string;
  path = JSON.parse(path);
  console.log("path", path);

  if (process.platform === "win32") {
    // Windows 平台下使用 explorer 命令打开资源管理器
    exec(`explorer "${path}"`);
  } else if (process.platform === "darwin") {
    // macOS 平台下使用 open 命令打开 Finder
    exec(`open "${path}"`);
  } else {
    // 其他平台下使用 xdg-open 命令打开文件管理器
    exec(`xdg-open "${path}"`);
  }
}

/**
 * 重命名文件或文件夹
 */
export function renameFileOrDirectory(data: { newName: string; path: string }) {
  const oldPath = data.path;
  const newDirPath = path.dirname(oldPath);
  const newPath = `${newDirPath}\\${data.newName}`;
  console.log(oldPath, newPath);

  fs.renameSync(oldPath, newPath);
  BrowserWindow.getFocusedWindow()!.webContents.send("finishRename");
  saveMenu();
}

/**
 * 删除文件或文件夹
 */
export function deleteFileOrDirectory(data: { path: string }) {
  console.log("data", data);

  rimrafSync(data.path);
  BrowserWindow.getFocusedWindow()!.webContents.send("finishDelete");
  saveMenu();
}

/**
 * 粘贴文件或文件夹
 */

function copyFolderRecursiveSync(source: string, target: string) {
  let files = [];
  // 读取源文件夹中的所有文件/文件夹
  files = fs.readdirSync(source);

  files.forEach(function (file) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);

    if (fs.lstatSync(curSource).isDirectory()) {
      // 如果是文件夹，则递归复制
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      // 如果是文件，则直接复制
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

export function pasteFileOrDirectory(data: { pastePath: string }) {
  const copyPath = store.get("copy-path")
    ? JSON.parse(store.get("copy-path") as string)
    : "";
  const cutPath = store.get("cut-path")
    ? JSON.parse(store.get("cut-path") as string)
    : "";
  if (!copyPath && !cutPath) return;
  const isCopy = copyPath ? true : false; // 是否是复制

  const pastePath = data.pastePath;
  console.log("copyPath", copyPath, pastePath);
  console.log("cutPath", cutPath, pastePath);

  const pathValue = isCopy ? copyPath : cutPath;

  const tempArr = pathValue.split("\\");
  const dirname = tempArr[tempArr.length - 1];
  const newFullPath = `${pastePath}\\${dirname}`;
  console.log("newFullPath", dirname, newFullPath);

  const stats = fs.statSync(pathValue);
  if (!stats.isFile()) {
    if (!fs.existsSync(newFullPath)) {
      fs.mkdirSync(newFullPath);
    }
    copyFolderRecursiveSync(pathValue, newFullPath);
  } else {
    fs.copyFileSync(pathValue, newFullPath);
  }

  if (!isCopy) {
    // 剪切模式, 删掉原文件
    rimrafSync(pathValue);
    store.delete("cut-path");
  } else {
    store.delete("copy-path");
  }

  BrowserWindow.getFocusedWindow()!.webContents.send("finishPaste", { isCopy });
  saveMenu();
}

/**
 * 保存文件
 */
export function saveFile() {}

/**
 * 切换黑夜/亮色模式
 */
export async function toggleMode() {
  BrowserWindow.getFocusedWindow()!.webContents.send("toggleMode");
}

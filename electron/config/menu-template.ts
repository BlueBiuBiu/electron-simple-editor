import {
  app,
  BrowserWindow,
  dialog,
  shell,
  MessageBoxOptions,
  MenuItemConstructorOptions,
} from "electron";
import {
  createFile,
  openDir,
  openFile,
  openInExplorer,
  saveFile,
  toggleMode,
} from "./menu-operate";

// 左上角窗口模板
export const template: MenuItemConstructorOptions[] = [
  {
    label: "文件",
    submenu: [
      {
        label: "新建文件",
        accelerator: "CommandOrControl+Alt+Super+N",
        click: () => {
          createFile();
        },
      },
      {
        label: "打开文件",
        accelerator: "Ctrl+O",
        click() {
          openFile();
        },
      },
      {
        label: "打开文件夹",
        accelerator: "Ctrl+K",
        click() {
          openDir();
        },
      },
      {
        accelerator: "Ctrl+S",
        label: "保存",
        click: function () {
          saveFile();
        },
      },
      {
        label: "打印",
        accelerator: "Ctrl+P",
        enabled: false,
        click: function () {
          //打印功能通过 webContents  https://electronjs.org/docs/api/web-contents
          BrowserWindow.getFocusedWindow()!.webContents.print();
        },
      },
    ],
  },
  {
    label: "编辑",
    submenu: [
      { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
      { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
      { type: "separator" },
      { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
      { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
      { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
      { label: "全选", accelerator: "CmdOrCtrl+A", role: "selectAll" },
    ],
  },
  {
    label: "查看",
    submenu: [
      {
        label: "重载",
        accelerator: "CmdOrCtrl+R",
        click(item, focusedWindow) {
          if (focusedWindow) {
            if (focusedWindow.id === 1) {
              BrowserWindow.getAllWindows().forEach((win) => {
                if (win.id > 1) {
                  win.close();
                }
              });
            }
            focusedWindow.reload();
          }
        },
      },
      {
        label: "切换全屏",
        accelerator: (() => {
          if (process.platform === "darwin") {
            return "Ctrl+Command+F";
          } else {
            return "F11";
          }
        })(),
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        },
      },
      {
        label: "切换开发者工具",
        accelerator: (() => {
          if (process.platform === "darwin") {
            return "Alt+Command+I";
          } else {
            return "Ctrl+Shift+I";
          }
        })(),
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          }
        },
      },
      { type: "separator" },
      {
        label: "应用程序菜单演示",
        click(item, focusedWindow) {
          if (focusedWindow) {
            const options: MessageBoxOptions = {
              type: "info",
              title: "应用程序菜单演示",
              buttons: ["好的"],
              message:
                '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.',
            };
            dialog.showMessageBox(focusedWindow, options);
          }
        },
      },
    ],
  },
  {
    label: "窗口",
    role: "window",
    submenu: [
      { label: "最小化", accelerator: "CmdOrCtrl+M", role: "minimize" },
      { label: "关闭", accelerator: "CmdOrCtrl+W", role: "close" },
      { type: "separator" },
      {
        label: "重新打开窗口",
        accelerator: "CmdOrCtrl+Shift+T",
        enabled: false,
        click() {
          app.emit("activate");
        },
      },
      { type: "separator" },
      {
        label: "切换黑夜/亮色模式",
        enabled: false,
        click() {
          toggleMode();
        },
      },
    ],
  },
  {
    label: "帮助",
    role: "help",
    submenu: [
      {
        label: "学习更多",
        click() {
          shell.openExternal("http://electron.atom.io");
        },
      },
    ],
  },
];

// 文件夹右键菜单
export const dirContextMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "新建文件",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("createFileOnDir");
    },
  },
  {
    label: "新建文件夹",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("createDir");
    },
  },
  {
    label: "在文件资源管理器中打开",
    accelerator: "Shift+Alt+R",
    click: () => {
      openInExplorer();
    },
  },
  { type: "separator" },
  {
    label: "剪切",
    accelerator: "CmdOrCtrl+X",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("cutFileOrDir");
    },
  },
  {
    label: "复制",
    accelerator: "CmdOrCtrl+C",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("copyFileOrDir");
    },
  },
  {
    label: "粘贴",
    accelerator: "CmdOrCtrl+V",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("pasteFileOrDir");
    },
  },
  { type: "separator" },
  {
    label: "重命名",
    accelerator: "F2",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("renameFileOrDir");
    },
  },
  {
    label: "删除",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("deleteFileOrDir");
    },
  },
];

// 文件右键菜单
export const fileContextMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "在文件资源管理器中打开",
    accelerator: "Shift+Alt+R",
    click: () => {
      openInExplorer();
    },
  },
  { type: "separator" },
  {
    label: "剪切",
    accelerator: "CmdOrCtrl+X",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("cutFileOrDir");
    },
  },
  {
    label: "复制",
    accelerator: "CmdOrCtrl+C",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("copyFileOrDir");
    },
  },
  { type: "separator" },
  {
    label: "重命名",
    accelerator: "F2",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("renameFileOrDir");
    },
  },
  {
    label: "删除",
    click: () => {
      BrowserWindow.getFocusedWindow()!.webContents.send("deleteFileOrDir");
    },
  },
];

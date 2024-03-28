import { ipcMain } from "electron";
import Store from "electron-store";

export interface IMenu {
  path: string;
  name: string;
  children?: IMenu[];
}
const store = new Store();

// 存储数据
ipcMain.handle("set-store-data", (event: any, key: string, value: any) => {
  store.set(key, value);
});

// 读取数据
ipcMain.handle("get-store-data", (event: any, key: string) => {
  const value = store.get(key);
  return value;
});

export default store;

import { defineStore } from "pinia";
import * as monaco from "monaco-editor";

interface ITavNavItem {
  path: string;
  name: string;
}

interface ITabNavState {
  tabNavArr: ITavNavItem[];
  activeTab: string;
  rootDir: string;
  breadcrumb: string[];
  editor: any;
}

enum closeType {
  "SELF",
  "LEFT",
  "RIGHT",
  "OTHER",
}

export const useTabNavStore = defineStore("tabNavAction", {
  state: (): ITabNavState => ({
    tabNavArr: [],
    activeTab: "",
    rootDir: "",
    breadcrumb: [],
    editor: null,
  }),
  getters: {},
  actions: {
    async addNav(payload: ITavNavItem) {
      const isFile = await window.app.isFile(payload.path);
      if (!isFile) return;

      // 点击左侧菜单栏添加标签栏
      const { path, name } = payload;
      this.activeTab = path;
      const index = this.tabNavArr.findIndex((item) => item.path === path);
      // 没有时才可以往标签栏添加
      if (index === -1) {
        this.tabNavArr.push({ path, name });
      }

      this.computeBreadcrumb();
    },
    delNav(payload: ITavNavItem) {
      // 点击图标x(叉)号
      const { path } = payload;
      const index = this.tabNavArr.findIndex((item) => item.path === path);
      this.tabNavArr.splice(index, 1);
    },
    closeOther(path: string, type: closeType) {
      // 菜单栏操作 (关闭 | 关闭其他 | 关闭左侧 | 关闭右侧)
      const index = this.tabNavArr.findIndex((item) => item.path === path);
      const lenght = this.tabNavArr.length;

      switch (type) {
        case closeType.SELF:
          this.tabNavArr.splice(index, 1);
          break;
        case closeType.OTHER:
          this.tabNavArr = this.tabNavArr.slice(index, index + 1);
          break;
        case closeType.LEFT:
          this.tabNavArr.splice(0, index);
          break;
        case closeType.RIGHT:
          this.tabNavArr.splice(index + 1, lenght - 1);
          break;
      }
    },
    async computeBreadcrumb() {
      // 计算面包屑展示的路径
      if (!this.rootDir) {
        const menu = await window.app.getStoreData("menu");
        const root = JSON.parse(menu)[0].path;
        this.rootDir = root;
      }
      this.breadcrumb = this.findDifferentPath(this.rootDir, this.activeTab);
      this.displayFile(this.activeTab);
    },
    findDifferentPath(rootPath: string, currentPath: string) {
      const diff = currentPath.slice(rootPath.length);
      return diff.split("\\").filter(Boolean);
    },
    async displayFile(path: string) {
      const fileContent = await window.app.getFileContent(path);
      console.log("fileContent", monaco.editor);
      monaco.editor.create(document.getElementById("container")!, {
        value: fileContent,
        language: "vue",
        theme: "vs-dark",
      });
    },
  },
  persist: {
    // storage: localStorage,
    // paths: ["tabNavArr"],
  },
});

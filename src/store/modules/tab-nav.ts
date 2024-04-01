import { defineStore } from "pinia";
import * as monaco from "monaco-editor";
import { toRaw } from "vue";
import { IFileType, fileTypeMap } from "../../utils/file-type-map";

interface ITavNavItem {
  path: string;
  name?: string;
  isEdit: boolean;
  oldContent: string;
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
        this.tabNavArr.push({ path, name, isEdit: false, oldContent: "" });
      }

      this.computeBreadcrumb();
    },
    delNav(index: number) {
      // 点击图标x(叉)号
      console.log("index", index);
      if (index === this.tabNavArr.length - 1 && index > 0) {
        this.activeTab = this.tabNavArr[index - 1].path;
      } else if (index === 0) {
        this.activeTab = "";
        this.tabNavArr.splice(index, 1);
        console.log("this.tabNavArr", this.tabNavArr);

        return;
      } else {
        this.activeTab = this.tabNavArr[index + 1].path;
      }

      this.tabNavArr.splice(index, 1);
      this.computeBreadcrumb();
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
    initEditor() {
      // 初始化编辑器
      this.editor = monaco.editor.create(document.getElementById("container"), {
        language: "", //语言支持自行查阅demo
        theme: "vs-dark", //官方自带三种主题vs, hc-black, or vs-dark
        selectOnLineNumbers: true, //显示行号
        roundedSelection: false,
        readOnly: false, // 只读
        cursorStyle: "line", //光标样式
        automaticLayout: false, //自动布局
        glyphMargin: true, //字形边缘
        useTabStops: false,
        fontSize: 14, //字体大小
        autoIndent: true, //自动布局
        quickSuggestionsDelay: 500, //代码提示延时

        locale: "zh-cn",
      });

      // 默认打开最后点开的一个文件
      if (this.activeTab) this.displayFile(this.activeTab);

      //监听文件的修改
      const editor = toRaw(this.editor);
      editor.onKeyUp(() => {
        const matchFile = this.tabNavArr.filter(
          (item) => item.path === this.activeTab
        );

        if (matchFile.length && editor.getValue() !== matchFile[0].oldContent) {
          matchFile[0].isEdit = true;
        } else {
          matchFile[0].isEdit = false;
        }
      });
    },
    disposeEditor() {
      const editor = toRaw(this.editor);
      editor.getModel().dispose();
    },
    async displayFile(path: string) {
      // 显示路径对应的文件

      // 查询出匹配的数据
      const matchFile = this.tabNavArr.find(
        (item) => item.path === this.activeTab
      );
      if (!matchFile) return;
      if (!matchFile.oldContent && !matchFile.isEdit) {
        // 如果没存储过文件则存储一次在对应的字段中
        const fileContent = await window.app.getFileContent(path);
        matchFile.oldContent = fileContent;
      }

      const tempArr = path.split(".");
      const fileType = tempArr[tempArr.length - 1];
      const editor = toRaw(this.editor);
      monaco.editor.setModelLanguage(
        editor.getModel(),
        fileTypeMap(fileType as keyof IFileType)
      );

      editor.getModel().setValue(matchFile.oldContent);
    },
    saveFile() {
      // 编辑后保存文件
      console.log("save");
      const editor = toRaw(this.editor);
      const newContent = editor.getValue();
      const matchFile = this.tabNavArr.find(
        (item) => item.path === this.activeTab
      );

      if (matchFile && editor.getValue() !== matchFile.oldContent) {
        matchFile.isEdit = false;
        matchFile.oldContent = newContent;
        window.app.saveFileContent(this.activeTab, newContent);
      }
    },
  },
  persist: {
    storage: localStorage,
    paths: ["tabNavArr", "activeTab"],
  },
});

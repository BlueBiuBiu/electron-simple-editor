<template>
  <el-container>
    <el-aside class="side">
      <el-button
        v-if="!menu.length"
        class="open-dir"
        type="primary"
        @click="openDir"
        >打开文件夹
      </el-button>
      <Menu v-else :data="menu" />
    </el-aside>
    <div class="content">
      <tabNav v-if="tabNavStore.tabNavArr.length" />
      <el-main>
        <div
          :class="[
            'no-data',
            { 'show-no-data': !tabNavStore.tabNavArr.length },
          ]"
        >
          <img :src="NoDataBG" />
        </div>
        <div id="container"></div>
      </el-main>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Menu from "./components/menu/index.vue";
import TabNav from "./components/tab-nav-m/index.vue";
import { useTabNavStore } from "./store/modules/tab-nav";
import NoDataBG from "./assets/imgs/logo.png";

export interface IMenu {
  path: string;
  name: string;
  children?: IMenu[];
}

const menu = ref<IMenu[]>([]);
const tabNavStore = useTabNavStore();

const openDir = () => {
  window.ipcRenderer.send("open-directory-dialog");
};

// 监听选择文件夹后
window.ipcRenderer.on("selected-directory", (event: any, data: any) => {
  const { folderPath, files } = JSON.parse(data) as {
    folderPath: string;
    files: Exclude<IMenu, "children">[];
  };
  console.log("data", folderPath, files);
  // 重置pinia除编辑器外的其他所有数据
  tabNavStore.$reset();
  tabNavStore.disposeEditor();
  tabNavStore.initEditor();

  const tempArr = folderPath.split("\\");
  const root = {
    name: tempArr[tempArr.length - 1].toLocaleUpperCase(),
    path: folderPath,
  };
  menu.value = [{ ...root, children: files }];

  // 数据存储到本地磁盘
  window.app.setStoreData("menu", JSON.stringify(menu.value));
});

// 暗夜模式/亮色模式切换
window.ipcRenderer.on("toggleMode", async () => {
  const isDarkMode = await window.darkMode.toggle();
  console.log(isDarkMode);
});

onMounted(async () => {
  const res = await window.app.getStoreData("menu");
  if (res) {
    menu.value = JSON.parse(res);
  }
  // 初始化编辑器
  tabNavStore.initEditor();
});
</script>

<style lang="less" scoped>
.side {
  display: flex;
  width: 340px;
  height: 100vh;
  justify-content: center;
  background-color: #181818;
  .open-dir {
    width: 100%;
    margin: 15px 15px 0;
  }
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
  #container {
    width: 100%;
    height: 100%;
  }

  .no-data {
    width: 100%;
    height: 100%;
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
  .show-no-data {
    z-index: 999;
    background-color: #1e1e1e;
  }
}

:deep(.el-main) {
  padding: 0;
  height: calc(100% - 68px);
}
</style>

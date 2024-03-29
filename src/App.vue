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
      <tabNav />
      <el-main>
        <div id="container"></div>
      </el-main>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Menu from "./components/menu/index.vue";
import TabNav from "./components/tab-nav-m/index.vue";

export interface IMenu {
  path: string;
  name: string;
  children?: IMenu[];
}

const menu = ref<IMenu[]>([]);

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
  #container {
    width: 100%;
    height: 100%;
  }
}

:deep(.el-main) {
  padding: 0;
}
</style>

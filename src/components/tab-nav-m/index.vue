<template>
  <div class="tab-nav">
    <el-tabs
      :model-value="currentTab"
      type="border-card"
      @tab-click="tabClick"
      @click.right="rightClick"
    >
      <el-tab-pane
        v-for="(tab, index) in tabData"
        :key="tab.path"
        :name="tab.path"
      >
        <template #label>
          <span class="content" :id="tab.path">
            <i :class="['type-icon', icons.getClassWithColor(tab.name)]"></i>
            <span>{{ tab.name }}</span>
            <Close
              class="icon"
              v-if="!tab.isEdit"
              @click.stop="closeFile(index)"
            />
            <EditDot class="icon" v-else />
          </span>
        </template>
      </el-tab-pane>
      <TabCard :status="status" :PX="PX" :PY="PY" :list="menuRef" />
    </el-tabs>
    <el-breadcrumb class="breadcrumb" :separator-icon="ArrowRight">
      <el-breadcrumb-item v-for="item in breadcrumb" :key="item"
        >{{ item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTabNavStore } from "../../store/modules/tab-nav";
import type { TabsPaneContext } from "element-plus";
import TabCard from "../tab-card/index.vue";
import ArrowRight from "../icons/right.vue";
import Close from "../icons/close.vue";
import EditDot from "../icons/dot.vue";

/* ts类型定义区域 */
interface MenuType {
  label: string;
  callback: () => void;
}

enum closeType {
  "SELF",
  "LEFT",
  "RIGHT",
  "OTHER",
}
/* 定义数据区域 */
//@ts-ignore
const icons = window.FileIcons;

const tabNavStore = useTabNavStore();
const tabData = computed(() => tabNavStore.tabNavArr);
const currentTab = computed(() => tabNavStore.activeTab); // 当前活跃的标签
const breadcrumb = computed(() => tabNavStore.breadcrumb); // 面包屑路径数组

// 右键菜单栏
const menuRef = ref<MenuType[]>(); //右键列表
const status = ref<boolean>(false); //右键菜单是否显示
const PX = ref<number>(0); //右键对应的位置
const PY = ref<number>(0);

/* 事件处理区域 */
// 点击标签删除图标时
const closeFile = (index: number) => {
  tabNavStore.delNav(index);
};

// 点击标签
const tabClick = (item: TabsPaneContext) => {
  tabNavStore.activeTab = item.paneName as string;
  tabNavStore.computeBreadcrumb();
};

// 鼠标右键点击
const rightClick = (event: MouseEvent) => {
  const path = (event.target as HTMLElement).parentElement!.id;

  event.preventDefault();
  PX.value = event.clientX;
  PY.value = event.clientY;
  status.value = true;

  menuRef.value = [
    {
      label: "关闭",
      callback: () => {
        tabNavStore.closeOther(path, closeType.SELF);
      },
    },
    {
      label: "关闭其他",
      callback: () => {
        tabNavStore.closeOther(path, closeType.OTHER);
      },
    },
    {
      label: "关闭右侧",
      callback: () => {
        tabNavStore.closeOther(path, closeType.RIGHT);
      },
    },
    {
      label: "关闭左侧",
      callback: () => {
        tabNavStore.closeOther(path, closeType.LEFT);
      },
    },
  ];
};

const switchMenuStatus = () => {
  status.value = false;
};
/* 监听 */
window.ipcRenderer.on("saveFile", () => {
  tabNavStore.saveFile();
});

/* 生命周期 */
onMounted(() => {
  window.addEventListener("click", switchMenuStatus);
});

onUnmounted(() => {
  window.removeEventListener("click", switchMenuStatus);
});
</script>

<style lang="less" scoped>
.tab-nav {
  .content {
    display: flex;
    align-items: center;
    .type-icon {
      font-style: normal;
      margin-right: 6px;

      &::before {
        font-size: 14px;
      }
    }

    .icon {
      width: 20px;
      height: 20px;
      font-weight: bold;
      margin-left: 5px;
    }
  }

  .breadcrumb {
    padding: 8px;
    font-size: 12px;
    background-color: #1e1e1e;
  }

  :deep(.el-breadcrumb__inner) {
    color: #aeafad;
  }

  :deep(.el-tabs--border-card) {
    border-bottom: none;
  }

  :deep(.el-tabs__content) {
    display: none;
  }

  :deep(.el-tabs__item) {
    border-right: 1px solid var(--el-border-color);
  }

  :deep(.el-tabs__item) {
    &.is-active {
      border-top: 2px solid var(--el-color-primary);
    }
  }
}
</style>

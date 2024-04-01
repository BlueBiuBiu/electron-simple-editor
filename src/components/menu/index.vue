<template>
  <div class="menu">
    <el-tree
      node-key="path"
      :default-expanded-keys="[data[0].path]"
      ref="treeRef"
      class="filter-tree"
      :data="currentData"
      :props="defaultProps"
      @node-click="nodeClick"
      @node-collapse="nodeCollapse"
      @node-contextmenu="nodeContextmenu"
    >
      <template #default="{ node }">
        <span class="custom-tree-node">
          <span v-if="node.label">
            <i :class="['type-icon', icons.getClassWithColor(node.label)]"></i>
            {{ node.label }}
          </span>
          <span v-else>
            <el-input
              size="small"
              v-model="editNode"
              @keyup.enter="handleEnter(node)"
          /></span>
        </span>
      </template>
    </el-tree>
  </div>

  <!-- 重命名确定框 -->
  <el-dialog
    v-model="renameDialogVisible"
    title="重命名"
    width="350"
    top="25vh"
  >
    <el-input size="small" v-model="renameValue" @keyup.enter="confirmRename" />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 删除确认框 -->
  <el-dialog
    v-model="deleteDialogVisible"
    title="删除确认"
    width="350"
    top="25vh"
  >
    <div>您确定要删除“{{ deleteValue }}” ?</div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          v-confirmKeyup="confirmDelete"
          @click="confirmDelete"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, toRaw } from "vue";
import { useTabNavStore } from "../../store/modules/tab-nav";

const defaultProps = {
  children: "children",
  label: "name",
};

const props = defineProps<{ data: any }>();
const tabNavStore = useTabNavStore();
const currentData = ref();
const editNode = ref(""); // 当前输入框的值
const currentNodeData = ref(); // 当前操作的节点
const cutOrCopyNodeData = ref(); // 当前剪切的节点
const editMode = ref<"createFile" | "createDir">("createFile");
const renameDialogVisible = ref(false);
const renameValue = ref(""); // 重命名的值
const renamePath = ref(""); // 重命名的原本路径
const deleteDialogVisible = ref(false);
const deleteValue = ref(""); // 删除的值
const deletePath = ref(""); // 删除的路径

//@ts-ignore
const icons = window.FileIcons;
// console.log(icons.getClassWithColor("README.md")); // 获取对应图标的class类名

const nodeClick = async (node: { name: string; path: string }) => {
  tabNavStore.addNav(node);
};

const nodeCollapse = () => {
  if (currentNodeData.value && currentNodeData.value.children) {
    currentNodeData.value.children = currentNodeData.value.children.filter(
      (item: any) => item.name !== ""
    );
  }
};

const createFileOrDir = (
  data: any,
  node: any,
  mode: "createFile" | "createDir"
) => {
  console.log("mode", mode);

  editMode.value = mode;
  node.expand();
  const newChild =
    mode === "createFile"
      ? { name: "", path: "" }
      : { name: "", path: "", children: [] };
  data.children = data.children.filter((item: any) => item.name !== "");
  data.children.unshift(newChild);
  currentNodeData.value = data;
};

const nodeContextmenu = (event: any, data: any, node: any) => {
  event.preventDefault();
  nodeCollapse();

  window.ipcRenderer.removeAllListeners("createFileOnDir");
  window.ipcRenderer.removeAllListeners("createDir");
  window.ipcRenderer.removeAllListeners("cutFileOrDir");
  window.ipcRenderer.removeAllListeners("copyFileOrDir");
  window.ipcRenderer.removeAllListeners("pasteFileOrDir");

  window.ipcRenderer.send("contextMenu", {
    mode: data?.children ? "dir" : "file",
  });
  // 创建文件
  window.ipcRenderer.once("createFileOnDir", () =>
    createFileOrDir(data, node, "createFile")
  );

  // 创建文件夹
  window.ipcRenderer.once("createDir", () =>
    createFileOrDir(data, node, "createDir")
  );

  // 重命名文件/文件夹
  window.ipcRenderer.once("renameFileOrDir", () => {
    renameValue.value = data.name;
    renamePath.value = data.path;
    renameDialogVisible.value = true;
    currentNodeData.value = data;
  });

  // 删除文件/文件夹
  window.ipcRenderer.once("deleteFileOrDir", () => {
    deleteValue.value = data.name;
    deletePath.value = data.path;
    deleteDialogVisible.value = true;
    currentNodeData.value = node;
  });

  // 剪切文件/文件夹
  window.ipcRenderer.once("cutFileOrDir", () => {
    console.log("data", data, node);

    cutOrCopyNodeData.value = node;
    window.app.deleteKeyData("copy-path");
    window.app.setStoreData("cut-path", JSON.stringify(data.path));
  });

  // 复制文件/文件夹
  window.ipcRenderer.once("copyFileOrDir", () => {
    cutOrCopyNodeData.value = node;
    window.app.deleteKeyData("cut-path");
    window.app.setStoreData("copy-path", JSON.stringify(data.path));
  });

  // 粘贴文件/文件夹
  window.ipcRenderer.once("pasteFileOrDir", () => {
    currentNodeData.value = node;
    window.ipcRenderer.send("confirm-paste", {
      pastePath: data.path,
    });
  });

  // 路径存储到本地磁盘
  let path = data.path;
  if (editMode.value === "createFile") {
    path = node.parent.data.path;
  }
  window.app.setStoreData("path", JSON.stringify(path));
};

// 确定创建文件/文件夹
const handleEnter = (node: any) => {
  node.data.name = editNode.value;
  editNode.value = "";
  node.data.path = `${node.parent.data.path}\\${node.data.name}`;

  console.log("node", node.parent.data);
  if (editMode.value === "createFile") {
    window.ipcRenderer.send("confirm-create-file", {
      parentPath: node.parent.data.path,
      filename: node.data.name,
    });
  } else if (editMode.value === "createDir") {
    window.ipcRenderer.send("confirm-create-dir", {
      parentPath: node.parent.data.path,
      filename: node.data.name,
    });
  }
};

// 确定重命名
const confirmRename = () => {
  window.ipcRenderer.send("confirm-rename", {
    newName: renameValue.value,
    path: renamePath.value,
  });
};

// 确定删除
const confirmDelete = () => {
  window.ipcRenderer.send("confirm-delete", {
    path: deletePath.value,
  });
};

window.ipcRenderer.on("finishRename", () => {
  currentNodeData.value.name = renameValue.value;
  renameDialogVisible.value = false;
});

window.ipcRenderer.on("finishDelete", () => {
  const deletePath = currentNodeData.value.data.path;
  const deleteIndex = currentNodeData.value.parent.data.children.findIndex(
    (item: any) => item.path === deletePath
  );
  currentNodeData.value.parent.data.children.splice(deleteIndex, 1);
  deleteDialogVisible.value = false;
});

window.ipcRenderer.on(
  "finishPaste",
  (event: any, data: { isCopy: boolean }) => {
    console.log("===>", event, data);
    const isCopy = data.isCopy;

    console.log("cutOrCopyNodeData", cutOrCopyNodeData.value);
    console.log("currentNodeData", currentNodeData.value);
    currentNodeData.value.data.children.push(cutOrCopyNodeData.value.data);
    // 如果是粘贴则删除复制的节点
    if (!isCopy) {
      const deletePath = cutOrCopyNodeData.value.data.path;
      const deleteIndex =
        cutOrCopyNodeData.value.parent.data.children.findIndex(
          (item: any) => item.path === deletePath
        );
      cutOrCopyNodeData.value.parent.data.children.splice(deleteIndex, 1);
    }
  }
);

watch(
  () => props.data,
  () => {
    currentData.value = props.data;
  }
);

onMounted(() => {
  currentData.value = props.data;
});
</script>

<style lang="less" scoped>
.menu {
  width: 100%;

  > :deep(.el-tree) > .el-tree-node > .el-tree-node__content {
    position: sticky;
    top: 0;
    padding-top: 10px;
    z-index: 999;
    background: #181818;
  }

  .type-icon {
    font-style: normal;
    margin-right: 6px;

    &::before {
      font-size: 12px;
    }
  }

  .custom-tree-node {
    width: 100%;
    display: flex;
    align-items: center;
  }
}
</style>

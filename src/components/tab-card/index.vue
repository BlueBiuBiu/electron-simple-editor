<template>
  <ul
    class="menu-list"
    ref="menuRef"
    :style="{ display: !status ? 'none' : '', left: PX + 'px', top: PY + 'px' }"
  >
    <li
      v-for="(item, index) in list"
      class="item"
      :key="index"
      @click="item.callback()"
    >
      {{ item.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PropType } from "vue";
/* ts类型定义区域 */
interface MenuType {
  label: string;
  callback: () => void;
}

/* 定义数据区域 */
const props = defineProps({
  PX: {
    type: Number,
    default: 0,
  },
  PY: {
    type: Number,
    default: 0,
  },
  status: {
    type: Boolean,
    default: false,
  },
  list: {
    type: Array as PropType<MenuType[]>,
    default: () => [],
  },
});

const menuRef = ref<HTMLElement>();
const body = document.querySelector("body");

/* 事件处理区域 */

/* 监听 */
watch(
  () => props.status,
  (val) => {
    if (val && menuRef.value) {
      body?.appendChild(menuRef.value);
    } else if (menuRef.value) {
      body?.removeChild(menuRef.value);
    }
  }
);

/* 生命周期 */
</script>

<style scoped lang="less">
.menu-list {
  width: 150px;
  position: absolute;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #aeafad;
  z-index: 3000;
  background-color: #181818;
  box-shadow: 0 0 3px 0 #aeafad;
}
.item {
  margin: 0;
  padding: 7px 16px;
  cursor: pointer;
}

.item:hover {
  background: #3f4042;
}
</style>

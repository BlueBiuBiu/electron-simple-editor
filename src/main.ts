import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "./assets/css/index.less";
import "./plugins/monaco-editor";
import { useRegisterKeyUp } from "./directives/keyup-enter";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(useRegisterKeyUp);
app.mount("#app").$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on("disMarkdown", (_event, message) => {
    console.log(message);
    const markdownContentDiv = document.getElementById("markdownContent")!;
    markdownContentDiv.innerHTML = message;
  });
});

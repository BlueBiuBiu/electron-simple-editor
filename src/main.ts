import { createApp } from "vue";
import App from "./App.vue";
import "./assets/css/index.less";

const app = createApp(App);
app.mount("#app").$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on("disMarkdown", (_event, message) => {
    console.log(message);
    const markdownContentDiv = document.getElementById("markdownContent")!;
    markdownContentDiv.innerHTML = message;
  });
});

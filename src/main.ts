import { createApp } from "vue";
import App from "./App.vue";
import "./assets/css/index.less";
import { useRegisterKeyUp } from "./directives/keyup-enter";

const app = createApp(App);
app.use(useRegisterKeyUp);
app.mount("#app").$nextTick(() => {
  // Use contextBridge
  window.ipcRenderer.on("disMarkdown", (_event, message) => {
    console.log(message);
    const markdownContentDiv = document.getElementById("markdownContent")!;
    markdownContentDiv.innerHTML = message;
  });
});

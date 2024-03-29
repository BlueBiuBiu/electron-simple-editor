import type { App, Directive } from "vue";

export function useRegisterKeyUp(app: App) {
  const keyupDirective: Directive<HTMLButtonElement, () => string> = {
    mounted(el, binding) {
      const handler = (event: any) => {
        if (event.key === "Enter") {
          binding.value();
          window.removeEventListener("keyup", handler);
        }
      };
      window.addEventListener("keyup", handler);
    },
  };

  app.directive("confirmKeyup", keyupDirective);
}

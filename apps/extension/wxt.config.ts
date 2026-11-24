import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "HireFlow",
    description:
      "Save the visible tab title and URL from a page you already opened. HireFlow never auto-submits applications.",
    permissions: ["storage", "activeTab"],
    host_permissions: [],
  },
});

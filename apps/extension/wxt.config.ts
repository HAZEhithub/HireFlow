import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "HireFlow",
    description:
      "Save a job you are already viewing. HireFlow never auto-submits applications. Phase 5 will complete clipping.",
    permissions: ["storage", "activeTab"],
    host_permissions: [],
  },
});

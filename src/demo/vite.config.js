import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    root: "./src/demo",
    base: "/DynamicTextAnchors/",
    build: {
        outDir: "../../dist/demo",
        assetsDir: "./assets",
        rollupOptions: {
            output: {
                entryFileNames: "assets/[name].js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "dynamic-text-anchors": resolve(__dirname, "../lib"),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `
                    @use "@/assets/scss/_variables.scss" as *;
                `,
            },
        },
    },
});

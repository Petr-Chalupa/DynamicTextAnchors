import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    root: "./demo",
    base: "/DynamicTextAnchors/",
    build: {
        outDir: "../dist/demo",
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
            "@": resolve("./"),
            "dynamic-text-anchors": resolve(import.meta.dirname, "../lib"),
        },
    },
});

import { defineConfig } from "vite";
import vituum from "vituum";
import pug from "@vituum/vite-plugin-pug";
import pages from "vituum/plugins/pages.js";
import imports from "vituum/plugins/imports.js";
import { viteStaticCopy } from "vite-plugin-static-copy";

const fileTypeMap = {
  images: /\.(png|jpg|jpeg|svg)$/i,
  videos: /\.(mp4|mov|wmv|avi)$/i,
  texts: /\.(doc|docx|rtf|odt|txt)$/i,
  pdfs: /\.(pdf)$/i,
  fonts: /\.(ttf|otf)$/i,
};

const devMode = process.env.NODE_ENV !== "production";

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: ["**/export/**"],
    },
  },
  base: "./",
  build: {
    target: "es2015",
    rollupOptions: {
      input: ["./views/*.{pug,html}", "!./views/*.{pug,html}.json"],
      output: {
        chunkFileNames: "js/[name].js",
        entryFileNames: "js/[name].js",
        assetFileNames: assetInfo => {
          if (assetInfo.name.endsWith(".css")) {
            return "css/main.css"; // Outputs to css/style.css
          }
          if (assetInfo.name.match(fileTypeMap.pdfs)) {
            return "pdfs/[name][extname]"; // Outputs to pdfs/[name].pdf
          }
          if (assetInfo.name.match(fileTypeMap.fonts)) {
            return "fonts/[name][extname]"; // Outputs to fonts/...
          }
          if (assetInfo.name.match(fileTypeMap.videos)) {
            return "videos/[name][extname]"; // Outputs to videos/...
          }
          if (assetInfo.name.match(fileTypeMap.texts)) {
            return "texts/[name][extname]"; // Outputs to texts/...
          }
          if (assetInfo.name.match(fileTypeMap.images)) {
            return "images/[name][extname]"; // Outputs to images/...
          }
          return "other/[name][extname]"; // Default output structure for other assets
        },
      },
    },
  },
  plugins: [
    vituum(),
    pug(),
    pages({ root: "./", dir: "./views" }),
    imports({ paths: ["./sass/*/**", "./js/*/**"] }),

    // PLUGINS BELOW ONLY APLLIES IN PRODUCTION MODE

    // Custom plugin to transform output html:
    // 1. Delete "crossorigin" attribute
    // 2. Repalce "type="module" to "defer"
    // 3. Fix path for css, js and assets
    {
      name: "tranform-html",
      transformIndexHtml(html) {
        // If dev mode - do not tranform html
        if (devMode) return html;

        // For production transform html
        const transformedHTML = html
          .replaceAll(`crossorigin`, "")
          .replaceAll('type="module"', "defer")
          .replace("../js/", "js/")
          .replace(`<link rel="stylesheet"  href="../css/main.css">`, "");
        return transformedHTML;
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: "images",
          dest: "",
        },
      ],
    }),
  ],
});

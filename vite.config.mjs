import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { ngrok } from "vite-plugin-ngrok";
import { generateMetaJson } from "./scripts/generateMetaJson.ts";
import pkg from "./package.json";

const ReactCompilerConfig = {};

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, rootDir, ""), ...process.env };
  const ngrokEnv = { ...loadEnv(mode, rootDir, "NGROK"), ...process.env };
  const debugBuild =
    env.VITE_APP_MODE === "staging" || env.VITE_APP_MODE === "development";

  return {
    plugins: [
      react(),
      babel({
        presets: [reactCompilerPreset(ReactCompilerConfig)],
        plugins: [
          [
            "babel-plugin-styled-components",
            {
              ssr: false,
              pure: true,
              displayName: true,
              fileName: true,
            },
          ],
        ],
      }),
      generateMetaJson(pkg.version),
      ...(command === "serve" && process.env.VITE_ENABLE_NGROK === "true"
        ? [ngrok({ authtoken: ngrokEnv.NGROK_AUTH_TOKEN })]
        : []),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(rootDir, "src") },
        { find: "@ui", replacement: path.resolve(rootDir, "ui") },
        { find: "@shared", replacement: path.resolve(rootDir, "shared") },
        { find: "@tokens", replacement: path.resolve(rootDir, "tokens") },
      ],
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      global: "globalThis",
    },
    build: debugBuild
      ? {
          target: "es2023",
          sourcemap: true,
          minify: false,
          drop_console: false,
          drop_debugger: false,
          rolldownOptions: {
            output: { strictExecutionOrder: true },
          },
        }
      : {
          target: "es2023",
          rolldownOptions: {
            output: { strictExecutionOrder: true },
          },
        },
    server: {
      port: 5173,
      strictPort: true,
      forwardConsole: true,
      allowedHosts:
        process.env.VITE_ENABLE_NGROK === "true" ? [".ngrok-free.app"] : "auto",
      hmr:
        process.env.VITE_ENABLE_NGROK === "true"
          ? { clientPort: 443 }
          : true,
      proxy: {
        "/api": {
          target: "http://localhost:8082",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4175,
    },
    optimizeDeps: {
      exclude: ["js-big-decimal"],
      rolldownOptions: {
        transform: {
          define: {
            global: "globalThis",
          },
        },
        output: {
          strictExecutionOrder: true,
        },
      },
    },
  };
});

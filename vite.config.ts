import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import { defineConfig, loadEnv, type ConfigEnv, type PluginOption, type UserConfig } from "vite";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import pkg from "./package.json" with { type: "json" };

// 平台名称、版本信息
const __APP_INFO__ = {
  pkg: { name: pkg.name, version: pkg.version },
  buildTimestamp: Date.now(),
};

// ESM 模式下使用 import.meta.dirname（Node 20.11+）
const pathSrc = resolve(import.meta.dirname, "src");

// Vite配置  https://cn.vitejs.dev/config
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd());

  return {
    // 子路径部署由 VITE_BASE_URL 指定，缺省为站点根路径
    base: env.VITE_BASE_URL || "/",
    resolve: {
      alias: {
        "@": pathSrc,
      },
    },
    css: {
      preprocessorOptions: {
        // 注入全局 SCSS 变量
        scss: {
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: +env.VITE_APP_PORT,
      open: true,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          changeOrigin: true,
          target: env.VITE_APP_API_URL,
          rewrite: (path: string) => path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ""),
        },
        // WebSocket 单独代理
        "/api/v1/realtime/ws": {
          changeOrigin: true,
          rewriteWsOrigin: true,
          target: env.VITE_APP_API_URL,
          ws: true,
        },
      },
    },
    // 本地 mock：仅开发态且 VITE_MOCK_ENABLED=true 时挂载，mock 未覆盖的接口继续走下面的代理
    plugins: [
      react(),
      UnoCSS(),
      ...(env.VITE_MOCK_ENABLED === "true"
        ? [
            mockDevServerPlugin(
              // 产出独立可部署的 mock 服务：pnpm build:mock → .deploy/mock-server（Node HTTP 服务）
              env.VITE_MOCK_BUILD === "true"
                ? {
                    build: {
                      serverPort: +env.VITE_MOCK_PORT || 8083,
                      // 绝对路径：写到项目根下的 .deploy/mock-server，不混进前端 dist
                      dist: resolve(import.meta.dirname, ".deploy/mock-server"),
                    },
                  }
                : {},
            ),
          ]
        : []),
      // 生成版本号文件
      {
        name: "dist-version",
        closeBundle() {
          const distDir = resolve(import.meta.dirname, "dist");
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }
          writeFileSync(
            join(distDir, "version.json"),
            JSON.stringify({ version: __APP_INFO__.buildTimestamp }),
          );
        },
      },
    ] as PluginOption[],
    // 预加载项目必需的依赖，避免首次访问页面时触发依赖重优化
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-router-dom",
        "antd",
        "@ant-design/icons",
        "axios",
        "zustand",
        "dayjs",
        "qs",
        "lodash-es",
        "nprogress",
        "react-i18next",
        "i18next",
      ],
    },
    // 构建配置（Vite 8 使用 Rolldown + Oxc）
    build: {
      chunkSizeWarningLimit: 1200, // chunk 大小警告阈值
      reportCompressedSize: false,
      // minify 默认使用 oxc，压缩速度比 terser 快
      rolldownOptions: {
        checks: {
          pluginTimings: false,
        },
        output: {
          // 用于从入口点创建的块的打包输出格式
          entryFileNames: "js/[name].[hash].js",
          // 用于命名代码拆分时创建的共享块的输出命名
          chunkFileNames: "js/[name].[hash].js",
          // 用于输出静态资源的命名
          assetFileNames: "assets/[name].[hash][extname]",
          codeSplitting: {
            groups: [
              // 框架核心，每个页面都依赖
              {
                name: "vendor-react",
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|zustand|i18next|react-i18next)[\\/]/,
              },
              // 图表：大屏与报表页共用
              {
                name: "vendor-echarts",
                test: /node_modules[\\/](echarts|zrender)[\\/]/,
              },
            ],
          },
        },
      },
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
  };
});

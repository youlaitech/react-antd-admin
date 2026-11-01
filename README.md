<div align="center">

# <img alt="logo" width="40" valign="middle" src="./src/assets/images/logo.svg"> react-antd-admin

**React19 + Vite + TypeScript 企业级中后台前端**

[![React](https://img.shields.io/badge/React-19.3.0-brightgreen.svg)](https://react.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6.6.4-blue.svg)](https://ant.design/index-cn)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-purple.svg)](https://cn.vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Gitee Star](https://gitee.com/youlaiorg/react-antd-admin/badge/star.svg)](https://gitee.com/youlaiorg/react-antd-admin)

</div>

<p align="center"><img src="./public/images/rainbow.png" alt="rainbow"></p>

<div align="center">

[![在线预览](https://img.shields.io/badge/在线预览-2D8CF0?style=for-the-badge&logo=google-chrome&logoColor=white)](https://admin.youlai.tech/react)
[![阅读文档](https://img.shields.io/badge/阅读文档-8B5CF6?style=for-the-badge&logo=gitbook&logoColor=white)](https://www.youlai.tech/docs/web/)
[![官网](https://img.shields.io/badge/官网-FF9F1C?style=for-the-badge&logo=safari&logoColor=white)](https://www.youlai.tech)
[![English](https://img.shields.io/badge/English-00B4D8?style=for-the-badge&logo=google-translate&logoColor=white)](./README.en-US.md)

</div>

## 项目简介

react-antd-admin 是 [vue3-element-admin](https://gitee.com/youlaiorg/vue3-element-admin) 的 React 版本，基于 React 19、Vite、TypeScript、Ant Design 构建的企业级中后台前端，配套 [9 种主后端](#生态矩阵)（覆盖 Java / Node.js / Go / Python / PHP / C# / Rust 7 种语言）及移动端 [youlai-app](https://gitee.com/youlaiorg/youlai-app)，共享同一套 RESTful API 规范与数据库结构。其他前端版本：[Vue 版](https://gitee.com/youlaiorg/vue3-element-admin) · [JS 版](https://gitee.com/youlaiorg/vue3-element-admin-js) · [精简版](https://gitee.com/youlaiorg/vue3-element-template) · [NaiveUI 版](https://gitee.com/youlaiorg/vue3-naiveui-admin)。

## 项目特色

- **主流技术栈** — React 19 + Vite 8 + TypeScript + Ant Design 6 + Zustand 5 + React Router 7
- **权限体系** — 后端菜单驱动的动态路由、`<Auth>` 组件级按钮权限、令牌静默刷新
- **四种布局** — 左侧菜单、顶部菜单、混合菜单、双列菜单，可在设置面板实时切换
- **主题能力** — 明暗模式、主题色预设、深浅两套侧边栏配色、中英文切换
- **代码规范** — ESLint 10 扁平化配置 + Prettier + Stylelint + EditorConfig + Husky + Commitlint
- **文档完备** — 从 0 到 1 搭建教程与开发规范随仓库维护

## 快速开始

**环境要求**：Node.js `^20.19.0` 或 `>=22.12.0` · pnpm `>=8.0.0`

| 环境类型     | 版本要求                                                     | 备注                                              |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------- |
| **Node.js**  | `^20.19.0` 或 `>=22.12.0`                                    | 推荐 LTS 版本（主版本为偶数）                     |
| **包管理器** | `pnpm >= 8.0.0`                                              | 项目使用 pnpm 作为包管理器                        |
| **开发工具** | [Visual Studio Code](https://code.visualstudio.com/Download) | 推荐安装 ESLint、Prettier、Stylelint、UnoCSS 插件 |

```bash
# 克隆代码
git clone https://gitee.com/youlaiorg/react-antd-admin.git
cd react-antd-admin

# 安装 pnpm（已安装可跳过）
npm install pnpm -g

# 设置镜像源（可忽略）
pnpm config set registry https://registry.npmmirror.com

# 安装依赖
pnpm install

# 启动运行
pnpm run dev
```

启动后访问 [http://localhost:4000](http://localhost:4000)，使用 `youlai` / `123456` 登录（另有验证码）。

> 开发端口在 `.env.development` 的 `VITE_APP_PORT` 中配置，默认 4000，与 vue3-element-admin 的 3000 错开，便于两个项目同时启动。

## 生态矩阵

**前端**

| 项目                                                                       | 技术栈                            | 说明                    | 更新状态 |
| :------------------------------------------------------------------------- | :-------------------------------- | :---------------------- | :------- |
| [react-antd-admin](https://gitee.com/youlaiorg/react-antd-admin)           | React 19 + Vite + TS + Ant Design | PC 管理前端（React 版） | ✅️       |
| [vue3-element-admin](https://gitee.com/youlaiorg/vue3-element-admin)       | Vue 3 + Vite + TS + Element Plus  | PC 管理前端（主推）     | ✅️       |
| [vue3-element-admin-js](https://gitee.com/youlaiorg/vue3-element-admin-js) | Vue 3 + Vite + JS + Element Plus  | JavaScript 版本         | ✅️       |
| [vue3-element-template](https://gitee.com/youlaiorg/vue3-element-template) | Vue 3 + Vite + TS + Element Plus  | 精简模板                | ✅️       |
| [vue3-naiveui-admin](https://gitee.com/youlaiorg/vue3-naiveui-admin)       | Vue 3 + Vite + TS + Naive UI      | Naive UI 版本           | ✅️       |
| [youlai-app](https://gitee.com/youlaiorg/youlai-app)                       | Vue 3 + UniApp                    | 移动端 App              | ✅️       |

**后端**

| 项目                                                         | 技术栈                     | 说明         | 更新状态 |
| :----------------------------------------------------------- | :------------------------- | :----------- | :------- |
| [youlai-boot](https://gitee.com/youlaiorg/youlai-boot)       | Spring Boot + MyBatis-Plus | Java（主推） | ✅️       |
| [youlai-nest](https://gitee.com/youlaiorg/youlai-nest)       | NestJS + TypeORM           | Node.js      | ✅️       |
| [youlai-gin](https://gitee.com/youlaiorg/youlai-gin)         | Go + Gorm                  | Go           | ✅️       |
| [youlai-django](https://gitee.com/youlaiorg/youlai-django)   | Django + DRF               | Python       | ✅️       |
| [youlai-fastapi](https://gitee.com/youlaiorg/youlai-fastapi) | FastAPI + SQLAlchemy       | Python       | ✅️       |
| [youlai-think](https://gitee.com/youlaiorg/youlai-think)     | ThinkPHP + ThinkORM        | PHP          | ✅️       |
| [youlai-aspnet](https://gitee.com/youlaiorg/youlai-aspnet)   | ASP.NET Core + EF Core     | C#           | ✅️       |
| [youlai-axum](https://gitee.com/youlaiorg/youlai-axum)       | Axum + SeaORM              | Rust         | ✅️       |
| [youlai-laravel](https://gitee.com/youlaiorg/youlai-laravel) | Laravel + Eloquent         | PHP          | ❌️       |

> 九种后端共享同一套 **RESTful API 规范** 和 **数据库结构**，前端可无缝切换。

**衍生版本**

| 项目                                                                                      | 基于        | 类型     | 说明                            | 更新状态 |
| :---------------------------------------------------------------------------------------- | :---------- | :------- | :------------------------------ | :------- |
| [youlai-boot-tenant](https://gitee.com/youlaiorg/youlai-boot-tenant)                      | youlai-boot | 独立仓库 | 多租户 SaaS，租户隔离与租户配置 | ✅️       |
| [youlai-nest (multi-tenant)](https://gitee.com/youlaiorg/youlai-nest/tree/multi-tenant)   | youlai-nest | 分支     | 多租户 SaaS，租户隔离与租户配置 | ✅️       |
| [youlai-boot-flex](https://gitee.com/youlaiorg/youlai-boot-flex)                          | youlai-boot | 独立仓库 | 改用 MyBatis-Flex               | ✅️       |
| [youlai-boot (db-pg)](https://gitee.com/youlaiorg/youlai-boot/tree/db-pg)                 | youlai-boot | 分支     | PostgreSQL 数据库分支           | ✅️       |
| [youlai-boot (multi-module)](https://gitee.com/youlaiorg/youlai-boot/tree/multi-module)   | youlai-boot | 分支     | 多模块工程拆分                  | ✅️       |
| [youlai-boot (spring-boot-3)](https://gitee.com/youlaiorg/youlai-boot/tree/spring-boot-3) | youlai-boot | 分支     | Spring Boot 3 兼容分支          | ❌️       |

## 开发指南

| 名称               | 地址                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 从 0 到 1 搭建     | [docs/react-antd-admin/0to1.md](docs/react-antd-admin/0to1.md)                                                     |
| 开发规范           | [docs/react-antd-admin/code-standard.md](docs/react-antd-admin/code-standard.md)                                   |
| 官方文档           | [https://www.youlai.tech/docs/web/](https://www.youlai.tech/docs/web/)                                             |
| 部署指南           | [https://www.youlai.tech/docs/web/deployment/deploy.html](https://www.youlai.tech/docs/web/deployment/deploy.html) |
| 常见问题           | [https://www.youlai.tech/docs/faq/](https://www.youlai.tech/docs/faq/)                                             |
| 接口文档           | [https://www.apifox.cn](https://www.apifox.cn/apidoc/shared-195e783f-4d85-4235-a038-eec696de4ea5)                  |
| vue3-element-admin | [https://gitee.com/youlaiorg/vue3-element-admin](https://gitee.com/youlaiorg/vue3-element-admin)                   |

## 项目部署

执行 `pnpm run build` 打包生成 `dist` 目录，上传至服务器并配置 Nginx 反向代理。

```bash
pnpm run build
```

项目内置部署脚本 `deploy.mjs`，改好脚本顶部的服务器信息后直接执行：

```bash
pnpm run deploy
```

详细部署流程（Nginx 配置、反向代理、HTTPS 等）见 [部署指南](https://www.youlai.tech/docs/web/deployment/deploy.html)。

## 数据接口

**本地 Mock**：`.env.development` 的 `VITE_MOCK_ENABLED` 默认 `true`，`mock/` 目录接管已实现接口，未覆盖的请求转发到 `VITE_APP_API_URL`（默认线上 `https://api.youlai.tech`），无需后端即可独立开发。

**对接后端**：将 `VITE_MOCK_ENABLED` 改为 `false`，并把 `VITE_APP_API_URL` 改为 `http://localhost:8000` 后启动对应后端即可（主推 Java 后端 [youlai-boot](https://gitee.com/youlaiorg/youlai-boot)，其余见各自仓库 README）。

> 也可执行 `pnpm build:mock` 构建独立 mock 服务（产物在 `.deploy/mock-server`）。

数据库脚本：[youlai_admin.sql](https://www.youlai.tech/docs/sql/youlai_admin_antd.sql)

## 提交规范

执行 `pnpm run commit` 唤起 git commit 交互，根据提示完成信息的输入和选择。

提交信息格式为 `<type>(<scope>): <subject>`，由 Husky 的 `pre-commit` 触发 lint-staged 检查、`commit-msg` 触发 commitlint 校验。

## 技术合作

本项目采用 [MIT](LICENSE) 协议开源，可免费商用。欢迎在 [Issue](https://gitee.com/youlaiorg/react-antd-admin/issues) 提交问题或反馈，也欢迎提交 [Pull Request](https://gitee.com/youlaiorg/react-antd-admin/pulls) 共建。如需技术支持、商务合作、二次开发或项目定制，可联系作者微信（见下方二维码）。

<table align="center">
  <tr>
    <td align="center">
      <img src="./public/images/qrcode/wechat-official.jpg" height="180" alt="公众号「有来技术」"><br>
      <sub>公众号「有来技术」</sub>
    </td>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td align="center">
      <img src="./public/images/qrcode/wechat-mp.jpg" height="180" alt="小程序「有来技术」"><br>
      <sub>小程序「有来技术」</sub>
    </td>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td align="center">
      <img src="./public/images/qrcode/wechat-personal.png" height="180" alt="添加作者微信"><br>
      <sub>添加作者微信</sub>
    </td>
  </tr>
</table>

<p align="center"><em>技术交流 · 问题反馈 · 商务合作</em></p>

## 许可证

[MIT](LICENSE)

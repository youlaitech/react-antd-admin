<div align="center">

# <img alt="logo" width="40" valign="middle" src="./src/assets/images/logo.png"> react-antd-admin

**React19 + Vite + TypeScript enterprise admin frontend**

[![React](https://img.shields.io/badge/React-19.3.0-brightgreen.svg)](https://react.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-6.6.4-blue.svg)](https://ant.design/index-cn)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-purple.svg)](https://cn.vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Gitee Star](https://gitee.com/youlaiorg/react-antd-admin/badge/star.svg)](https://gitee.com/youlaiorg/react-antd-admin)

</div>

<p align="center"><img src="./public/images/rainbow.png" alt="rainbow"></p>

<div align="center">

[![Documentation](https://img.shields.io/badge/Documentation-8B5CF6?style=for-the-badge&logo=gitbook&logoColor=white)](https://www.youlai.tech/docs/web/)
[![Website](https://img.shields.io/badge/Website-FF9F1C?style=for-the-badge&logo=safari&logoColor=white)](https://www.youlai.tech)
[![中文](https://img.shields.io/badge/中文-00B4D8?style=for-the-badge&logo=google-translate&logoColor=white)](./README.md)

</div>

## Introduction

react-antd-admin is the React version of [vue3-element-admin](https://gitee.com/youlaiorg/vue3-element-admin), an enterprise admin frontend built with React 19, Vite, TypeScript and Ant Design. It works with [youlai-boot](https://gitee.com/youlaiorg/youlai-boot) and the other eight backend implementations from the same organization, all sharing one RESTful API specification and database schema.

## Features

- **Modern stack** — React 19 + Vite 8 + TypeScript + Ant Design 6 + Zustand 5 + React Router 7
- **Permission system** — backend-driven dynamic routes, `<Auth>` component-level button permissions, silent token refresh
- **Four layouts** — sidebar, header, mix and double column, switchable at runtime from the settings drawer
- **Theming** — light/dark mode, primary color presets, two sidebar color schemes, Chinese/English
- **Code quality** — ESLint 10 flat config + Prettier + Stylelint + EditorConfig + Husky + Commitlint
- **Documentation** — a from-scratch tutorial and a coding standard maintained in this repository

## Quick Start

**Requirements**: Node.js `^20.19.0` or `>=22.12.0` · pnpm `>=8.0.0`

| Item                | Version                                                      | Note                                                          |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| **Node.js**         | `^20.19.0` or `>=22.12.0`                                    | LTS versions recommended                                      |
| **Package manager** | `pnpm >= 8.0.0`                                              | This project uses pnpm                                        |
| **IDE**             | [Visual Studio Code](https://code.visualstudio.com/Download) | Install the ESLint, Prettier, Stylelint and UnoCSS extensions |

```bash
# Clone
git clone https://gitee.com/youlaiorg/react-antd-admin.git
cd react-antd-admin

# Install pnpm (skip if already installed)
npm install pnpm -g

# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

Open [http://localhost:4000](http://localhost:4000) and sign in with `youlai` / `123456` (plus a captcha).

> The dev port is configured by `VITE_APP_PORT` in `.env.development`. It defaults to 4000, leaving 3000 free for vue3-element-admin so both projects can run at the same time.

## Ecosystem

**Frontend**

| Project                                                                    | Stack                             | Description                |
| :------------------------------------------------------------------------- | :-------------------------------- | :------------------------- |
| [react-antd-admin](https://gitee.com/youlaiorg/react-antd-admin)           | React 19 + Vite + TS + Ant Design | React admin frontend       |
| [vue3-element-admin](https://gitee.com/youlaiorg/vue3-element-admin)       | Vue 3 + Vite + TS + Element Plus  | Primary Vue admin frontend |
| [vue3-element-admin-js](https://gitee.com/youlaiorg/vue3-element-admin-js) | Vue 3 + Vite + JS + Element Plus  | JavaScript version         |
| [vue3-naiveui-admin](https://gitee.com/youlaiorg/vue3-naiveui-admin)       | Vue 3 + Vite + TS + Naive UI      | Naive UI version           |
| [youlai-app](https://gitee.com/youlaiorg/youlai-app)                       | Vue 3 + UniApp                    | Mobile app                 |

**Backend**

| Project                                                      | Stack                      | Language |
| :----------------------------------------------------------- | :------------------------- | :------- |
| [youlai-boot](https://gitee.com/youlaiorg/youlai-boot)       | Spring Boot + MyBatis-Plus | Java     |
| [youlai-nest](https://gitee.com/youlaiorg/youlai-nest)       | NestJS + TypeORM           | Node.js  |
| [youlai-gin](https://gitee.com/youlaiorg/youlai-gin)         | Go + Gorm                  | Go       |
| [youlai-django](https://gitee.com/youlaiorg/youlai-django)   | Django + DRF               | Python   |
| [youlai-fastapi](https://gitee.com/youlaiorg/youlai-fastapi) | FastAPI + SQLAlchemy       | Python   |
| [youlai-laravel](https://gitee.com/youlaiorg/youlai-laravel) | Laravel + Eloquent         | PHP      |
| [youlai-aspnet](https://gitee.com/youlaiorg/youlai-aspnet)   | ASP.NET Core + EF Core     | C#       |
| [youlai-axum](https://gitee.com/youlaiorg/youlai-axum)       | Axum + SeaORM              | Rust     |

> All backends share the same **RESTful API specification** and **database schema**, so the frontend can switch between them without code changes.

## Documentation

| Document              | Link                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| From scratch tutorial | [docs/react-antd-admin/0to1.md](docs/react-antd-admin/0to1.md)                                                     |
| Coding standard       | [docs/react-antd-admin/code-standard.md](docs/react-antd-admin/code-standard.md)                                   |
| Official docs         | [https://www.youlai.tech/docs/web/](https://www.youlai.tech/docs/web/)                                             |
| Deployment guide      | [https://www.youlai.tech/docs/web/deployment/deploy.html](https://www.youlai.tech/docs/web/deployment/deploy.html) |
| FAQ                   | [https://www.youlai.tech/docs/faq/](https://www.youlai.tech/docs/faq/)                                             |
| API reference         | [https://www.apifox.cn](https://www.apifox.cn/apidoc/shared-195e783f-4d85-4235-a038-eec696de4ea5)                  |

## Deployment

```bash
pnpm run build
```

The output goes to `dist/`. Upload it to your server and set up an Nginx reverse proxy.

The repository ships with a deployment script. Fill in your server details at the top of `deploy.mjs`, then run:

```bash
pnpm run deploy
```

See the [deployment guide](https://www.youlai.tech/docs/web/deployment/deploy.html) for Nginx configuration, reverse proxy and HTTPS setup.

## API

The frontend points at `https://api.youlai.tech` by default.

To use a local backend, change `VITE_APP_API_URL` in `.env.development` to `http://localhost:8000` and start one of the backends ([youlai-boot](https://gitee.com/youlaiorg/youlai-boot) is the reference implementation).

## Commit Convention

Run `pnpm run commit` for an interactive commit prompt.

Messages follow `<type>(<scope>): <subject>`. Husky runs lint-staged on `pre-commit` and commitlint on `commit-msg`.

## Support

Released under the [MIT](LICENSE) license, free for commercial use. Report issues or open a [Pull Request](https://gitee.com/youlaiorg/react-antd-admin/pulls) — both are welcome.

## License

[MIT](LICENSE)

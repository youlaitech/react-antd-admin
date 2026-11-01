import eslint from "@eslint/js";
import globals from "globals";
import * as typescriptEslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import configPrettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.min.*",
      "types/**/*.d.ts",
      "**/auto-imports.d.ts",
    ],
  },

  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        __APP_INFO__: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint.plugin,
    },
    rules: {
      // 基础规则
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
      "no-debugger": "error",

      // ES6+ 规则
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",

      // 最佳实践
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],

      // 禁用与 TypeScript 冲突的规则
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },

  {
    // React 组件与 Hooks 规则
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  {
    // 路由配置文件导出的是路由表而非组件，Fast Refresh 规则在这里只会误报
    files: ["src/router/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  {
    rules: {
      ...configPrettier.rules,
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
];

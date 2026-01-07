import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  // Base recommended configs
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/out/**",
      "**/.nuxt/**",
      "**/.vitepress/dist/**",
      "**/.vitepress/cache/**",
      "**/coverage/**",
      "**/.cache/**",
      "**/.parcel-cache/**",
      "**/*.tsbuildinfo",
      "**/.eslintcache",
      "**/.stylelintcache",
      "**/public/**",
      "**/server/public/**",
      "**/uploads/**",
      "vite.config.ts.timestamp-*",
      "vite.config.js.timestamp-*",
      "**/*.min.js",
      "**/*.min.css",
      "**/.vscode/**",
      "**/.idea/**",
      "**/.local/**",
      "**/.DS_Store",
      "**/.git/**",
      "**/src/config/firebaseServiceAccount.json",
      "**/server/config/firebaseServiceAccount.json",
      "**/test_validation.js",
      "**/server/src/seed.js",
      "**/emailtest.js",
    ],
  },

  // JavaScript and JSX files
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        global: "readonly",
        Buffer: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        URL: "readonly",
        Image: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        atob: "readonly",
        btoa: "readonly",
        alert: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      // Disabled - using professional logger (consola) instead
      // "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // TypeScript and TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        global: "readonly",
        Buffer: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        URL: "readonly",
        Image: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        atob: "readonly",
        btoa: "readonly",
        alert: "readonly",
        React: "readonly",
        HTMLFormElement: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Disabled - using professional logger (consola) instead
      // "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-undef": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Config files - allow require() / Node globals
  {
    files: ["**/*.config.{js,ts}", "**/tailwind.config.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },

  // Prettier config to turn off conflicting rules
  prettierConfig,
];

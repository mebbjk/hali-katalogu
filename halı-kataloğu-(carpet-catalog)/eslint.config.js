import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...eslintReact.configs.recommended,
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      'react-refresh': pluginReactRefresh,
      'react-hooks': pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    }
  },
  {
    ignores: ["dist", "node_modules", ".github", "vite.config.ts", "postcss.config.mjs", "tailwind.config.mjs"],
  }
];

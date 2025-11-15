import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/node_modules/", "**/dist/", "playwright-report/", "test-results/"]
  },
  {
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.jest
      } 
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];

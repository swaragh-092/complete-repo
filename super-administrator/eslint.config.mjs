// eslint.config.js
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",      
      ecmaVersion: 2021,
      globals: globals.node,       
    },
    rules: {
      // Your custom rules (optional)
      "no-unused-vars": "warn",
      // "no-console": "off",
      "eqeqeq": "error",
    },
  },
]);

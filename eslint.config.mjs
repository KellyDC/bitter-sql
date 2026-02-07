import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import security from "eslint-plugin-security";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["tests/**/*", "dist/**/*", "node_modules/**/*", "coverage/**/*"]),
    {
        extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

        plugins: {
            "@typescript-eslint": typescriptEslint,
            security,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: "module",
        },

        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "warn",

            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
            }],

            "no-console": ["warn", {
                allow: ["warn", "error", "log"],
            }],

            "security/detect-object-injection": "off",
            "security/detect-non-literal-fs-filename": "warn",
            "security/detect-unsafe-regex": "error",
        },
    },
]);
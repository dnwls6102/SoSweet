import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
  {
    files: ["src/**/*.ts"], // src 폴더의 모든 .ts 파일 검사
    excludeFiles: ["node_modules/**/*", "dist/**/*"], // 제외 경로 설정
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      "no-console": "off", // Node.js에서는 console.log 허용
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off", // 함수 및 클래스의 반환 타입 명시하지 않아도 경고 출력하지 않음
    },
  },
];

export default eslintConfig;

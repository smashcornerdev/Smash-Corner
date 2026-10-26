import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ["mockup/**", ".next/**", "node_modules/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // receipts and QR codes come from signed / storage URLs, where next/image adds nothing
  { rules: { "@next/next/no-img-element": "off" } },
];

import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const config = defineConfig({
  input: "./src/index.ts",
  output: {
    dir: "dist",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./config/typescript/tsconfig.prod.json",
    }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
});

export default config;

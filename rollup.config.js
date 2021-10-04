import { defineConfig } from "rollup";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

const config = defineConfig({
  input: "./src/index.ts",
  output: [
    {
      file: "./dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      name: "bundle",
      file: "./dist/index.js",
      format: "umd",
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({ useTsconfigDeclarationDir: true }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
});

export default config;

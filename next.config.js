/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import("next").NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const config = {
  output: "export",
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  basePath,
  assetPrefix: basePath,
};

export default config;

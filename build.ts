#!/usr/bin/env -S deno run -A
/// <reference lib="deno.ns" />

import { bundle } from "emit";
import { ensureDir } from "std/fs/mod.ts";

interface BuildOptions {
  input: string;
  output: string;
}

async function buildLibrary(options: BuildOptions) {
  const { input, output } = options;

  await ensureDir(output.substring(0, output.lastIndexOf("/")));

  console.log(`Building ${output}...`);

  try {
    const result = await bundle(new URL(input, import.meta.url));
    const code = result.code;

    await Deno.writeTextFile(output, code);

    console.log(`✅ Bundle created: ${output}`);
    return true;
  } catch (error) {
    console.error(`❌ Build failed for ${output}:`, error);
    return false;
  }
}

async function main() {
  const inputFile = "./lucid-js/index.ts";
  const outputDir = "./dist";

  try {
    console.log("🔨 Building ESM development version...\n");

    // Build ESM version (development)
    await buildLibrary({
      input: inputFile,
      output: `${outputDir}/lucid-js.js`,
    });

    console.log("✅ Development version built successfully!");
    console.log("🔄 Now creating minified version...\n");

    // Create minified version using Deno's built-in minification
    const minifyCommand = new Deno.Command("deno", {
      args: ["bundle", "--minify", `${outputDir}/lucid-js.js`],
      stdout: "piped",
      stderr: "piped",
    });

    const minifyResult = await minifyCommand.output();

    if (minifyResult.success) {
      const minifiedCode = new TextDecoder().decode(minifyResult.stdout);
      await Deno.writeTextFile(`${outputDir}/lucid-js.min.js`, minifiedCode);
      console.log("✅ Bundle created: ./dist/lucid-js.min.js");
    } else {
      const error = new TextDecoder().decode(minifyResult.stderr);
      console.error("❌ Minification failed:", error);
    }

    console.log("\n🎉 All builds completed successfully!");
    console.log("\nGenerated files:");
    console.log("- dist/lucid-js.js (ESM development)");
    console.log("- dist/lucid-js.min.js (ESM production)");
    console.log("\nUsage:");
    console.log('import { createSignal, h, mount } from "./lucid-js.js";');
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}
if (import.meta.main) {
  main();
}

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export async function loadTsModule(sourcePath) {
  const root = process.cwd();
  const tmpDir = path.join(root, ".tmp-game-tests");
  const outputPath = path.join(tmpDir, `module-${Date.now()}.mjs`);
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  await mkdir(tmpDir, { recursive: true });
  await writeFile(outputPath, output.outputText, "utf8");

  try {
    return await import(pathToFileURL(outputPath).href);
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }
}

export async function loadGame() {
  return loadTsModule(path.join(process.cwd(), "src", "lib", "game.ts"));
}

export async function loadAnswers() {
  return loadTsModule(path.join(process.cwd(), "convex", "answers.ts"));
}

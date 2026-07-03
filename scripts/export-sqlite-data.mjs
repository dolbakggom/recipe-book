#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const tables = [
  ["Kitchen", "kitchens"],
  ["Recipe", "recipes"],
  ["Ingredient", "ingredients"],
  ["RecipeIngredient", "recipeIngredients"],
  ["RecipeStep", "recipeSteps"],
  ["ShareLink", "shareLinks"]
];

const args = process.argv.slice(2);
const dbPath = path.resolve(readOption("--db") ?? "prisma/dev.db");
const outPath = path.resolve(readOption("--out") ?? "tmp/recipe-book-data.json");

if (!existsSync(dbPath)) {
  throw new Error(`SQLite database not found: ${dbPath}`);
}

const exportedTables = Object.fromEntries(
  tables.map(([table, key]) => [key, readTable(table)])
);

const payload = {
  exportedAt: new Date().toISOString(),
  source: {
    databasePath: dbPath,
    counts: Object.fromEntries(
      Object.entries(exportedTables).map(([key, rows]) => [key, rows.length])
    )
  },
  tables: exportedTables
};

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Exported recipe data to ${outPath}`);
console.table(payload.source.counts);

function readTable(table) {
  const sql = `SELECT * FROM "${table}"`;
  const stdout = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8"
  }).trim();

  return stdout ? JSON.parse(stdout) : [];
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }

  return value;
}

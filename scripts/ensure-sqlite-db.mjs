import { closeSync, mkdirSync, openSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = process.cwd();
const schemaDir = path.resolve(projectRoot, "prisma");
const databaseUrl =
  process.env.DATABASE_URL ??
  readDatabaseUrl(path.join(projectRoot, ".env"));

if (!databaseUrl?.startsWith("file:")) {
  process.exit(0);
}

const dbPath = resolveSqliteFilePath(databaseUrl, schemaDir);

if (!dbPath) {
  process.exit(0);
}

mkdirSync(path.dirname(dbPath), { recursive: true });
closeSync(openSync(dbPath, "a"));

function readDatabaseUrl(envPath) {
  let contents;

  try {
    contents = readFileSync(envPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    return parseEnvValue(match[1]);
  }

  return undefined;
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === `"` || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function resolveSqliteFilePath(databaseUrl, baseDir) {
  const withoutPrefix = stripUrlMetadata(databaseUrl.slice("file:".length));

  if (!withoutPrefix) {
    return undefined;
  }

  if (withoutPrefix.startsWith("//")) {
    return fileURLToPath(databaseUrl);
  }

  if (path.isAbsolute(withoutPrefix)) {
    return withoutPrefix;
  }

  return path.resolve(baseDir, withoutPrefix);
}

function stripUrlMetadata(value) {
  const queryIndex = value.search(/[?#]/);

  if (queryIndex === -1) {
    return value;
  }

  return value.slice(0, queryIndex);
}

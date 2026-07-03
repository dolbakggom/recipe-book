import { createReadStream, existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const args = process.argv.slice(2);
const uploadDir = path.resolve(readOption("--dir") ?? "public/uploads");
const outPath = path.resolve(readOption("--out") ?? "tmp/upload-map.json");
const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required to migrate uploads");
}

if (!existsSync(uploadDir)) {
  throw new Error(`Upload directory not found: ${uploadDir}`);
}

const filenames = readdirSync(uploadDir).filter(
  (filename) => !filename.startsWith(".")
);
const imageMap: Record<string, string> = {};

for (const filename of filenames) {
  const filePath = path.join(uploadDir, filename);
  const blob = await put(`uploads/${filename}`, createReadStream(filePath), {
    access: "public",
    token
  });

  imageMap[`/uploads/${filename}`] = blob.url;
}

writeFileSync(outPath, `${JSON.stringify(imageMap, null, 2)}\n`);
console.log(`Uploaded ${filenames.length} local uploads`);
console.log(`Wrote image URL map to ${outPath}`);

function readOption(name: string) {
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

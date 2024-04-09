// deno run --watch --allow-read --allow-write scholarships/format.ts

import { ensureDir } from "https://deno.land/std@0.221.0/fs/ensure_dir.ts";
import awards from "./awards.json" with { type: "json" };
import { Awards } from "./types.ts";

// GET SCRAPED DATA

const validated = Awards.parse(awards);

// CREATE FORMATTED FILE

await ensureDir("public");
Deno.writeTextFile(
  "public/scholarships.json",
  JSON.stringify(validated, null, "\t"),
);

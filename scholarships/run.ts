// deno run --allow-net --allow-read --allow-write --allow-env scholarships/run.ts

import { ensureDir } from 'https://deno.land/std@0.221.0/fs/ensure_dir.ts';
import { format } from './format.ts';
import { scrape } from './scrape.ts';
import { Scholarships } from './types.ts';

// SCRAPE DATA

const scraped = await scrape();

// FORMAT DATA

const formatted = format(scraped);

// VALIDATE DATA

const validated = Scholarships.safeParse(
	formatted.result
		.map((a) => ({ ...a.info, ...a.details })),
);
if (!validated.success) {
	console.log(validated.error.issues);
	Deno.exit(1);
}

// SAVE DATA

await ensureDir('public');
await Deno.writeTextFile(
	'public/scholarships.json',
	JSON.stringify(validated.data, null, '\t'),
);

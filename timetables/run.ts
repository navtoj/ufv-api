console.time('timetables');
// deno run --allow-env --allow-net --allow-read --allow-write timetables/run.ts

import { ensureDir } from 'https://deno.land/std@0.221.0/fs/ensure_dir.ts';
import * as core from 'npm:@actions/core';
import { getTerms, scrape } from './scrape.ts';
import { Timetable } from './types.ts';

// make sure the save folder exists
await ensureDir('public/timetables');

// get available terms
const terms = await getTerms();

// get latest term
const term = terms.sort((a, b) => a.code.localeCompare(b.code)).at(-1);
// make sure a term is available
if (!term) {
	console.log('No terms available.');
	Deno.exit(1);
}

// SCRAPE DATA

const scraped = await scrape(term);

// FORMAT DATA

const formatted = scraped; // format(scraped);

// VALIDATE DATA

const validated = Timetable.safeParse(formatted);
if (!validated.success) {
	core.error(`Timetable (${term.code}) failed validation.`);
	console.log(validated.error.issues);
	Deno.exit(1);
}

// SAVE DATA

await Deno.writeTextFile(
	`public/timetables/${term.code}.json`,
	JSON.stringify(
		validated.data,
		null,
		'\t',
	),
);

console.timeEnd('timetables');

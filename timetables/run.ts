// deno run --allow-net --allow-read --allow-write --allow-env timetables/run.ts
console.time('timetables');

import { ensureDir } from 'https://deno.land/std@0.221.0/fs/ensure_dir.ts';
import * as core from 'npm:@actions/core';
import { getTerms, scrape } from './scrape.ts';
import { Timetable } from './types.ts';

// make sure the save folder exists
await ensureDir('public/timetables');

// get available terms
const terms = await getTerms();

// get latest terms
const latest = terms.sort((a, b) => a.code.localeCompare(b.code)).slice(-2);
// make sure a term is available
if (!latest.length) {
	console.log('No terms available.');
	Deno.exit(1);
}

// loop through terms
for (const term of latest) {
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
}

console.timeEnd('timetables');

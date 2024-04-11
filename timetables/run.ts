console.time('timetables');
// deno run --allow-env --allow-net --allow-read --allow-write timetables/run.ts

import { ensureDir } from 'https://deno.land/std@0.221.0/fs/ensure_dir.ts';
import { scrape } from './scrape.ts';
import { Timetable } from './types.ts';

// SCRAPE DATA

const scraped = await scrape();

// make sure the save folder exists
await ensureDir('public/timetables');

// loop through the scraped timetables
for await (const timetable of scraped) {
	// FORMAT DATA

	// const formatted = format(scraped);

	// VALIDATE DATA

	const validated = Timetable.safeParse({
		term: timetable.description,
		courses: timetable.data,
	});
	if (!validated.success) {
		console.log(validated.error);
		Deno.exit(1);
	}

	// SAVE DATA

	await Deno.writeTextFile(
		`public/timetables/${timetable.code}.json`,
		JSON.stringify(
			validated.data,
			null,
			'\t',
		),
	);
}

console.timeEnd('timetables');

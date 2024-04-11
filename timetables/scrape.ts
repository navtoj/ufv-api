import z from 'https://deno.land/x/zod@v3.22.4/index.ts';
import * as core from 'npm:@actions/core';
import {
	handleResponseError,
	handleResponseSetCookies,
} from '../helpers/functions.ts';
import {
	Terms,
	Timetable,
	TimetableData,
	TimetableDataCount,
} from './types.ts';

// FETCH FUNCTIONS

async function getTerms() {
	// get terms
	const response = await fetch(
		'https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=0&max=0',
	);
	handleResponseError(
		{ response, name: 'terms' },
	);

	// parse terms
	const parsed = await response.json();

	// validate response
	const validated = Terms.safeParse(parsed);
	if (!validated.success) {
		core.error('Terms failed validation.');
		console.log(validated.error);
		Deno.exit(1);
	}

	// return session cookies and terms
	return validated.data;
}

async function setTimetableTerm({ term }: { term: string }) {
	// set term
	const response = await fetch(
		'https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb/term/search' +
			'?mode=search' +
			`&term=${term}`,
	);
	handleResponseError(
		{ response, name: 'timetable term', verb: 'configure' },
	);

	// get set-cookies from headers
	const sessionCookies = handleResponseSetCookies(response.headers);
	if (!sessionCookies) {
		core.error('Failed to get session cookies.');
		Deno.exit(1);
	}

	// parse response
	const parsed = await response.json();

	// validate response
	const validated = z.object({
		fwdURL: z.literal(
			'/StudentRegistrationSsb/ssb/classSearch/classSearch',
		),
	}).strict().safeParse(parsed);
	if (!validated.success) {
		core.error('Timetable term setting failed validation.');
		console.log(validated.error);
		Deno.exit(1);
	}

	// return response
	return sessionCookies;
}

function getTimetableData({ requestOptions, term }: {
	requestOptions: RequestInit;
	term: string;
}): Promise<TimetableDataCount>;
function getTimetableData({ requestOptions, term, pageOffset }: {
	requestOptions: RequestInit;
	term: string;
	pageOffset: number;
}): Promise<TimetableData>;
async function getTimetableData(
	{ requestOptions, term, pageOffset }: {
		requestOptions: RequestInit;
		term: string;
		pageOffset?: number;
	},
) {
	// get timetable data
	const response = await fetch(
		'https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb/searchResults/searchResults' +
			'?pageMaxSize=500' +
			`&txt_term=${term}` +
			`&pageOffset=${pageOffset ?? -1}`,
		requestOptions,
	);
	handleResponseError(
		{
			response,
			name: `timetable data (${term}) ${
				pageOffset !== undefined ? '#' + (pageOffset / 500) : 'count'
			}`,
		},
	);

	// parse timetable data
	const parsed = await response.json();

	// validate response
	const validated = pageOffset === undefined
		? TimetableDataCount.safeParse(parsed)
		: TimetableData.safeParse(parsed);
	if (!validated.success) {
		core.error('Timetable data failed validation.');
		console.log(validated.error);
		Deno.exit(1);
	}

	// return timetable data
	return validated.data;
}

// MAIN SCRAPER

export async function scrape() {
	// get available terms
	const terms = await getTerms();

	// get latest term
	// const latestTerm = terms.sort((a, b) => b.code - a.code)[0];
	// latestTerm.code = 202207;

	// loop over the terms
	const timetables: {
		code: Terms[number]['code'];
		description: Terms[number]['description'];
		data: Timetable['courses'];
	}[] = [];
	for (const term of terms) {
		// set timetable term
		const sessionCookies = await setTimetableTerm({ term: term.code });

		// create request options with session info
		const sessionRequestOptions: RequestInit = {
			headers: {
				Cookie: sessionCookies.map((cookie) =>
					cookie.name + '=' + cookie.value
				)
					.join('; '),
			},
		};

		// get timetable data count
		const timetableData = await getTimetableData({
			term: term.code,
			requestOptions: sessionRequestOptions,
		});
		if (timetableData.totalCount === 0) {
			core.error('No courses found.', {
				title: term.description,
			});
		}

		// calculate number of pages
		const pages = Math.ceil(timetableData.totalCount / 500);

		// fetch all pages of data
		for (let i = 0; i < pages; i++) {
			const offsetTimetableData = await getTimetableData({
				term: term.code,
				requestOptions: sessionRequestOptions,
				pageOffset: i * 500,
			});

			timetableData.data.push(...offsetTimetableData.data);
		}

		timetables.push({ ...term, data: timetableData.data });
	}

	// return scraped data
	return timetables;
}

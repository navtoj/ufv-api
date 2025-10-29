import * as core from 'npm:@actions/core';
import {
	createSessionRequestOptions,
	handleResponseError,
	handleResponseSetCookies,
} from '../helpers/functions.ts';
import {
	SetTermResponse,
	Terms,
	Timetable,
	TimetableData,
	TimetableDataCount,
} from './types.ts';

// FETCH FUNCTIONS

export async function getTerms() {
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
		console.log(validated.error.issues);
		Deno.exit(1);
	}

	// return session cookies and terms
	return validated.data;
}

async function setTimetableTerm({ term }: { term: string }) {
	// set search term
	const response = await fetch(
		'https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb/term/search' +
			`?term=${term}`,
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
	const validated = SetTermResponse.safeParse(parsed);
	if (!validated.success) {
		core.error('Timetable term setting failed validation.');
		console.log(validated.error.issues);
		Deno.exit(1);
	}

	// return response
	return sessionCookies;
}

type getTimetableDataParams = {
	requestOptions: RequestInit;
	term: string;
	pageOffset: number;
};
function getTimetableData(
	input: Omit<getTimetableDataParams, 'pageOffset'>,
): Promise<TimetableDataCount>;
function getTimetableData(
	input: getTimetableDataParams,
): Promise<TimetableData>;

async function getTimetableData(
	{ requestOptions, term, pageOffset }:
		& Omit<getTimetableDataParams, 'pageOffset'>
		& {
			pageOffset?: number;
		},
) {
	// get timetable data
	const url =
		'https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb/searchResults/searchResults' +
		'?pageMaxSize=500' +
		`&txt_term=${term}` +
		`&pageOffset=${pageOffset ?? -1}`;
	const response = await fetch(url, requestOptions);
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
		console.log(url, validated.error.issues);
		// only run in github actions
		if (Deno.env.get('CI') === 'true') {
			core.startGroup('Parsed Data');
			console.log(parsed);
			core.endGroup();
		}
		Deno.exit(1);
	}

	// return timetable data
	return validated.data;
}

// MAIN SCRAPER

export async function scrape(
	term: Terms[number],
) {
	// set timetable term
	const sessionCookies = await setTimetableTerm({ term: term.code });

	// create request options with session info
	const requestOptions = createSessionRequestOptions(sessionCookies);

	// get timetable data count
	const timetableDataCount = await getTimetableData({
		term: term.code,
		requestOptions,
	});
	if (timetableDataCount === 0) {
		core.error('No courses found.', {
			title: term.description,
		});
	}

	// calculate number of pages
	const pages = Math.ceil(timetableDataCount / 500);

	// create array to store all timetable data
	const timetable: Timetable = {
		term: term.description,
		courses: [],
	};

	// fetch all pages of data
	for (let i = 0; i < pages; i++) {
		const timetableData = await getTimetableData({
			term: term.code,
			requestOptions: requestOptions,
			pageOffset: i * 500,
		});

		timetable.courses.push(...timetableData.data);
	}

	// return scraped data
	return timetable;
}

import * as core from 'npm:@actions/core';
import { AwardDetails, AwardListResponse } from './types.ts';

// HELPERS

function handleResponseError(
	{ response, name }: { response: Response; name: string },
	{ count }: { count: boolean } = { count: false },
) {
	if (!response.ok || response.status !== 200) {
		core.error(`Failed to fetch ${name}.`);
		Deno.exit(1);
	} else {
		if (count) {
			console.count(`Fetched ${name}`);
		} else {
			console.log(`Fetched ${name}.`);
		}
	}
}

// FETCH FUNCTIONS

async function getSessionCookies() {
	// get award guide
	const response = await fetch(
		'https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardGuide',
	);
	handleResponseError(
		{ response, name: 'award guide' },
	);

	// get set-cookies from response
	const parsed = response.headers.getSetCookie();

	// format set-cookies
	const formatted = parsed.flatMap(
		(c) => {
			const parts = c.split(';');
			const cookie = parts.at(0);
			if (!cookie) return [];
			const [name, value] = cookie.split('=');
			return { name, value };
		},
	);

	// return formatted cookies
	return formatted;
}

async function getAwardList(requestOptions: RequestInit) {
	// get award list
	const response = await fetch(
		'https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardList/getAwardList',
		requestOptions,
	);
	handleResponseError(
		{ response: response, name: 'award list' },
	);

	// parse award list
	const parsed = await response.json();

	// validate response
	const validated = AwardListResponse.safeParse(parsed);
	if (!validated.success) {
		core.error('Award list response failed validation.');
		console.log(validated.error);
		Deno.exit(1);
	}

	// return award list
	return validated.data;
}

async function getAwardDetails(
	code: string,
	requestOptions: RequestInit,
) {
	// get award details
	const response = await fetch(
		'https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardDetails/getAwardDetails?code=' +
			code,
		requestOptions,
	);
	handleResponseError(
		{ response: response, name: 'award details' },
		{ count: true },
	);

	// parse award details
	const parsed = await response.json();

	// validate award details
	const validated = AwardDetails.safeParse(parsed);
	if (!validated.success) {
		core.error('Award details failed validation.');
		console.log(validated.error);
		Deno.exit(1);
	}

	// return award details
	return validated.data;
}

// MAIN SCRAPER

export async function scrape() {
	// get session cookies
	const sessionCookies = await getSessionCookies();

	// create request options with session info
	const sessionRequestOptions: RequestInit = {
		headers: {
			Cookie: sessionCookies.map((cookie) =>
				cookie.name + '=' + cookie.value
			)
				.join('; '),
		},
	};

	// get award list
	const awardList = await getAwardList(sessionRequestOptions);

	// get details for each award
	const awards = [];
	for await (const award of awardList.result) {
		// get award details
		const awardDetails = await getAwardDetails(
			award.syvawgiAwrdCode,
			sessionRequestOptions,
		);

		// return award info combined with details
		awards.push({ info: award, details: awardDetails });
	}

	// return awards
	return { ...awardList, result: awards };
}

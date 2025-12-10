import * as core from 'npm:@actions/core';
import { createSessionRequestOptions, handleResponseError, handleResponseSetCookies } from '../helpers/functions.ts';
import { AwardDetails, AwardListResponse } from './types.ts';

// FETCH FUNCTIONS

async function getSessionCookies() {
	// get award guide
	const response = await fetch(
		'https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardGuide',
	);
	handleResponseError(
		{ response, name: 'award guide' },
	);

	// get set-cookies from headers
	return handleResponseSetCookies(response.headers);
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
	let parsed;
	try {
		parsed = await response.json();
	} catch (error) {
		const responseText = await response.text();
		core.debug(`Award list response: ${responseText}`);
		throw error;
	}

	// validate response
	const validated = AwardListResponse.safeParse(parsed);
	if (!validated.success) {
		core.error('Award list response failed validation.');
		console.log(validated.error.issues);
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
		console.log(validated.error.issues);
		Deno.exit(1);
	}

	// return award details
	return validated.data;
}

// MAIN SCRAPER

export async function scrape() {
	// get session cookies
	const sessionCookies = await getSessionCookies();
	if (!sessionCookies) {
		core.error('Failed to get session cookies.');
		Deno.exit(1);
	}

	// create request options with session info
	const sessionRequestOptions = createSessionRequestOptions(sessionCookies);

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

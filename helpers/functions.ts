import * as core from 'npm:@actions/core';

// FUNCTIONS

export function handleResponseError(
	{ response, name, verb = 'fetch' }: {
		response: Response;
		name: string;
		verb?: string;
	},
	{ count }: { count: boolean } = { count: false },
) {
	if (!response.ok || response.status !== 200) {
		core.error(`Failed to ${verb} ${name}.`);
		Deno.exit(1);
	} else {
		if (count) {
			console.count(`${
				verb.charAt(0).toUpperCase() +
				verb.slice(1)
			}${verb.endsWith('e') ? '' : 'e'}d ${name}`);
		} else {
			console.log(`${
				verb.charAt(0).toUpperCase() +
				verb.slice(1)
			}${verb.endsWith('e') ? '' : 'e'}d ${name}.`);
		}
	}
}

export function handleResponseSetCookies(headers: Headers) {
	// get set-cookies from response
	const parsed = headers.getSetCookie();

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
	return formatted.length ? formatted : null;
}

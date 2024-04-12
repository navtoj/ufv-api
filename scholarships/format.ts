import * as core from 'npm:@actions/core';
import { decode } from 'npm:html-entities@2.5.2';
import { scrape } from './scrape.ts';
import { AwardData, AwardInfo, DetailsData, ProgramData } from './types.ts';

type DetailsDataFields = { name: DetailsData[number]['label']; array?: true }[];

const awardFields: DetailsDataFields = [
	// { name: 'Code' },
	// { name: 'Name:' },
	// { name: 'Type:' },
	// { name: 'Description:' },
	// { name: 'Application Requires Additional Documentation?:' },
	{ name: 'Selection Process:' },
	{ name: 'Application Method:' },
	{ name: 'Apply To:' },
	{ name: 'Accept Applications?:' },
	{ name: 'Applications Accepted:', array: true },
	{ name: 'Ceremony:' },
	{ name: 'Biography:' },
] as const;

const programFields: DetailsDataFields = [
	{ name: 'Program Name:', array: true },
] as const;

function lowercaseFirstLetter(value: string) {
	return value.charAt(0).toLowerCase() + value.slice(1);
}

function getDetailField(
	data: DetailsData,
	field: { name: string; array?: true },
) {
	// find field in data
	const found = data.flatMap((item) => {
		if (item.label !== field.name) return [];
		//   format value
		const formatted = item.value.trim();
		//   check for html entities
		if (item.treatAsHTML) {
			// decode html entities
			return decode(formatted);
		}
		// return value
		return formatted;
	});

	// if field not found, return null
	if (found.length === 0) return null;

	// if only one value found, return it
	if (found.length === 1) return field.array ? found : found[0];

	// return all values
	return found;
}

export function format(data: Awaited<ReturnType<typeof scrape>>) {
	// loop through data
	const formatted = data.result.map((award) => {
		// get award data
		const awardData = Object.fromEntries(awardFields.map((field) => {
			// get field value
			const values = getDetailField(award.details.awardData, field);
			// format field name
			const name = field.name.replaceAll(/\s+|\??:$/g, '');
			// return field and value
			return [
				lowercaseFirstLetter(name),
				values,
			];
		}));

		// validate award data
		const validatedAwardData = AwardData.safeParse(awardData);
		if (!validatedAwardData.success) {
			core.error('Award data failed validation.');
			console.log(awardData);
			console.log(validatedAwardData.error.issues);
			Deno.exit(1);
		}

		// get program data
		const programData = Object.fromEntries(
			programFields
				.map((field) => {
					// get field value
					const values = getDetailField(
						award.details.programData,
						field,
					);
					// format field name
					const name = field.name.replaceAll(/\s+|\??:$/g, '');
					// return field and value
					return [
						lowercaseFirstLetter(name),
						values,
					];
				}),
		);

		// validate program data
		const validatedProgramData = ProgramData.safeParse(programData);
		if (!validatedProgramData.success) {
			core.error('Program data failed validation.');
			console.log(validatedProgramData.error.issues);
			Deno.exit(1);
		}

		// warn if facultyData is not empty
		if (award.details.facultyData.length > 0) {
			core.warning(JSON.stringify(award.details.facultyData), {
				title: 'Faculty Data Available',
			});
		}

		// validate award info
		const validatedInfo = AwardInfo.safeParse(award.info);
		if (!validatedInfo.success) {
			core.error('Award info failed validation.');
			console.log(validatedInfo.error.issues);
			Deno.exit(1);
		}

		// return formatted award
		return {
			info: validatedInfo.data,
			details: {
				...validatedAwardData.data,
				...validatedProgramData.data,
			},
		};
	});

	// return formatted;
	return { ...data, result: formatted };
}

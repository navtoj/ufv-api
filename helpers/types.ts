import { z } from 'https://deno.land/x/zod@v3.22.4/index.ts';

// REGEX
export const xStartToEnd = (regex: RegExp) => new RegExp('^' + regex.source + '$');

const xFloatingDigits = /^(?:[^0]\d*|0)\.\d+$/;
const xOneOrMoreDigits = /^\d+$/;

// Years: 2000 to 9999
export const xYYYY = /(?<year>[2-9]\d{3})/;
const xMMonth = /(?<month>0[1-9]|1[0-2])/;
const xYYYYMM = xStartToEnd(new RegExp(xYYYY.source + xMMonth.source));

const xDD = /(?<day>[0-2][1-9]|[1-3]0|31)/;
const xMMDDYYYY = xStartToEnd(
	new RegExp(xMMonth.source + '\/' + xDD.source + '\/' + xYYYY.source),
);

const xMMinute = /(?<minute>[0-5][0-9])/;
const xHH24 = /(?<hour>[0-1][0-9]|2[0-3])/;
const xHHMM24 = xStartToEnd(new RegExp(xHH24.source + xMMinute.source));

// TYPES

export const NonEmptyString = z.string().min(1);
export const DigitsString = z.string().regex(xOneOrMoreDigits);
export const FloatingDigitsString = z.string().regex(xFloatingDigits); //.transform((v) => Number(v));
export const FloatingDigitsNumber = z.number().refine((n) => {
	const string = n.toString();
	const float = string.indexOf('.') < 0 ? string + '.0' : string;
	const valid = xFloatingDigits.test(float);
	return valid;
}, 'Number should not be an integer.');

export const YYYYMM = z.string().regex(xYYYYMM);
export const MMDDYYYY = z.string().regex(xMMDDYYYY);
export const HHMM24 = z.string().regex(xHHMM24);

// FUNCTIONS

export const zTrimmedString = (type: Parameters<typeof z.preprocess>[1]) =>
	z.preprocess((v) => typeof v === 'string' ? v.trim() : v, type);

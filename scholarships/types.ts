import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { decode } from 'npm:html-entities@2.5.2';

const YesNoBoolean = z.union([z.literal('Yes'), z.literal('No')]).transform((
	v,
) => v === 'Yes');

// getAwardList

const Award = z.object({
	class: z.literal('net.hedtech.banner.finaid.SyvawgiDecorator').optional(),
	syvawgiAwrdCode: z.string().min(4),
	syvawgiAwrdDesc: z.string().min(1),
	syvawgiAtypDesc: z.string().min(1),
	syvawgiWebText: z.string().min(1),
	syvawgiApplAddDocInd: z.boolean(),
	addDocDesc: YesNoBoolean,
	syvawgiFundAmt: z.preprocess(
		(v) => {
			if (typeof v !== 'string') return v;
			if (v === '') return null;
			if (v.startsWith('&curren;')) return v.replace('&curren;', '$');
			return v;
		},
		z.string().startsWith('$').nullable(),
	),
}).strict();
type Award = z.infer<typeof Award>;

export const AwardListResponse = z.object({
	result: Award.array(),
	success: z.boolean(),
	length: z.number(),
	offset: z.number(),
	max: z.number(),
}).strict();

// getAwardDetails

const DetailsData = z.object({
	label: z.string().min(1),
	value: z.string().min(1),
	treatAsHTML: z.boolean(),
}).strict().array();
export type DetailsData = z.infer<typeof DetailsData>;

export const AwardDetails = z.object({
	awardsFound: z.boolean(),
	awardData: DetailsData,
	programFound: z.boolean(),
	programData: DetailsData,
	facultyFound: z.boolean(),
	facultyData: DetailsData,
}).strict();

// format data

export const AwardInfo = z.object(
	{
		syvawgiAwrdCode: Award.shape.syvawgiAwrdCode,
		syvawgiAwrdDesc: Award.shape.syvawgiAwrdDesc.transform((v) =>
			decode(v.trim())
		),
		syvawgiAtypDesc: Award.shape.syvawgiAtypDesc,
		syvawgiWebText: Award.shape.syvawgiWebText.transform((v) =>
			decode(v.trim())
		),
		syvawgiApplAddDocInd: Award.shape.syvawgiApplAddDocInd,
		syvawgiFundAmt: Award.shape.syvawgiFundAmt,
	} satisfies Partial<Record<keyof Award, unknown>>,
).transform((o) => {
	return {
		code: o.syvawgiAwrdCode,
		name: o.syvawgiAwrdDesc,
		type: o.syvawgiAtypDesc,
		description: o.syvawgiWebText,
		applicationRequiresAdditionalDocumentation: o.syvawgiApplAddDocInd,
		amount: o.syvawgiFundAmt,
	};
});
type AwardInfo = z.infer<typeof AwardInfo>;

export const AwardData = z.object({
	selectionProcess: z.string().min(1),
	applicationMethod: z.string().min(1),
	applyTo: z.string().min(1),
	acceptApplications: YesNoBoolean,
	applicationsAccepted: z.string()
		.regex(/^\w{3}\s\d{2},\s\d{4}\sto\s\w{3}\s\d{2},\s\d{4}$/)
		.array().nonempty().nullable(),
	ceremony: z.literal('Original Ceremony').nullable(),
	biography: z.string().nullable(),
}).strict();
export type AwardData = z.infer<typeof AwardData>;

export const ProgramData = z.object({
	programName: z.string().array().nullable(),
}).strict();

// database

export const Scholarships = z.object(
	{
		code: Award.shape.syvawgiAwrdCode,
		name: Award.shape.syvawgiAwrdDesc,
		type: Award.shape.syvawgiAtypDesc,
		description: Award.shape.syvawgiWebText,
		applicationRequiresAdditionalDocumentation:
			Award.shape.syvawgiApplAddDocInd,
		amount: Award.shape.syvawgiFundAmt,
	} satisfies Record<keyof AwardInfo, unknown>,
).merge(AwardData.extend(
	{
		acceptApplications: z.boolean(),
	} satisfies Partial<Record<keyof AwardData, unknown>>,
)).merge(ProgramData)
	.strict()
	.array();

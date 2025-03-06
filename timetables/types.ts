import { z } from 'https://deno.land/x/zod@v3.22.4/index.ts';
import {
	DigitsString,
	FloatingDigitsNumber,
	HHMM24,
	MMDDYYYY,
	NonEmptyString,
	xStartToEnd,
	xYYYY,
} from '../helpers/types.ts';

const xMMonth00 = /(?<month>0[0-9]|1[0-2])/;
const xYYYYMM00 = xStartToEnd(new RegExp(xYYYY.source + xMMonth00.source));

export const Terms = z.object({
	code: z.string().regex(xYYYYMM00),
	description: NonEmptyString,
}).strict().array().nonempty();
export type Terms = z.infer<typeof Terms>;

export const SetTermResponse = z.object({
	fwdURL: z.literal(
		'/StudentRegistrationSsb/ssb/null/null',
	),
}).strict();

export const TimetableData = z.object({
	success: z.literal(true),
	totalCount: z.number().nonnegative(),
	pageOffset: z.number().nonnegative(),
	pageMaxSize: z.number().nonnegative().max(500),
	sectionsFetchedCount: z.number().nonnegative(),
	pathMode: z.literal(null),
	ztcEncodedImage: z.string().nullable(),
	searchResultsConfigs: z.object({
		config: NonEmptyString,
		display: NonEmptyString,
		title: NonEmptyString,
		required: z.boolean(),
		width: NonEmptyString,
	}).strict().array().nonempty().nullable(),
	data: z.object({
		id: z.number().positive(),
		term: Terms.element.shape.code,
		termDesc: NonEmptyString,
		courseReferenceNumber: DigitsString,
		partOfTerm: NonEmptyString,
		courseNumber: NonEmptyString,
		subject: NonEmptyString,
		subjectDescription: NonEmptyString,
		sequenceNumber: NonEmptyString,
		campusDescription: NonEmptyString,
		scheduleTypeDescription: NonEmptyString,
		courseTitle: NonEmptyString,
		creditHours: z.number().nonnegative().nullable(),
		maximumEnrollment: z.number().nonnegative(),
		enrollment: z.number().nonnegative(),
		seatsAvailable: z.number().int(),
		waitCapacity: z.number().nonnegative(),
		waitCount: z.number().int(),
		waitAvailable: z.number().nonnegative(),
		crossList: NonEmptyString.nullable(),
		crossListCapacity: z.number().positive().nullable(),
		crossListCount: z.number().nonnegative().nullable(),
		crossListAvailable: z.number().int().nullable(),
		creditHourHigh: z.number().positive().nullable(),
		creditHourLow: z.number().nonnegative(),
		creditHourIndicator: NonEmptyString.nullable(),
		openSection: z.boolean(),
		linkIdentifier: NonEmptyString.nullable(),
		isSectionLinked: z.boolean(),
		subjectCourse: NonEmptyString,
		faculty: z.object({
			bannerId: DigitsString,
			category: DigitsString.nullable(),
			class: NonEmptyString,
			courseReferenceNumber: DigitsString,
			displayName: NonEmptyString,
			emailAddress: NonEmptyString.nullable(),
			primaryIndicator: z.boolean(),
			term: Terms.element.shape.code,
		}).strict().array(),
		meetingsFaculty: z.object({
			category: DigitsString,
			class: NonEmptyString,
			courseReferenceNumber: DigitsString,
			faculty: z.unknown().array(),
			meetingTime: z.object({
				beginTime: HHMM24.nullable(),
				building: NonEmptyString.nullable(),
				buildingDescription: NonEmptyString.nullable(),
				campus: NonEmptyString.nullable(),
				campusDescription: NonEmptyString.nullable(),
				category: DigitsString,
				class: NonEmptyString,
				courseReferenceNumber: DigitsString,
				creditHourSession: FloatingDigitsNumber.pipe(
					z.number().nonnegative(),
				).nullable(),
				endDate: MMDDYYYY,
				endTime: HHMM24.nullable(),
				friday: z.boolean(),
				hoursWeek: FloatingDigitsNumber.pipe(z.number().nonnegative()),
				meetingScheduleType: NonEmptyString,
				meetingType: NonEmptyString,
				meetingTypeDescription: NonEmptyString,
				monday: z.boolean(),
				room: NonEmptyString.nullable(),
				saturday: z.boolean(),
				startDate: MMDDYYYY,
				sunday: z.boolean(),
				term: Terms.element.shape.code,
				thursday: z.boolean(),
				tuesday: z.boolean(),
				wednesday: z.boolean(),
			}).strict(),
			term: Terms.element.shape.code,
		}).strict().array(),
		reservedSeatSummary: z.object({
			class: z.literal(
				'net.hedtech.banner.student.schedule.SectionReservedSeatSummaryDecorator',
			),
			courseReferenceNumber: DigitsString,
			maximumEnrollmentReserved: z.number().nonnegative(),
			maximumEnrollmentUnreserved: z.number().nonnegative(),
			seatsAvailableReserved: z.number().int(), // was -1 once
			seatsAvailableUnreserved: z.number().int(), // was -1 once
			termCode: Terms.element.shape.code,
			waitAvailableReserved: z.number().nonnegative(),
			waitAvailableUnreserved: z.number().int(), // was -2 once
			waitCapacityReserved: z.number().nonnegative(),
			waitCapacityUnreserved: z.number().nonnegative(),
		}).strict().nullable(),
		sectionAttributes: z.literal(null),
		instructionalMethod: NonEmptyString.nullable(),
		instructionalMethodDescription: NonEmptyString.nullable(),
	}).strict().array(),
}).strict();
export type TimetableData = z.infer<typeof TimetableData>;

export const TimetableDataCount = TimetableData.extend({
	success: z.literal(false),
	data: TimetableData.shape.data.length(0),
	pageOffset: z.literal(-1),
}).transform((data) => data.totalCount);
export type TimetableDataCount = z.infer<typeof TimetableDataCount>;

export const Timetable = z.object({
	term: Terms.element.shape.description,
	courses: TimetableData.shape.data.element.extend({
		faculty: TimetableData.shape.data.element.shape.faculty.element.omit({
			bannerId: true,
		}).strip().array(),
	}).strict().array(),
}).strict();
export type Timetable = z.infer<typeof Timetable>;

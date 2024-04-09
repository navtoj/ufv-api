import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const Data = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  treatAsHTML: z.boolean(),
}).strict().array();

export const Awards = z.object({
  addDocDesc: z.union([z.literal("Yes"), z.literal("No")]),
  class: z.literal("net.hedtech.banner.finaid.SyvawgiDecorator"),
  syvawgiApplAddDocInd: z.boolean(),
  syvawgiAtypDesc: z.string().min(1),
  syvawgiAwrdCode: z.string().min(4),
  syvawgiAwrdDesc: z.string().min(1),
  syvawgiFundAmt: z.preprocess(
    (v) => v === "" ? null : v,
    z.string().startsWith("$").nullable(),
  ),
  syvawgiWebText: z.string().min(1),
  awardsFound: z.boolean(),
  awardData: Data,
  programFound: z.boolean(),
  programData: Data,
  facultyFound: z.boolean(),
  facultyData: Data,
}).strict().array();
export type Awards = z.infer<typeof Awards>;

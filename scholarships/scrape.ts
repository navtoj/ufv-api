// deno run --watch --allow-net --allow-write scholarships/scrape.ts

// STATIC VARIABLES

const awardGuideUrl =
  "https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardGuide";
const awardListUrl =
  "https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardList/getAwardList";
const awardDetailsUrl =
  "https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardDetails/getAwardDetails?code=";

// GET SESSION COOKIES

const awardGuideResponse = await fetch(awardGuideUrl);

// if fetch failed, log error and exit

if (!awardGuideResponse.ok || awardGuideResponse.status !== 200) {
  console.error("Failed to fetch award guide.");
  Deno.exit(1);
} else {
  console.log("Fetched award guide.");
}

// parse cookies from response and write to file

const awardGuideCookies = awardGuideResponse.headers.getSetCookie().flatMap(
  (c) => {
    const parts = c.split(";");
    const cookie = parts.at(0);
    if (!cookie) return [];
    const [name, value] = cookie.split("=");
    return { name, value };
  },
);

// CREATE REQUEST OPTIONS WITH COOKIE HEADER

const requestOptionsWithCookieHeader: RequestInit = {
  headers: {
    Cookie: awardGuideCookies.map((cookie) => cookie.name + "=" + cookie.value)
      .join("; "),
  },
};

// GET AWARD LIST

const awardListResponse = await fetch(
  awardListUrl,
  requestOptionsWithCookieHeader,
);

// if fetch failed, log error and exit

if (!awardListResponse.ok || awardListResponse.status !== 200) {
  console.error("Failed to fetch award list.");
  Deno.exit(1);
} else {
  console.log("Fetched award list.");
}

// parse award list and write to file

const awardList = await awardListResponse.json();

// GET DETAILS FOR EACH AWARD

const awards = [];
for await (const award of awardList.result) {
  // get award details

  const awardDetailsResponse = await fetch(
    awardDetailsUrl + award.syvawgiAwrdCode,
    requestOptionsWithCookieHeader,
  );

  // if fetch failed, log error and exit

  if (!awardDetailsResponse.ok || awardDetailsResponse.status !== 200) {
    console.error("Failed to fetch award details.");
    console.log(awardDetailsResponse);
    Deno.exit(1);
  } else {
    console.count("Fetched award details.");
  }

  // parse award details and add to awards array

  const awardDetails = await awardDetailsResponse.json();
  awards.push({ ...award, ...awardDetails });
}
Deno.writeTextFile(
  import.meta.dirname + "/awards.json",
  JSON.stringify(awards, null, "\t"),
);

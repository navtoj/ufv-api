# UFV — Data API
A collection of data APIs for the University of the Fraser Valley.
### https://navtoj.github.io/ufv-api/

## Scholarships
[![Update Scholarships](https://github.com/navtoj/ufv-api/actions/workflows/scholarships.yml/badge.svg?branch=main)](https://github.com/navtoj/ufv-api/actions/workflows/scholarships.yml)
### Source
https://apps.ban.ufv.ca/BcFinaidSelfService/ssb/awardGuide
### Update Frequency
Runs every day at 00:00 UTC.
```
cron: '0 0 * * *'
```

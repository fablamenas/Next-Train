# RER C Schedule App

Simple Next.js application that displays upcoming RER C departures.

This version queries the official SNCF API using the `journeys` endpoint:
`https://api.sncf.com/v1/coverage/sncf/journeys`.

## Configuration

Set an environment variable `SNCF_API_KEY` (or `API_SNCF_KEY`) with a valid
token from [SNCF Open Data](https://api.sncf.com/). Requests without a valid
key will fail with a 401/403 response.

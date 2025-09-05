# RER C Schedule App

Simple Next.js application that displays upcoming RER C departures.

This version queries the official SNCF API using the `journeys` endpoint:
`https://api.sncf.com/v1/coverage/sncf/journeys`.

## Environment variables

- `SNCF_API_KEY` or `API_SNCF_KEY`: SNCF API key.
- `SNCF_API_DEBUG`: set to `true` to enable verbose logging of requests and processed responses.

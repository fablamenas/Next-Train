# RER C Schedule App

Simple Next.js application that displays the next direct RER C trains
from Issy-Val-de-Seine to Versailles Château Rive Gauche.

This version queries the official SNCF API using the `journeys` endpoint:
`https://api.sncf.com/v1/coverage/sncf/journeys` with `allowed_id[]=line:SNCF:C`.

## Caching

API requests are explicitly executed with `cache: "no-store"` to ensure every
call hits the live SNCF service and always returns fresh data. This means no
server-side caching is performed, which could increase the number of requests
in production.

## Environment variables

- `SNCF_API_KEY` : API key for api.sncf.com.


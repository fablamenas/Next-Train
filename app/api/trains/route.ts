import { NextResponse } from "next/server"

const SNCF_API_BASE = "https://api.sncf.com/v1"
const FROM_STOP_AREA = "stop_area:SNCF:87393306" // Issy-Val-de-Seine (RER C)
const TO_STOP_AREA = "stop_area:SNCF:87393157" // Versailles Château Rive Gauche

interface SNCFJourneysResponse {
  journeys: Array<{
    departure_date_time: string
    arrival_date_time: string
    duration: number
    sections: Array<{
      type: string
      display_informations?: {
        headsign: string
        label: string
        trip_short_name: string
      }
    }>
  }>
}

function parseDateTime(dateTimeStr: string): { iso: string; time: string } {
  const match = dateTimeStr.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/
  )
  if (!match) {
    return { iso: "", time: "" }
  }
  const [, y, m, d, h, min, s] = match
  const date = new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s))

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  )
  const isoWithoutOffset = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  const tzPart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value || "GMT+0"
  const offsetMatch = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const sign = offsetMatch ? offsetMatch[1] : "+"
  const hh = offsetMatch ? offsetMatch[2].padStart(2, "0") : "00"
  const mm = offsetMatch && offsetMatch[3] ? offsetMatch[3].padStart(2, "0") : "00"
  const iso = `${isoWithoutOffset}${sign}${hh}:${mm}`
  const time = `${parts.hour}:${parts.minute}`
  return { iso, time }
}

export async function GET() {
  let url = ""
  try {
    const apiKey = process.env.NAVITIA_API_KEY

    if (!apiKey) {
      console.error("Navitia API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const authHeader = "Basic " + Buffer.from(`${apiKey}:`).toString("base64")

    url = `${SNCF_API_BASE}/coverage/sncf/journeys?from=${FROM_STOP_AREA}&to=${TO_STOP_AREA}&count=6&datetime_represents=departure&max_nb_transfers=0&allowed_id[]=line:SNCF:C&disable_geojson=true`

    console.log("SNCF API request URL:", url)

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errBody = await response.text()

      console.error("SNCF API error:", response.status, errBody, "URL:", url)

      throw new Error(`SNCF API error: ${response.status} ${errBody}`)
    }

    const data: SNCFJourneysResponse = await response.json()

    const journeys = data.journeys
      .map((journey) => {
        const ptSection = journey.sections.find((s) => s.type === "public_transport")
        if (!ptSection || !ptSection.display_informations) return null

        const dep = parseDateTime(journey.departure_date_time)
        const arr = parseDateTime(journey.arrival_date_time)

        return {
          mission: ptSection.display_informations.headsign,
          line: ptSection.display_informations.label,
          trip: ptSection.display_informations.trip_short_name,
          departure: dep.iso,
          departure_time: dep.time,
          arrival: arr.iso,
          arrival_time: arr.time,
          duration_s: journey.duration,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ journeys })
  } catch (error) {
    console.error("Error fetching SNCF data:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue"

    return NextResponse.json(
      { error: `Erreur API SNCF lors de l'appel à ${url} : ${errorMessage}` },
      { status: 502 }
    )
  }
}

import { NextResponse } from "next/server"

const SNCF_API_BASE = "https://api.sncf.com/v1"

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
      stop_date_times?: Array<{
        departure_date_time: string
        arrival_date_time: string
        base_departure_date_time?: string
        base_arrival_date_time?: string
      }>
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
  const isoWithoutOffset = `${y}-${m}-${d}T${h}:${min}:${s}`

  // Determine the proper offset for Europe/Paris at the given date
  const tzPart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(`${isoWithoutOffset}Z`))
    .find((p) => p.type === "timeZoneName")?.value || "GMT+0"
  const offsetMatch = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const sign = offsetMatch ? offsetMatch[1] : "+"
  const hh = offsetMatch ? offsetMatch[2].padStart(2, "0") : "00"
  const mm = offsetMatch && offsetMatch[3] ? offsetMatch[3].padStart(2, "0") : "00"
  const offset = `${sign}${hh}:${mm}`

  const iso = `${isoWithoutOffset}${offset}`
  const time = `${h}:${min}`
  return { iso, time }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing from/to parameters" },
      { status: 400 }
    )
  }
  let url = ""
  try {
    const apiKey = process.env.SNCF_API_KEY

    if (!apiKey) {
      console.error("Navitia API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const authHeader = "Basic " + Buffer.from(`${apiKey}:`).toString("base64")

    url = `${SNCF_API_BASE}/coverage/sncf/journeys?from=${from}&to=${to}&count=6&datetime_represents=departure&allowed_id[]=line:SNCF:C&disable_geojson=true&data_freshness=realtime`

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
        if (!ptSection || !ptSection.display_informations || !ptSection.stop_date_times)
          return null

        const stops = ptSection.stop_date_times
        if (stops.length === 0) return null
        const firstStop = stops[0]
        const lastStop = stops[stops.length - 1]

        const dep = parseDateTime(firstStop.departure_date_time)
        const arr = parseDateTime(lastStop.arrival_date_time)
        const baseDep = firstStop.base_departure_date_time
          ? parseDateTime(firstStop.base_departure_date_time)
          : dep
        const baseArr = lastStop.base_arrival_date_time
          ? parseDateTime(lastStop.base_arrival_date_time)
          : arr

        const delayMin = Math.round(
          (new Date(dep.iso).getTime() - new Date(baseDep.iso).getTime()) / 60000
        )
        const arrivalDelayMin = Math.round(
          (new Date(arr.iso).getTime() - new Date(baseArr.iso).getTime()) / 60000
        )

        return {
          mission: ptSection.display_informations.headsign,
          line: ptSection.display_informations.label,
          trip: ptSection.display_informations.trip_short_name,
          departure: dep.iso,
          departure_time: dep.time,
          arrival: arr.iso,
          arrival_time: arr.time,
          duration_s: journey.duration,
          delay_min: delayMin,
          arrival_delay_min: arrivalDelayMin,
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

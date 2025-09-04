import { NextResponse } from "next/server"

const SNCF_API_BASE = "https://api.sncf.com/v1"
const FROM_STOP_AREA = "stop_area:OCE:SA:87758011" // Issy - Val de Seine
const TO_STOP_AREA = "stop_area:OCE:SA:87393009" // Versailles Rive Gauche

interface SNCFJourneysResponse {
  journeys: Array<{
    sections: Array<{
      type: string
      departure_date_time: string
      arrival_date_time: string
      display_informations?: {
        headsign: string
        network: string
        direction: string
        commercial_mode: string
        physical_mode: string
        label: string
        color: string
        code: string
      }
    }>
  }>
}

function parseDateTime(dateTimeStr: string): { time: string; delay: number } {
  const match = dateTimeStr.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/
  )
  if (!match) {
    return { time: "", delay: 0 }
  }
  const [, y, m, d, h, min, s] = match
  const date = new Date(`${y}-${m}-${d}T${h}:${min}:${s}`)
  const time = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Delay information not provided by the API in this endpoint
  const delay = 0

  return { time, delay }
}

export async function GET() {
  try {
    const apiKey = process.env.SNCF_API_KEY || process.env.API_SNCF_KEY

    if (!apiKey) {
      console.error("SNCF API key not found")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const authHeader =
      apiKey.startsWith("Basic ")
        ? apiKey
        : "Basic " + Buffer.from(`${apiKey}:`).toString("base64")

    const from = encodeURIComponent(FROM_STOP_AREA)
    const to = encodeURIComponent(TO_STOP_AREA)
    const url = `${SNCF_API_BASE}/coverage/sncf/journeys?from=${from}&to=${to}&count=6`

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "User-Agent": "next-train-demo",
      },
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error("SNCF API error:", response.status, errBody)
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Accès refusé à l'API SNCF" },
          { status: 502 }
        )
      }
      throw new Error(`SNCF API error: ${response.status}`)
    }

    const data: SNCFJourneysResponse = await response.json()

    const departures = data.journeys
      .map((journey, index) => {
        const ptSection = journey.sections.find((s) => s.type === "public_transport")
        if (!ptSection || !ptSection.display_informations) return null
        const { time, delay } = parseDateTime(ptSection.departure_date_time)

        return {
          time,
          destination: ptSection.display_informations.direction || "Destination inconnue",
          mission: ptSection.display_informations.code || `M${index + 1}`,
          delay,
          status: delay > 0 ? ("delayed" as const) : ("on-time" as const),
        }
      })
      .filter(Boolean)

    return NextResponse.json({ departures })
  } catch (error) {
    console.error("Error fetching SNCF data:", error)

    return NextResponse.json(
      { error: "API SNCF indisponible" },
      { status: 502 }
    )
  }
}

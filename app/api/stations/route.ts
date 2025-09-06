import { NextResponse } from "next/server"

const SNCF_API_BASE = "https://api.sncf.com/v1"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const apiKey = process.env.SNCF_API_KEY

  if (!apiKey) {
    console.error("Navitia API key not found")
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  if (!query) {
    return NextResponse.json({ stations: [] })
  }

  const authHeader = "Basic " + Buffer.from(`${apiKey}:`).toString("base64")
  const url = `${SNCF_API_BASE}/coverage/sncf/stop_areas?q=${encodeURIComponent(query)}&count=10`

  try {
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

    const data = await response.json()
    const stations = (data.stop_areas || []).map((s: any) => ({ id: s.id, name: s.name }))
    return NextResponse.json({ stations })
  } catch (error) {
    console.error("Error fetching SNCF stations:", error)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    return NextResponse.json(
      { error: `Erreur API SNCF lors de l'appel à ${url} : ${errorMessage}` },
      { status: 502 }
    )
  }
}

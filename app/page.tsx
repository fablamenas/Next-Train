"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { RefreshCw, Train } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrainJourney {
  mission: string
  line: string
  trip: string
  departure: string
  departure_time: string
  arrival: string
  arrival_time: string
  duration_s: number
  delay_min: number
}

interface Station {
  id: string
  name: string
}

const DEFAULT_FROM: Station = {
  id: "stop_area:SNCF:87393306",
  name: "Issy-Val-de-Seine",
}

const DEFAULT_TO: Station = {
  id: "stop_area:SNCF:87393157",
  name: "Versailles Château Rive Gauche",
}

export default function RERSchedule() {
  const [journeys, setJourneys] = useState<TrainJourney[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState<Station>(DEFAULT_FROM)
  const [to, setTo] = useState<Station>(DEFAULT_TO)
  const [fromQuery, setFromQuery] = useState("")
  const [toQuery, setToQuery] = useState("")
  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([])
  const [toSuggestions, setToSuggestions] = useState<Station[]>([])
  const [initialized, setInitialized] = useState(false)

  const fetchDepartures = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/trains?from=${encodeURIComponent(from.id)}&to=${encodeURIComponent(to.id)}`
      )
      if (response.ok) {
        const data = await response.json()
        setJourneys(data.journeys)
        setLastUpdate(new Date())
      } else {
        const data = await response.json().catch(() => null)
        setError(data?.error || "Erreur lors de la récupération des horaires")
        setJourneys([])
      }
    } catch (error) {
      console.error("Error fetching departures:", error)
      setError("Erreur lors de la récupération des horaires")
      setJourneys([])
    }
    setLoading(false)
  }

  const searchStations = async (q: string) => {
    const res = await fetch(`/api/stations?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      return data.stations as Station[]
    }
    return []
  }

  const handleFromChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromQuery(value)
    if (value.length >= 2) {
      setFromSuggestions(await searchStations(value))
    } else {
      setFromSuggestions([])
    }
  }

  const handleToChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToQuery(value)
    if (value.length >= 2) {
      setToSuggestions(await searchStations(value))
    } else {
      setToSuggestions([])
    }
  }

  const selectFrom = (station: Station) => {
    setFrom(station)
    setFromQuery(station.name)
    setFromSuggestions([])
    localStorage.setItem("fromStation", JSON.stringify(station))
  }

  const selectTo = (station: Station) => {
    setTo(station)
    setToQuery(station.name)
    setToSuggestions([])
    localStorage.setItem("toStation", JSON.stringify(station))
  }

  useEffect(() => {
    const storedFrom = localStorage.getItem("fromStation")
    const storedTo = localStorage.getItem("toStation")
    if (storedFrom) {
      const st = JSON.parse(storedFrom)
      setFrom(st)
      setFromQuery(st.name)
    } else {
      setFromQuery(DEFAULT_FROM.name)
    }
    if (storedTo) {
      const st = JSON.parse(storedTo)
      setTo(st)
      setToQuery(st.name)
    } else {
      setToQuery(DEFAULT_TO.name)
    }
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (initialized) {
      fetchDepartures()
    }
  }, [from, to, initialized])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Train className="h-6 w-6" />
              RER C
            </CardTitle>
            <p className="text-purple-100 text-sm">{from.name} → {to.name}</p>
          </CardHeader>
        </Card>

        {/* Station selectors */}
        <div className="space-y-2">
          <div className="relative">
            <input
              value={fromQuery}
              onChange={handleFromChange}
              placeholder="Station de départ"
              className="w-full rounded border border-gray-300 px-3 py-2"
              autoComplete="off"
            />
            {fromSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-y-auto">
                {fromSuggestions.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectFrom(s)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <input
              value={toQuery}
              onChange={handleToChange}
              placeholder="Station d'arrivée"
              className="w-full rounded border border-gray-300 px-3 py-2"
              autoComplete="off"
            />
            {toSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-y-auto">
                {toSuggestions.map((s) => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectTo(s)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={fetchDepartures}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser les horaires
        </Button>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-sm text-gray-500">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        {/* Departures List */}
        <div className="space-y-3">
          {journeys.map((journey, index) => (
            <Card key={index} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900 font-mono">{journey.departure_time}</div>
                    <div className="text-sm text-gray-500 font-mono">→ {journey.arrival_time}</div>
                  </div>
                  <div className="text-base text-gray-700 font-mono font-medium">
                    [{journey.mission}]
                    {journey.delay_min > 0 && (
                      <span className="text-red-600"> (+{journey.delay_min}min)</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

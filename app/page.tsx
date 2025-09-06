"use client"

import { useState, useEffect } from "react"
import { Train } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StationPicker, Station } from "@/components/station-picker"
import { usePersistedState } from "@/lib/usePersistedState"

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
  arrival_delay_min: number
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
  const [from, setFrom] = usePersistedState<Station | null>(
    "sncf.fromStopArea",
    DEFAULT_FROM
  )
  const [to, setTo] = usePersistedState<Station | null>(
    "sncf.toStopArea",
    DEFAULT_TO
  )
  const [journeys, setJourneys] = useState<TrainJourney[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSearch = !!(from && to && from.id !== to.id)

  const fetchJourneys = async (f: Station, t: Station) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/trains?from=${encodeURIComponent(f.id)}&to=${encodeURIComponent(t.id)}`
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

  const handleSearch = () => {
    if (from && to) fetchJourneys(from, to)
  }

  const swapStations = () => {
    setFrom(to)
    setTo(from)
    if (from && to) fetchJourneys(to, from)
  }

  useEffect(() => {
    if (from && to) {
      fetchJourneys(from, to)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header & itinerary */}
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Train className="h-6 w-6" />
              RER C
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-purple-100 text-sm">Itinéraire</p>
            <div className="flex flex-wrap items-end gap-2 text-gray-900">
              <StationPicker
                label="Départ"
                placeholder="Station de départ"
                value={from}
                onChange={setFrom}
              />
              <Button
                variant="secondary"
                onClick={swapStations}
                className="px-2 shrink-0 self-center"
              >
                ⇄
              </Button>
              <StationPicker
                label="Arrivée"
                placeholder="Station d'arrivée"
                value={to}
                onChange={setTo}
              />
              <Button
                onClick={handleSearch}
                disabled={!canSearch || loading}
                className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Rechercher
              </Button>
            </div>
            {!canSearch && (
              <p className="text-purple-100 text-sm">
                Sélectionnez deux gares différentes
              </p>
            )}
          </CardContent>
        </Card>

        {lastUpdate && (
          <p className="text-center text-sm text-gray-500">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-3">
          {journeys.map((journey, index) => (
            <Card key={index} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900 font-mono">
                      {journey.departure_time}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      → {journey.arrival_time}
                    </div>
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
          {journeys.length === 0 && !loading && !error && (
            <p className="text-center text-sm text-gray-500">Aucun résultat</p>
          )}
        </div>
      </div>
    </div>
  )
}

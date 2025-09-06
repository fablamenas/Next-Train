"use client"

import { useState, useEffect } from "react"
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

export default function RERSchedule() {
  const [journeys, setJourneys] = useState<TrainJourney[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartures = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/trains")
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

  useEffect(() => {
    fetchDepartures()
  }, [])

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
            <p className="text-purple-100 text-sm">Issy-Val-de-Seine → Versailles Château Rive Gauche</p>
          </CardHeader>
        </Card>

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

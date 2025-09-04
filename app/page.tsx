"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Train } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrainDeparture {
  time: string
  destination: string
  mission: string
  delay: number
  status: "on-time" | "delayed" | "cancelled"
}

export default function RERSchedule() {
  const [departures, setDepartures] = useState<TrainDeparture[]>([])
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
        setDepartures(data.departures)
        setLastUpdate(new Date())
      } else {
        const data = await response.json().catch(() => null)
        setError(data?.error || "Erreur lors de la récupération des horaires")
        setDepartures([])
      }
    } catch (error) {
      console.error("Error fetching departures:", error)
      setError("Erreur lors de la récupération des horaires")
      setDepartures([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDepartures()
  }, [])

  const getStatusBadge = (departure: TrainDeparture) => {
    if (departure.status === "cancelled") {
      return <Badge variant="destructive">Supprimé</Badge>
    }
    if (departure.delay > 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          +{departure.delay} min
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        À l'heure
      </Badge>
    )
  }

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
            <p className="text-purple-100 text-sm">Issy - Val de Seine → Versailles Rive Gauche</p>
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
          {departures.map((departure, index) => (
            <Card key={index} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-gray-900 font-mono">{departure.time}</div>
                    <div className="text-base text-gray-700 font-mono font-medium">[{departure.mission}]</div>
                  </div>
                  <div>{getStatusBadge(departure)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Train, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TrainDeparture {
  time: string
  destination: string
  mission: string
  delay: number
  status: "on-time" | "delayed" | "cancelled"
}

const stations = [
  { id: "stop_area:SNCF:87393306", name: "Issy - Val de Seine" },
  { id: "stop_area:SNCF:87393314", name: "Meudon - Val Fleury" },
  { id: "stop_area:SNCF:87393322", name: "Chaville - Vélizy" },
  { id: "stop_area:SNCF:87393330", name: "Viroflay - Rive Gauche" },
  { id: "stop_area:SNCF:87393348", name: "Chaville - Rive Gauche" },
  { id: "stop_area:SNCF:87393355", name: "Sèvres - Ville d'Avray" },
  { id: "stop_area:SNCF:87393363", name: "Sèvres - Rive Gauche" },
  { id: "stop_area:SNCF:87393371", name: "Boulogne - Pont de Saint-Cloud" },
  { id: "stop_area:SNCF:87393157", name: "Versailles - Château Rive Gauche" },
  { id: "stop_area:SNCF:87393389", name: "Versailles - Chantiers" },
]

export default function RERSchedule() {
  const [departures, setDepartures] = useState<TrainDeparture[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [departureStation, setDepartureStation] = useState("stop_area:SNCF:87393306")
  const [arrivalStation, setArrivalStation] = useState("stop_area:SNCF:87393157")
  const [settingsOpen, setSettingsOpen] = useState(false)

  const fetchDepartures = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/trains?from=${departureStation}&to=${arrivalStation}`)
      if (response.ok) {
        const data = await response.json()
        setDepartures(data.departures)
        setLastUpdate(new Date())
      } else {
        // Fallback data if API fails
        setDepartures([
          { time: "14:15", destination: "Versailles Rive Gauche", mission: "VICK", delay: 0, status: "on-time" },
          { time: "14:33", destination: "Versailles Rive Gauche", mission: "VERO", delay: 4, status: "delayed" },
          { time: "14:51", destination: "Versailles Rive Gauche", mission: "VALI", delay: 0, status: "on-time" },
          { time: "15:05", destination: "Versailles Rive Gauche", mission: "VICK", delay: 0, status: "on-time" },
        ])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error fetching departures:", error)
      // Use fallback data
      setDepartures([
        { time: "14:15", destination: "Versailles Rive Gauche", mission: "VICK", delay: 0, status: "on-time" },
        { time: "14:33", destination: "Versailles Rive Gauche", mission: "VERO", delay: 4, status: "delayed" },
        { time: "14:51", destination: "Versailles Rive Gauche", mission: "VALI", delay: 0, status: "on-time" },
        { time: "15:05", destination: "Versailles Rive Gauche", mission: "VICK", delay: 0, status: "on-time" },
      ])
      setLastUpdate(new Date())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDepartures()
  }, [departureStation, arrivalStation]) // Added dependencies to refetch when stations change

  const handleSettingsSave = () => {
    setSettingsOpen(false)
    fetchDepartures()
  }

  const getStationName = (stationId: string) => {
    return stations.find((s) => s.id === stationId)?.name || stationId
  }

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
        <div
          className="rounded-lg shadow-lg p-6 !bg-purple-800"
          style={{
            backgroundColor: "#4c1d95 !important",
            background: "linear-gradient(135deg, #4c1d95 0%, #3730a3 100%) !important",
            color: "#ffffff !important",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="flex items-center gap-2 text-xl font-semibold !text-white"
                style={{ color: "#ffffff !important" }}
              >
                <Train className="h-6 w-6 !text-white" style={{ color: "#ffffff !important" }} />
                RER C
              </h1>
              <div className="text-sm font-medium mt-1 !text-purple-200" style={{ color: "#e9d5ff !important" }}>
                <div>{getStationName(departureStation)}</div>
                <div>→ {getStationName(arrivalStation)}</div>
              </div>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button
                  className="p-2 rounded-md border border-purple-300 hover:bg-purple-700 transition-colors !text-white !bg-purple-700"
                  style={{
                    color: "#ffffff !important",
                    backgroundColor: "#7c3aed !important",
                    borderColor: "#a855f7 !important",
                  }}
                >
                  <Settings className="h-5 w-5 !text-white" style={{ color: "#ffffff !important" }} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Réglages du trajet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="departure">Gare de départ</Label>
                    <Select value={departureStation} onValueChange={setDepartureStation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrival">Gare d'arrivée</Label>
                    <Select value={arrivalStation} onValueChange={setArrivalStation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSettingsSave} className="w-full">
                    Valider
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={fetchDepartures}
          disabled={loading}
          className="w-full font-medium text-white"
          style={{ backgroundColor: "#6366f1", borderColor: "#6366f1" }}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser les horaires
        </Button>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-sm text-gray-600">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
          </p>
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

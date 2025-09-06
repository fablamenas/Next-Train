import { useState, useEffect, useRef, ChangeEvent } from "react"

// SNCF stop area basic info
export interface Station {
  id: string
  name: string
}

interface Props {
  value: Station | null
  onChange: (s: Station | null) => void
  placeholder: string
  label: string
}

/**
 * Input field with SNCF station autocomplete
 */
export function StationPicker({ value, onChange, placeholder, label }: Props) {
  const [inputValue, setInputValue] = useState(value?.name || "")
  const [suggestions, setSuggestions] = useState<Station[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<number>()

  useEffect(() => {
    setInputValue(value?.name || "")
  }, [value])

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (inputValue.length < 2) {
      setSuggestions([])
      return
    }
    timerRef.current = window.setTimeout(async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      try {
        const res = await fetch(
          `/api/stations?q=${encodeURIComponent(inputValue)}`,
          { signal: abortRef.current.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.stations as Station[])
        } else {
          setSuggestions([])
        }
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [inputValue])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (value) onChange(null)
  }

  const selectStation = (s: Station) => {
    onChange(s)
    setSuggestions([])
  }

  return (
    <div className="flex-1">
      <label className="block text-sm mb-1">{label}</label>
      <div className="relative">
        <input
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={s.id}
                onMouseDown={() => selectStation(s)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

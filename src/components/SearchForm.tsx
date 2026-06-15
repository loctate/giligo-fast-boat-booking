"use client"

import { useState } from "react"

export default function SearchForm() {
  const [tripType, setTripType] = useState<"one-way" | "round-trip">(
    "one-way"
  )

  return (
    <form action="/search" method="GET">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <label className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name="tripType"
            value="one-way"
            checked={tripType === "one-way"}
            onChange={() => setTripType("one-way")}
          />

          <span className="block rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-500 transition peer-checked:bg-white peer-checked:text-cyan-700 peer-checked:shadow-sm">
            One Way
          </span>
        </label>

        <label className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name="tripType"
            value="round-trip"
            checked={tripType === "round-trip"}
            onChange={() => setTripType("round-trip")}
          />

          <span className="block rounded-lg px-4 py-3 text-center text-sm font-bold text-slate-500 transition peer-checked:bg-white peer-checked:text-cyan-700 peer-checked:shadow-sm">
            Round Trip
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            From
          </span>

          <select
            name="from"
            defaultValue=""
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="" disabled>
              Select departure
            </option>

            <option value="Padang Bai">Padang Bai</option>
            <option value="Sanur">Sanur</option>
            <option value="Serangan">Serangan</option>
            <option value="Gili Trawangan">Gili Trawangan</option>
            <option value="Gili Air">Gili Air</option>
            <option value="Bangsal Lombok">Bangsal Lombok</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            To
          </span>

          <select
            name="to"
            defaultValue=""
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="" disabled>
              Select destination
            </option>

            <option value="Gili Trawangan">Gili Trawangan</option>
            <option value="Gili Air">Gili Air</option>
            <option value="Gili Meno">Gili Meno</option>
            <option value="Bangsal Lombok">Bangsal Lombok</option>
            <option value="Padang Bai">Padang Bai</option>
            <option value="Nusa Penida">Nusa Penida</option>
            <option value="Nusa Lembongan">Nusa Lembongan</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Departure date
          </span>

          <input
            name="departureDate"
            type="date"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        {tripType === "round-trip" && (
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Return date
            </span>

            <input
              name="returnDate"
              type="date"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>
        )}

        <label>
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Passengers
          </span>

          <select
            name="passengers"
            defaultValue="1"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="1">1 Adult</option>
            <option value="2">2 Adults</option>
            <option value="3">3 Adults</option>
            <option value="4">4 Adults</option>
            <option value="5">5 Adults</option>
            <option value="6">6 Adults</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-cyan-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-cyan-600/25 transition hover:-translate-y-0.5 hover:bg-cyan-700"
      >
        Search Fast Boat
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Demo booking — no payment will be processed
      </p>
    </form>
  )
}
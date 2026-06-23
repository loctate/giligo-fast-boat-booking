"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type OperatorOption = {
  $id: string
  operatorCode: string
  operatorName: string
  isActive: boolean
}

export type VesselOption = {
  $id: string
  operatorId: string
  vesselCode: string
  vesselName: string
  isActive: boolean
}

export type RouteOption = {
  $id: string
  routeCode: string
  fromPort: string
  toPort: string
  isActive: boolean
}

export type TripScheduleRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  scheduleCode: string
  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number
  operatingDays: string
  bookingCutoffMinutes: number

  isActive: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null

  operatorCode?: string | null
  operatorName?: string | null
  vesselCode?: string | null
  vesselName?: string | null
  routeCode?: string | null
  fromPort?: string | null
  toPort?: string | null
}

type TripScheduleForm = {
  scheduleCode: string
  operatorId: string
  vesselId: string
  routeId: string
  departureTime: string
  arrivalTime: string
  arrivalDayOffset: string
  operatingDays: string[]
  bookingCutoffMinutes: string
  isActive: boolean
  notes: string
}

type ApiResponse = {
  success: boolean
  schedule?: TripScheduleRow
  error?: string
}

type TripSchedulesManagerProps = {
  initialSchedules: TripScheduleRow[]
  operators: OperatorOption[]
  vessels: VesselOption[]
  routes: RouteOption[]
}

const DAY_OPTIONS = [
  {
    code: "MON",
    label: "Monday",
  },
  {
    code: "TUE",
    label: "Tuesday",
  },
  {
    code: "WED",
    label: "Wednesday",
  },
  {
    code: "THU",
    label: "Thursday",
  },
  {
    code: "FRI",
    label: "Friday",
  },
  {
    code: "SAT",
    label: "Saturday",
  },
  {
    code: "SUN",
    label: "Sunday",
  },
] as const

const emptyForm: TripScheduleForm = {
  scheduleCode: "",
  operatorId: "",
  vesselId: "",
  routeId: "",
  departureTime: "",
  arrivalTime: "",
  arrivalDayOffset: "0",
  operatingDays: [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
  ],
  bookingCutoffMinutes: "0",
  isActive: true,
  notes: "",
}

function scheduleToForm(
  schedule: TripScheduleRow
): TripScheduleForm {
  return {
    scheduleCode:
      schedule.scheduleCode,

    operatorId:
      schedule.operatorId,

    vesselId:
      schedule.vesselId,

    routeId:
      schedule.routeId,

    departureTime:
      schedule.departureTime,

    arrivalTime:
      schedule.arrivalTime,

    arrivalDayOffset: String(
      schedule.arrivalDayOffset
    ),

    operatingDays:
      schedule.operatingDays
        .split(",")
        .map((day) => day.trim())
        .filter(Boolean),

    bookingCutoffMinutes: String(
      schedule.bookingCutoffMinutes
    ),

    isActive:
      schedule.isActive,

    notes:
      schedule.notes || "",
  }
}

function sortSchedules(
  schedules: TripScheduleRow[]
): TripScheduleRow[] {
  return [...schedules].sort(
    (firstSchedule, secondSchedule) => {
      const routeComparison = String(
        firstSchedule.routeCode ?? ""
      ).localeCompare(
        String(
          secondSchedule.routeCode ?? ""
        ),
        "en",
        {
          sensitivity: "base",
        }
      )

      if (routeComparison !== 0) {
        return routeComparison
      }

      return firstSchedule.departureTime.localeCompare(
        secondSchedule.departureTime
      )
    }
  )
}

function timeToMinutes(
  time: string
): number {
  const [hours, minutes] = time
    .split(":")
    .map(Number)

  return hours * 60 + minutes
}

function formatOperatingDays(
  operatingDays: string
): string {
  const days = operatingDays
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)

  if (days.length === 7) {
    return "Every day"
  }

  return days.join(", ")
}

export default function TripSchedulesManager({
  initialSchedules,
  operators,
  vessels,
  routes,
}: TripSchedulesManagerProps) {
  const [schedules, setSchedules] =
    useState(initialSchedules)

  const [form, setForm] =
    useState<TripScheduleForm>(
      emptyForm
    )

  const [search, setSearch] =
    useState("")

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const availableVessels = useMemo(
    () =>
      vessels.filter(
        (vessel) =>
          !form.operatorId ||
          vessel.operatorId ===
            form.operatorId
      ),
    [vessels, form.operatorId]
  )

  const filteredSchedules =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase()

      if (!keyword) {
        return schedules
      }

      return schedules.filter(
        (schedule) => {
          const searchableText = [
            schedule.scheduleCode,
            schedule.operatorCode,
            schedule.operatorName,
            schedule.vesselCode,
            schedule.vesselName,
            schedule.routeCode,
            schedule.fromPort,
            schedule.toPort,
            schedule.departureTime,
            schedule.arrivalTime,
            schedule.operatingDays,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return searchableText.includes(
            keyword
          )
        }
      )
    }, [schedules, search])

  const activeScheduleCount =
    schedules.filter(
      (schedule) =>
        schedule.isActive
    ).length

  const uniqueRouteCount =
    new Set(
      schedules.map(
        (schedule) =>
          schedule.routeId
      )
    ).size

  function updateField<
    Key extends keyof TripScheduleForm,
  >(
    key: Key,
    value: TripScheduleForm[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleOperatorChange(
    operatorId: string
  ) {
    const currentVessel =
      vessels.find(
        (vessel) =>
          vessel.$id ===
          form.vesselId
      )

    setForm((current) => ({
      ...current,
      operatorId,

      vesselId:
        currentVessel?.operatorId ===
        operatorId
          ? current.vesselId
          : "",
    }))
  }

  function toggleOperatingDay(
    day: string
  ) {
    setForm((current) => {
      const dayExists =
        current.operatingDays.includes(
          day
        )

      return {
        ...current,

        operatingDays: dayExists
          ? current.operatingDays.filter(
              (item) => item !== day
            )
          : [
              ...current.operatingDays,
              day,
            ],
      }
    })
  }

  function selectEveryDay() {
    updateField(
      "operatingDays",
      DAY_OPTIONS.map(
        (day) => day.code
      )
    )
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
  }

  function startEdit(
    schedule: TripScheduleRow
  ) {
    setEditingId(schedule.$id)
    setForm(
      scheduleToForm(schedule)
    )
    setMessage("")
    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage("")
    setError("")

    if (
      form.operatingDays.length === 0
    ) {
      setError(
        "Select at least one operating day."
      )
      return
    }

    const arrivalDayOffset = Number(
      form.arrivalDayOffset
    )

    const bookingCutoffMinutes =
      Number(
        form.bookingCutoffMinutes
      )

    if (
      !Number.isInteger(
        arrivalDayOffset
      ) ||
      arrivalDayOffset < 0 ||
      arrivalDayOffset > 2
    ) {
      setError(
        "Arrival day offset must be between 0 and 2."
      )
      return
    }

    if (
      !Number.isInteger(
        bookingCutoffMinutes
      ) ||
      bookingCutoffMinutes < 0 ||
      bookingCutoffMinutes > 10080
    ) {
      setError(
        "Booking cutoff must be between 0 and 10080 minutes."
      )
      return
    }

    const absoluteArrivalMinutes =
      timeToMinutes(
        form.arrivalTime
      ) +
      arrivalDayOffset * 1440

    if (
      absoluteArrivalMinutes <=
      timeToMinutes(
        form.departureTime
      )
    ) {
      setError(
        "Arrival must occur after departure. Change the arrival day offset if the journey crosses midnight."
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint = editingId
        ? `/api/admin/trip-schedules/${editingId}`
        : "/api/admin/trip-schedules"

      const response = await fetch(
        endpoint,
        {
          method: editingId
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,

            operatingDays:
              DAY_OPTIONS
                .map(
                  (day) => day.code
                )
                .filter((day) =>
                  form.operatingDays.includes(
                    day
                  )
                )
                .join(","),

            arrivalDayOffset,
            bookingCutoffMinutes,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.schedule
      ) {
        throw new Error(
          result.error ||
            "Trip schedule could not be saved."
        )
      }

      if (editingId) {
        setSchedules((current) =>
          sortSchedules(
            current.map(
              (schedule) =>
                schedule.$id ===
                editingId
                  ? result.schedule!
                  : schedule
            )
          )
        )

        setMessage(
          "Trip schedule updated successfully."
        )
      } else {
        setSchedules((current) =>
          sortSchedules([
            ...current,
            result.schedule!,
          ])
        )

        setMessage(
          "Trip schedule created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Trip schedule could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    schedule: TripScheduleRow
  ) {
    setUpdatingId(schedule.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/trip-schedules/${schedule.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive:
              !schedule.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.schedule
      ) {
        throw new Error(
          result.error ||
            "Schedule status could not be updated."
        )
      }

      setSchedules((current) =>
        current.map((item) =>
          item.$id === schedule.$id
            ? result.schedule!
            : item
        )
      )

      setMessage(
        result.schedule.isActive
          ? "Trip schedule activated successfully."
          : "Trip schedule deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Schedule status could not be updated."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Total schedules
          </p>

          <p className="mt-2 text-3xl font-black">
            {schedules.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Active schedules
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {activeScheduleCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Inactive schedules
          </p>

          <p className="mt-2 text-3xl font-black">
            {schedules.length -
              activeScheduleCount}
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-cyan-700">
            Routes in use
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {uniqueRouteCount}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit schedule"
              : "New schedule"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update trip schedule"
              : "Add recurring trip schedule"}
          </h2>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Schedule code *
            </span>

            <input
              value={form.scheduleCode}
              onChange={(event) =>
                updateField(
                  "scheduleCode",
                  event.target.value.toUpperCase()
                )
              }
              required
              maxLength={50}
              placeholder="EKA25-PB-GT-0900"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Operator *
            </span>

            <select
              value={form.operatorId}
              onChange={(event) =>
                handleOperatorChange(
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select operator
              </option>

              {operators.map(
                (operator) => (
                  <option
                    key={operator.$id}
                    value={operator.$id}
                  >
                    {operator.operatorName}
                    {" — "}
                    {operator.operatorCode}
                    {!operator.isActive
                      ? " (Inactive)"
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Vessel *
            </span>

            <select
              value={form.vesselId}
              onChange={(event) =>
                updateField(
                  "vesselId",
                  event.target.value
                )
              }
              required
              disabled={!form.operatorId}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600 disabled:bg-slate-100"
            >
              <option value="">
                {form.operatorId
                  ? "Select vessel"
                  : "Select operator first"}
              </option>

              {availableVessels.map(
                (vessel) => (
                  <option
                    key={vessel.$id}
                    value={vessel.$id}
                  >
                    {vessel.vesselName}
                    {" — "}
                    {vessel.vesselCode}
                    {!vessel.isActive
                      ? " (Inactive)"
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Route *
            </span>

            <select
              value={form.routeId}
              onChange={(event) =>
                updateField(
                  "routeId",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select route
              </option>

              {routes.map((route) => (
                <option
                  key={route.$id}
                  value={route.$id}
                >
                  {route.fromPort}
                  {" → "}
                  {route.toPort}
                  {" — "}
                  {route.routeCode}
                  {!route.isActive
                    ? " (Inactive)"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Departure time *
            </span>

            <input
              type="time"
              value={form.departureTime}
              onChange={(event) =>
                updateField(
                  "departureTime",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Arrival time *
            </span>

            <input
              type="time"
              value={form.arrivalTime}
              onChange={(event) =>
                updateField(
                  "arrivalTime",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Arrival day offset *
            </span>

            <select
              value={
                form.arrivalDayOffset
              }
              onChange={(event) =>
                updateField(
                  "arrivalDayOffset",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="0">
                Same day
              </option>

              <option value="1">
                Next day
              </option>

              <option value="2">
                Two days later
              </option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Booking cutoff (minutes) *
            </span>

            <input
              type="number"
              min={0}
              max={10080}
              step={1}
              value={
                form.bookingCutoffMinutes
              }
              onChange={(event) =>
                updateField(
                  "bookingCutoffMinutes",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs text-slate-500">
              Use 0 for now. The H+2 booking
              rule remains separate.
            </p>
          </label>

          <fieldset className="md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <legend className="text-sm font-bold">
                Operating days *
              </legend>

              <button
                type="button"
                onClick={selectEveryDay}
                className="text-xs font-black text-cyan-700 hover:underline"
              >
                Select every day
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {DAY_OPTIONS.map(
                (day) => (
                  <label
                    key={day.code}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.operatingDays.includes(
                        day.code
                      )}
                      onChange={() =>
                        toggleOperatingDay(
                          day.code
                        )
                      }
                      className="h-5 w-5 rounded"
                    />

                    <span className="text-sm font-bold">
                      {day.label}
                    </span>
                  </label>
                )
              )}
            </div>
          </fieldset>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Notes
            </span>

            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              maxLength={1000}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded"
            />

            <span className="text-sm font-bold">
              Trip schedule is active
            </span>
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Schedule"
                  : "Add Schedule"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-full border border-slate-300 px-7 py-3 text-sm font-black transition hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Schedule directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Registered trip schedules
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search schedule..."
            className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600 md:max-w-sm"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Schedule
                </th>

                <th className="px-4 py-2">
                  Operator / Vessel
                </th>

                <th className="px-4 py-2">
                  Route
                </th>

                <th className="px-4 py-2">
                  Days
                </th>

                <th className="px-4 py-2">
                  Status
                </th>

                <th className="px-4 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSchedules.map(
                (schedule) => (
                  <tr
                    key={schedule.$id}
                    className="bg-slate-50"
                  >
                    <td className="rounded-l-2xl px-4 py-4">
                      <p className="font-black">
                        {
                          schedule.departureTime
                        }
                        {" → "}
                        {
                          schedule.arrivalTime
                        }

                        {schedule.arrivalDayOffset >
                          0 &&
                          ` (+${schedule.arrivalDayOffset} day)`}
                      </p>

                      <p className="mt-1 text-xs font-bold text-cyan-700">
                        {
                          schedule.scheduleCode
                        }
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {schedule.operatorName ||
                          "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {schedule.vesselName ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {schedule.fromPort ||
                          "-"}
                        {" → "}
                        {schedule.toPort ||
                          "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {schedule.routeCode ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {formatOperatingDays(
                          schedule.operatingDays
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          schedule.isActive
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                            : "rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600"
                        }
                      >
                        {schedule.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              schedule
                            )
                          }
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black hover:bg-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            schedule.$id
                          }
                          onClick={() =>
                            toggleStatus(
                              schedule
                            )
                          }
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                        >
                          {updatingId ===
                          schedule.$id
                            ? "Updating..."
                            : schedule.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredSchedules.length ===
            0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No trip schedules found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

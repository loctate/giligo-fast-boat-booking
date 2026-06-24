"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type ScheduleOption = {
  $id: string

  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string
  isActive: boolean

  operatorName: string
  vesselName: string
  vesselActiveCapacity: number

  routeCode: string
  fromPort: string
  toPort: string
}

export type TripInventoryRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  inventoryCode: string

  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string

  salesStatus: string
  isActive: boolean

  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null

  scheduleCode?: string | null
  operatorName?: string | null
  vesselName?: string | null
  routeCode?: string | null
  fromPort?: string | null
  toPort?: string | null
}

type InventoryForm = {
  scheduleId: string
  travelDate: string
  seatCapacity: string

  adultPrice: string
  childPrice: string
  infantPrice: string

  currency: string
  salesStatus: string
  isActive: boolean
  notes: string
}

type ApiResponse = {
  success: boolean
  inventory?: TripInventoryRow
  error?: string
}

type TripInventoryManagerProps = {
  initialInventory: TripInventoryRow[]
  schedules: ScheduleOption[]
}

const emptyForm: InventoryForm = {
  scheduleId: "",
  travelDate: "",
  seatCapacity: "",

  adultPrice: "",
  childPrice: "0",
  infantPrice: "0",

  currency: "IDR",
  salesStatus: "OPEN",
  isActive: true,
  notes: "",
}

function inventoryToForm(
  inventory: TripInventoryRow
): InventoryForm {
  return {
    scheduleId: inventory.scheduleId,

    travelDate: inventory.travelDate,

    seatCapacity: String(
      inventory.seatCapacity
    ),

    adultPrice: String(
      inventory.adultPrice
    ),

    childPrice: String(
      inventory.childPrice
    ),

    infantPrice: String(
      inventory.infantPrice
    ),

    currency: inventory.currency,

    salesStatus:
      inventory.salesStatus === "SOLD_OUT"
        ? "OPEN"
        : inventory.salesStatus,

    isActive: inventory.isActive,

    notes: inventory.notes || "",
  }
}

function sortInventory(
  inventory: TripInventoryRow[]
): TripInventoryRow[] {
  return [...inventory].sort(
    (firstItem, secondItem) => {
      const dateComparison =
        firstItem.travelDate.localeCompare(
          secondItem.travelDate
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return firstItem.departureTime.localeCompare(
        secondItem.departureTime
      )
    }
  )
}

function formatMoney(
  value: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(value)
  } catch {
    return `${currency} ${value.toLocaleString(
      "id-ID"
    )}`
  }
}

function getStatusClass(
  salesStatus: string
): string {
  switch (salesStatus) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-700"

    case "SOLD_OUT":
      return "bg-red-100 text-red-700"

    case "CANCELLED":
      return "bg-rose-100 text-rose-700"

    default:
      return "bg-slate-200 text-slate-700"
  }
}

export default function TripInventoryManager({
  initialInventory,
  schedules,
}: TripInventoryManagerProps) {
  const [inventory, setInventory] =
    useState(initialInventory)

  const [form, setForm] =
    useState<InventoryForm>(
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

  const selectedSchedule =
    useMemo(
      () =>
        schedules.find(
          (schedule) =>
            schedule.$id ===
            form.scheduleId
        ),
      [schedules, form.scheduleId]
    )

  const filteredInventory =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase()

      if (!keyword) {
        return inventory
      }

      return inventory.filter(
        (item) => {
          const searchableText = [
            item.inventoryCode,
            item.scheduleCode,
            item.operatorName,
            item.vesselName,
            item.routeCode,
            item.fromPort,
            item.toPort,
            item.travelDate,
            item.salesStatus,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return searchableText.includes(
            keyword
          )
        }
      )
    }, [inventory, search])

  const openCount = inventory.filter(
    (item) =>
      item.isActive &&
      item.salesStatus === "OPEN"
  ).length

  const soldOutCount =
    inventory.filter(
      (item) =>
        item.salesStatus === "SOLD_OUT"
    ).length

  const availableSeatTotal =
    inventory.reduce(
      (total, item) =>
        total + item.availableSeats,
      0
    )

  function updateField<
    Key extends keyof InventoryForm,
  >(
    key: Key,
    value: InventoryForm[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleScheduleChange(
    scheduleId: string
  ) {
    const schedule = schedules.find(
      (item) => item.$id === scheduleId
    )

    setForm((current) => ({
      ...current,

      scheduleId,

      seatCapacity:
        schedule &&
        !current.seatCapacity
          ? String(
              schedule.vesselActiveCapacity
            )
          : current.seatCapacity,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
  }

  function startEdit(
    item: TripInventoryRow
  ) {
    setEditingId(item.$id)
    setForm(inventoryToForm(item))
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

    const seatCapacity = Number(
      form.seatCapacity
    )

    const adultPrice = Number(
      form.adultPrice
    )

    const childPrice = Number(
      form.childPrice
    )

    const infantPrice = Number(
      form.infantPrice
    )

    const integerValues = [
      seatCapacity,
      adultPrice,
      childPrice,
      infantPrice,
    ]

    if (
      integerValues.some(
        (value) =>
          !Number.isInteger(value) ||
          value < 0
      )
    ) {
      setError(
        "Capacity and prices must contain valid non-negative integers."
      )
      return
    }

    if (
      selectedSchedule &&
      seatCapacity >
        selectedSchedule
          .vesselActiveCapacity
    ) {
      setError(
        `Seat capacity cannot exceed ${selectedSchedule.vesselActiveCapacity} seats.`
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint = editingId
        ? `/api/admin/trip-inventory/${editingId}`
        : "/api/admin/trip-inventory"

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
            seatCapacity,
            adultPrice,
            childPrice,
            infantPrice,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.inventory
      ) {
        throw new Error(
          result.error ||
            "Trip inventory could not be saved."
        )
      }

      if (editingId) {
        setInventory((current) =>
          sortInventory(
            current.map((item) =>
              item.$id === editingId
                ? result.inventory!
                : item
            )
          )
        )

        setMessage(
          "Trip inventory updated successfully."
        )
      } else {
        setInventory((current) =>
          sortInventory([
            ...current,
            result.inventory!,
          ])
        )

        setMessage(
          "Trip inventory created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Trip inventory could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    item: TripInventoryRow
  ) {
    setUpdatingId(item.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/trip-inventory/${item.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.inventory
      ) {
        throw new Error(
          result.error ||
            "Inventory status could not be updated."
        )
      }

      setInventory((current) =>
        current.map((currentItem) =>
          currentItem.$id === item.$id
            ? result.inventory!
            : currentItem
        )
      )

      setMessage(
        result.inventory.isActive
          ? "Trip inventory activated successfully."
          : "Trip inventory deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Inventory status could not be updated."
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
            Total inventory
          </p>

          <p className="mt-2 text-3xl font-black">
            {inventory.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Open inventory
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {openCount}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-red-700">
            Sold out
          </p>

          <p className="mt-2 text-3xl font-black text-red-900">
            {soldOutCount}
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-cyan-700">
            Available seats
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {availableSeatTotal}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit inventory"
              : "New inventory"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update daily trip inventory"
              : "Add daily trip inventory"}
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
              Trip schedule *
            </span>

            <select
              value={form.scheduleId}
              onChange={(event) =>
                handleScheduleChange(
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select schedule
              </option>

              {schedules.map(
                (schedule) => (
                  <option
                    key={schedule.$id}
                    value={schedule.$id}
                  >
                    {schedule.fromPort}
                    {" → "}
                    {schedule.toPort}
                    {" | "}
                    {schedule.departureTime}
                    {" | "}
                    {schedule.scheduleCode}
                    {!schedule.isActive
                      ? " (Inactive)"
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedSchedule && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="font-black">
                {selectedSchedule.operatorName}
                {" — "}
                {selectedSchedule.vesselName}
              </p>

              <p className="mt-1 text-slate-600">
                Vessel allocation:{" "}
                {
                  selectedSchedule
                    .vesselActiveCapacity
                }{" "}
                seats
              </p>

              <p className="mt-1 text-slate-600">
                Operating days:{" "}
                {
                  selectedSchedule.operatingDays
                }
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold">
              Travel date *
            </span>

            <input
              type="date"
              value={form.travelDate}
              onChange={(event) =>
                updateField(
                  "travelDate",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Seat capacity *
            </span>

            <input
              type="number"
              min={0}
              max={
                selectedSchedule
                  ?.vesselActiveCapacity ||
                1000
              }
              step={1}
              value={form.seatCapacity}
              onChange={(event) =>
                updateField(
                  "seatCapacity",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Adult price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.adultPrice}
              onChange={(event) =>
                updateField(
                  "adultPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Child price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.childPrice}
              onChange={(event) =>
                updateField(
                  "childPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Infant price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.infantPrice}
              onChange={(event) =>
                updateField(
                  "infantPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Currency *
            </span>

            <input
              value={form.currency}
              onChange={(event) =>
                updateField(
                  "currency",
                  event.target.value
                    .toUpperCase()
                    .slice(0, 3)
                )
              }
              required
              minLength={3}
              maxLength={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Sales status *
            </span>

            <select
              value={form.salesStatus}
              onChange={(event) =>
                updateField(
                  "salesStatus",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="OPEN">
                Open
              </option>

              <option value="CLOSED">
                Closed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </label>

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
              Trip inventory is active
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
                  ? "Update Inventory"
                  : "Add Inventory"}
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
              Inventory directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Daily trip inventory
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search inventory..."
            className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600 md:max-w-sm"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Date / Trip
                </th>

                <th className="px-4 py-2">
                  Operator / Vessel
                </th>

                <th className="px-4 py-2">
                  Seats
                </th>

                <th className="px-4 py-2">
                  Price
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
              {filteredInventory.map(
                (item) => (
                  <tr
                    key={item.$id}
                    className="bg-slate-50"
                  >
                    <td className="rounded-l-2xl px-4 py-4">
                      <p className="font-black">
                        {item.travelDate}
                      </p>

                      <p className="mt-1 font-bold">
                        {item.fromPort || "-"}
                        {" → "}
                        {item.toPort || "-"}
                      </p>

                      <p className="mt-1 text-xs text-cyan-700">
                        {item.departureTime}
                        {" | "}
                        {item.inventoryCode}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {item.operatorName ||
                          "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.vesselName ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black">
                        {item.availableSeats}{" "}
                        available
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Capacity{" "}
                        {item.seatCapacity}
                        {" | "}Booked{" "}
                        {item.bookedSeats}
                        {" | "}Held{" "}
                        {item.heldSeats}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black">
                        {formatMoney(
                          item.adultPrice,
                          item.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Adult fare
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            item.salesStatus
                          )}`}
                        >
                          {item.salesStatus}
                        </span>

                        <p className="text-xs text-slate-500">
                          {item.isActive
                            ? "Active"
                            : "Inactive"}
                        </p>
                      </div>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(item)
                          }
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black hover:bg-white"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            item.$id
                          }
                          onClick={() =>
                            toggleStatus(item)
                          }
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                        >
                          {updatingId ===
                          item.$id
                            ? "Updating..."
                            : item.isActive
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

          {filteredInventory.length ===
            0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No trip inventory found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
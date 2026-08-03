import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"
import {
  getCurrentBaliDate,
} from "@/lib/bali-date"

import LogoutButton from "./LogoutButton"

export const dynamic = "force-dynamic"

type BookingRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  bookingCode: string
  bookingStatus: string
  paymentStatus: string
  paymentVerificationAllowed?: boolean
  tripType: string

  departureDate: string
  returnDate?: string | null

  passengerCount: number
  totalPrice: number

  customerFullName: string
  customerEmail: string
  customerWhatsapp: string
  customerCountry: string

  passengersJson: string
  notes?: string | null

  tripId: string
  operatorName: string
  fromPort: string
  toPort: string
  departureTime: string
  arrivalTime: string
  duration: string
  pricePerPassenger: number
  checkInLocation: string
}

type BookingResult = {
  rows: BookingRow[]
  total: number
}

type AdminPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    bookingStatus?: string | string[]
    paymentStatus?: string | string[]
    departureDate?: string | string[]
  }>
}

function getSearchParam(
  value: string | string[] | undefined
): string {
  return Array.isArray(value)
    ? String(value[0] ?? "").trim()
    : String(value ?? "").trim()
}

function normalizeSearchValue(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function addDateOnlyDays(
  dateValue: string,
  numberOfDays: number
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dateValue
    )

  if (!match) {
    return ""
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]) + numberOfDays
    )
  )

  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getUTCDate()
    ).padStart(2, "0"),
  ].join("-")
}

function isOperationalBooking(
  booking: BookingRow
): boolean {
  const status =
    normalizeSearchValue(
      booking.bookingStatus
    )

  return ![
    "cancelled",
    "canceled",
    "expired",
    "rejected",
  ].includes(status)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function statusClass(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (
    normalizedStatus === "confirmed" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "completed"
  ) {
    return "bg-emerald-100 text-emerald-700"
  }

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "demo" ||
    normalizedStatus === "waiting"
  ) {
    return "bg-amber-100 text-amber-700"
  }

  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "refunded" ||
    normalizedStatus === "rejected"
  ) {
    return "bg-red-100 text-red-700"
  }

  return "bg-slate-100 text-slate-700"
}

async function getBookings(): Promise<BookingResult> {
  const response = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.bookingsTableId,
    queries: [
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  })

  return {
    rows: response.rows as unknown as BookingRow[],
    total: response.total,
  }
}

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const admin = await requireAdmin()
  const params = await searchParams

  const searchQuery =
    getSearchParam(params.q)

  const bookingStatusFilter =
    getSearchParam(
      params.bookingStatus
    )

  const paymentStatusFilter =
    getSearchParam(
      params.paymentStatus
    )

  const departureDateFilter =
    getSearchParam(
      params.departureDate
    )

  let bookings: BookingRow[] = []
  let totalBookings = 0
  let loadError = ""

  try {
    const result = await getBookings()

    bookings = result.rows
    totalBookings = result.total
  } catch (error) {
    console.error(
      "Admin dashboard Appwrite error:",
      error
    )

    loadError =
      error instanceof Error
        ? error.message
        : "Booking data could not be loaded."
  }

  const normalizedSearchQuery =
    normalizeSearchValue(
      searchQuery
    )

  const filteredBookings =
    bookings.filter((booking) => {
      if (
        bookingStatusFilter &&
        normalizeSearchValue(
          booking.bookingStatus
        ) !==
          normalizeSearchValue(
            bookingStatusFilter
          )
      ) {
        return false
      }

      if (
        paymentStatusFilter &&
        normalizeSearchValue(
          booking.paymentStatus
        ) !==
          normalizeSearchValue(
            paymentStatusFilter
          )
      ) {
        return false
      }

      if (
        departureDateFilter &&
        booking.departureDate !==
          departureDateFilter
      ) {
        return false
      }

      if (!normalizedSearchQuery) {
        return true
      }

      const searchableValues = [
        booking.bookingCode,
        booking.customerFullName,
        booking.customerEmail,
        booking.customerWhatsapp,
        booking.operatorName,
        booking.fromPort,
        booking.toPort,
      ]

      return searchableValues.some(
        (value) =>
          normalizeSearchValue(
            value
          ).includes(
            normalizedSearchQuery
          )
      )
    })

  const filtersAreActive =
    Boolean(
      searchQuery ||
        bookingStatusFilter ||
        paymentStatusFilter ||
        departureDateFilter
    )

  const currentWitaDate =
    getCurrentBaliDate()

  const tomorrowWitaDate =
    addDateOnlyDays(
      currentWitaDate,
      1
    )

  const sevenDayEndDate =
    addDateOnlyDays(
      currentWitaDate,
      6
    )

  const operationalBookings =
    bookings.filter(
      isOperationalBooking
    )

  const pendingPaymentBookings =
    operationalBookings.filter(
      (booking) =>
        normalizeSearchValue(
          booking.paymentStatus
        ) === "pending"
    ).length

  const paidBookings =
    operationalBookings.filter(
      (booking) =>
        normalizeSearchValue(
          booking.paymentStatus
        ) === "paid"
    ).length

  const todayBookings =
    operationalBookings.filter(
      (booking) =>
        booking.departureDate ===
        currentWitaDate
    )

  const passengersToday =
    todayBookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.passengerCount || 0
        ),
      0
    )

  const tomorrowBookings =
    operationalBookings.filter(
      (booking) =>
        booking.departureDate ===
        tomorrowWitaDate
    )

  const passengersTomorrow =
    tomorrowBookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.passengerCount || 0
        ),
      0
    )

  const nextSevenDayBookings =
    operationalBookings.filter(
      (booking) =>
        booking.departureDate >=
          currentWitaDate &&
        booking.departureDate <=
          sevenDayEndDate
    )

  const nextSevenDayPassengers =
    nextSevenDayBookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.passengerCount || 0
        ),
      0
    )

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-black"
            >
              Gili{" "}
              <span className="text-cyan-300">
                Go
              </span>
            </Link>

            <span className="hidden h-7 w-px bg-slate-700 sm:block" />

            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Administration
              </p>

              <p className="text-sm text-slate-400">
                Booking Management Dashboard
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-sm text-slate-400 xl:block">
              {admin.email}
            </span>

            <Link
              href="/admin/operators"
              className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              Operators
            </Link>

            <Link
              href="/admin/vessels"
              className="rounded-full bg-blue-500 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-400"
            >
              Vessels
            </Link>

            <Link
              href="/admin/routes"
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-black text-white transition hover:bg-violet-400"
            >
              Routes
            </Link>

            <Link
              href="/admin/trip-inventory"
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
            >
              Trip Inventory
            </Link>

            <Link
              href="/admin/trip-schedules"
              className="rounded-full bg-amber-500 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              Trip Schedules
            </Link>

            <Link
              href="/"
              className="hidden rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950 sm:inline-flex"
            >
              View Website
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-12 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Business overview
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            GiliGo Admin Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Monitor bookings, passengers, payment
            status and upcoming fast boat departures.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Booking data could not be loaded
            </p>

            <p className="mt-2 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <section className="mb-8 rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm lg:p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-800">
                    Perhatian operasional admin
                  </p>

                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                    WAJIB DIPERIKSA
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Jangan lupa memperbarui Trip Inventory
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-700">
                  Jadwal hanya akan muncul pada pencarian tiket
                  apabila tanggal keberangkatan sudah dibuat di
                  Trip Inventory, berstatus OPEN, aktif, dan masih
                  mempunyai kursi. Pastikan tanggal minimal H+2
                  dan tanggal-tanggal berikutnya selalu tersedia.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-200 bg-white p-4">
                    <p className="font-black text-slate-900">
                      Trip Inventory
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Diperbarui secara rutin untuk mengisi tanggal,
                      kapasitas kursi, harga, dan status penjualan.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-black text-slate-900">
                      Trip Schedules
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Hanya diperbarui jika jam, rute, operator,
                      kapal, atau pola jadwal mengalami perubahan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:min-w-64 lg:flex-col">
                <Link
                  href="/admin/trip-inventory"
                  className="inline-flex justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700"
                >
                  Update Trip Inventory
                </Link>

                <Link
                  href="/admin/trip-schedules"
                  className="inline-flex justify-center rounded-xl border border-amber-500 bg-white px-5 py-3 text-sm font-black text-amber-900 transition hover:bg-amber-100"
                >
                  Periksa Trip Schedules
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Pending payment
                  </p>

                  <p className="mt-3 text-4xl font-black text-amber-700">
                    {pendingPaymentBookings}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  ⏳
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Active bookings requiring payment follow-up
              </p>
            </article>

            <article className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Paid bookings
                  </p>

                  <p className="mt-3 text-4xl font-black text-emerald-700">
                    {paidBookings}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  ✓
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Active bookings with paid status
              </p>
            </article>

            <article className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Departures today
                  </p>

                  <p className="mt-3 text-4xl font-black text-cyan-700">
                    {todayBookings.length}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                  🚤
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Booking records departing today in WITA
              </p>
            </article>

            <article className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Passengers today
                  </p>

                  <p className="mt-3 text-4xl font-black text-blue-700">
                    {passengersToday}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                  👥
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-400">
                Passengers departing today in WITA
              </p>
            </article>
          </div>

          <section className="mt-5 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                Tomorrow
              </p>

              <p className="mt-2 text-lg font-black text-slate-950">
                {tomorrowBookings.length} bookings
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {passengersTomorrow} passengers
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                Next 7 days
              </p>

              <p className="mt-2 text-lg font-black text-slate-950">
                {nextSevenDayBookings.length} bookings
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {nextSevenDayPassengers} passengers
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Dashboard coverage
              </p>

              <p className="mt-2 text-lg font-black text-slate-950">
                {bookings.length} loaded
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {totalBookings} total records
              </p>
            </div>
          </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">
                  Recent bookings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search and filter the latest reservations stored in Appwrite.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                {filteredBookings.length} of{" "}
                {bookings.length} displayed
              </div>
            </div>

            <form
              method="GET"
              action="/admin"
              className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_1fr_auto_auto]"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Search booking
                </span>

                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Code, customer, email, WhatsApp, route..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Booking status
                </span>

                <select
                  name="bookingStatus"
                  defaultValue={bookingStatusFilter}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="">
                    All statuses
                  </option>
                  <option value="Pending">
                    Pending
                  </option>
                  <option value="Confirmed">
                    Confirmed
                  </option>
                  <option value="Completed">
                    Completed
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                  <option value="Expired">
                    Expired
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Payment status
                </span>

                <select
                  name="paymentStatus"
                  defaultValue={paymentStatusFilter}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="">
                    All payments
                  </option>
                  <option value="Pending">
                    Pending
                  </option>
                  <option value="Paid">
                    Paid
                  </option>
                  <option value="Failed">
                    Failed
                  </option>
                  <option value="Expired">
                    Expired
                  </option>
                  <option value="Refunded">
                    Refunded
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Departure date
                </span>

                <input
                  type="date"
                  name="departureDate"
                  defaultValue={departureDateFilter}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <button
                type="submit"
                className="self-end rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
              >
                Apply Filters
              </button>

              <Link
                href="/admin"
                className="self-end rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                Clear
              </Link>
            </form>

            {filtersAreActive && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Filters are applied to the latest{" "}
                {bookings.length} loaded booking records.
              </p>
            )}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">
                🎫
              </div>

              <h3 className="mt-5 text-xl font-black">
                {filtersAreActive
                  ? "No matching bookings"
                  : "No bookings yet"}
              </h3>

              <p className="mt-2 text-slate-500">
                {filtersAreActive
                  ? "Try changing or clearing the current filters."
                  : "New Nusa Gili Boat bookings will appear here."}
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
              >
                Create Test Booking
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Booking
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Route
                    </th>

                    <th className="px-6 py-4">
                      Departure
                    </th>

                    <th className="px-6 py-4">
                      Passengers
                    </th>

                    <th className="px-6 py-4">
                      Total
                    </th>

                    <th className="px-6 py-4">
                      Booking status
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.$id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5 align-top">
                        <Link
                          href={`/admin/bookings/${booking.$id}`}
                          className="font-black text-cyan-700 hover:text-cyan-900 hover:underline"
                        >
                          {booking.bookingCode}
                        </Link>

                        <p className="mt-1 text-xs text-slate-400">
                          Created{" "}
                          {formatDate(
                            booking.$createdAt
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-bold">
                          {booking.customerFullName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {booking.customerEmail}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {booking.customerWhatsapp}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-bold">
                          {booking.fromPort}

                          <span className="mx-2 text-cyan-600">
                            →
                          </span>

                          {booking.toPort}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {booking.operatorName}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-bold">
                          {formatDate(
                            booking.departureDate
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {booking.departureTime}
                          {" – "}
                          {booking.arrivalTime}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-black">
                          {booking.passengerCount}
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-black">
                          {formatCurrency(
                            booking.totalPrice
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatCurrency(
                            booking.pricePerPassenger
                          )}{" "}
                          each
                        </p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            booking.bookingStatus
                          )}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(
                              booking.paymentStatus
                            )}`}
                          >
                            {booking.paymentStatus}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${
                              booking.paymentVerificationAllowed === true
                                ? "bg-sky-100 text-sky-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {booking.paymentVerificationAllowed === true
                              ? "iPaymu Verification"
                              : "Manual Assistance"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-800">
          <p className="font-black">
            Secure administration
          </p>

          <p className="mt-1 leading-6">
            You are signed in as {admin.email}.
            Booking information is loaded securely
            from Appwrite.
          </p>
        </div>
      </section>
    </main>
  )
}
import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
appwriteConfig,
tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "./LogoutButton"

export const dynamic = "force-dynamic"

type BookingRow = {
$id: string
$createdAt: string
$updatedAt?: string

bookingCode: string
bookingStatus: string
paymentStatus: string
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
normalizedStatus === "demo"
) {
return "bg-amber-100 text-amber-700"
}

if (
normalizedStatus === "cancelled" ||
normalizedStatus === "refunded"
) {
return "bg-red-100 text-red-700"
}

return "bg-slate-100 text-slate-700"
}

async function getBookings(): Promise<{
rows: BookingRow[]
total: number
}> {
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

export default async function AdminPage() {
const admin = await requireAdmin()

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

const totalPassengers = bookings.reduce(
(total, booking) =>
total +
Number(booking.passengerCount || 0),
0
)

const totalRevenue = bookings.reduce(
(total, booking) =>
total +
Number(booking.totalPrice || 0),
0
)

const confirmedBookings = bookings.filter(
(booking) =>
booking.bookingStatus
.toLowerCase() === "confirmed"
).length

const upcomingBookings = bookings.filter(
(booking) => {
const departureTime = new Date(
booking.departureDate +
"T23:59:59"
).getTime()

  return departureTime >= Date.now()
}

).length

return ( <main className="min-h-screen bg-slate-100 text-slate-900"> <header className="border-b border-slate-800 bg-slate-950 text-white"> <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-5 lg:px-8"> <div className="flex items-center gap-4"> <Link
           href="/"
           className="text-3xl font-black"
         >
Gili <span className="text-cyan-300">
Go </span> </Link>


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

      <div className="flex items-center gap-3">
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
        Monitor bookings, passengers,
        payment status and upcoming fast
        boat departures.
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

    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Total bookings
            </p>

            <p className="mt-3 text-4xl font-black">
              {totalBookings}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
            🎫
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          All booking records in Appwrite
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Total passengers
            </p>

            <p className="mt-3 text-4xl font-black">
              {totalPassengers}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            👥
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Passengers from loaded bookings
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Booking value
            </p>

            <p className="mt-3 text-2xl font-black text-cyan-700">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
            💰
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Demo transaction value
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Upcoming trips
            </p>

            <p className="mt-3 text-4xl font-black">
              {upcomingBookings}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🚤
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          {confirmedBookings} confirmed
          booking
          {confirmedBookings === 1
            ? ""
            : "s"}
        </p>
      </article>
    </div>

    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">
            Recent bookings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest reservations stored in
            Appwrite.
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
          {bookings.length} displayed
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="text-5xl">
            📭
          </div>

          <h3 className="mt-5 text-xl font-black">
            No bookings yet
          </h3>

          <p className="mt-2 text-slate-500">
            New GiliGo bookings will appear
            here.
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
              {bookings.map((booking) => (
                <tr
                  key={booking.$id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-5 align-top">
                    <Link
                      href={
                        "/admin/bookings/" +
                        booking.$id
                      }
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
                      {
                        booking.customerFullName
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {booking.customerEmail}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        booking.customerWhatsapp
                      }
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
                      {
                        booking.passengerCount
                      }
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
                      className={
                        "inline-flex rounded-full px-3 py-1 text-xs font-black " +
                        statusClass(
                          booking.bookingStatus
                        )
                      }
                    >
                      {
                        booking.bookingStatus
                      }
                    </span>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <span
                      className={
                        "inline-flex rounded-full px-3 py-1 text-xs font-black " +
                        statusClass(
                          booking.paymentStatus
                        )
                      }
                    >
                      {
                        booking.paymentStatus
                      }
                    </span>
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
        Booking information is loaded
        securely from Appwrite.
      </p>
    </div>
  </section>
</main>

)
}

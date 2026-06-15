import Link from "next/link"

import { requireAdmin } from "@/lib/admin-auth"
import {
appwriteConfig,
tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "../../LogoutButton"
import StatusEditor from "./StatusEditor"

export const dynamic = "force-dynamic"

type BookingPassenger = {
number: number
name: string
}

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

type BookingDetailPageProps = {
params: Promise<{
id: string
}>
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
weekday: "short",
day: "2-digit",
month: "long",
year: "numeric",
}).format(date)
}

function parsePassengers(
value?: string | null
): BookingPassenger[] {
if (!value) {
return []
}

try {
const parsed: unknown = JSON.parse(value)

if (!Array.isArray(parsed)) {
  return []
}

return parsed.filter(
  (passenger): passenger is BookingPassenger =>
    typeof passenger === "object" &&
    passenger !== null &&
    typeof passenger.number === "number" &&
    typeof passenger.name === "string"
)

} catch {
return []
}
}

function statusClass(status: string) {
const normalized = status.toLowerCase()

if (
normalized === "confirmed" ||
normalized === "paid" ||
normalized === "completed"
) {
return "bg-emerald-100 text-emerald-700"
}

if (
normalized === "pending" ||
normalized === "demo"
) {
return "bg-amber-100 text-amber-700"
}

if (
normalized === "cancelled" ||
normalized === "refunded"
) {
return "bg-red-100 text-red-700"
}

return "bg-slate-100 text-slate-700"
}

export default async function BookingDetailPage({
params,
}: BookingDetailPageProps) {
const admin = await requireAdmin()

const routeParams = await params
const rowId = routeParams.id

let booking: BookingRow | null = null
let errorMessage = ""

try {
const result = await tablesDB.getRow({
databaseId: appwriteConfig.databaseId,
tableId: appwriteConfig.bookingsTableId,
rowId,
})

booking = result as unknown as BookingRow

} catch (error) {
console.error(
"Booking detail error:",
error
)

errorMessage =
  error instanceof Error
    ? error.message
    : "Booking could not be loaded."

}

if (!booking) {
return ( <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5"> <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg"> <div className="text-5xl">
🔎 </div>

      <h1 className="mt-5 text-3xl font-black">
        Booking not found
      </h1>

      <p className="mt-3 break-words leading-7 text-slate-500">
        {errorMessage ||
          "The requested booking does not exist."}
      </p>

      <Link
        href="/admin"
        className="mt-7 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
      >
        Return to Dashboard
      </Link>
    </div>
  </main>
)

}

const passengers = parsePassengers(
booking.passengersJson
)

return ( <main className="min-h-screen bg-slate-100 text-slate-900"> <header className="border-b border-slate-800 bg-slate-950 text-white"> <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 lg:px-8"> <div className="flex items-center gap-5"> <Link
           href="/admin"
           className="text-3xl font-black"
         >
Gili <span className="text-cyan-300">
Go </span> </Link>

        <div className="hidden border-l border-slate-700 pl-5 sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            Booking details
          </p>

          <p className="text-sm text-slate-400">
            Administration
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 xl:block">
          {admin.email}
        </span>

        <Link
          href="/admin"
          className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
        >
          Back to Dashboard
        </Link>

        <LogoutButton />
      </div>
    </div>
  </header>

  <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
    <div className="mx-auto max-w-7xl px-5 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
        Booking record
      </p>

      <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">
            {booking.bookingCode}
          </h1>

          <p className="mt-3 text-sm text-white/70">
            Created{" "}
            {formatDate(
              booking.$createdAt
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span
            className={
              "rounded-full px-4 py-2 text-sm font-black " +
              statusClass(
                booking.bookingStatus
              )
            }
          >
            {booking.bookingStatus}
          </span>

          <span
            className={
              "rounded-full px-4 py-2 text-sm font-black " +
              statusClass(
                booking.paymentStatus
              )
            }
          >
            Payment:{" "}
            {booking.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  </section>

  <section className="mx-auto grid max-w-7xl gap-7 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-8">
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            Trip information
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {booking.fromPort}

            <span className="mx-3 text-cyan-300">
              →
            </span>

            {booking.toPort}
          </h2>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-7 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div>
              <p className="text-4xl font-black">
                {booking.departureTime}
              </p>

              <p className="mt-2 text-xl font-black">
                {booking.fromPort}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {booking.checkInLocation}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-bold text-slate-400">
                {booking.duration}
              </p>

              <div className="my-2 text-2xl text-cyan-700">
                ─────➜
              </div>

              <p className="text-xs font-bold text-emerald-600">
                Direct trip
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-4xl font-black">
                {booking.arrivalTime}
              </p>

              <p className="mt-2 text-xl font-black">
                {booking.toPort}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Estimated arrival
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Departure date
              </p>

              <p className="mt-2 font-black">
                {formatDate(
                  booking.departureDate
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operator
              </p>

              <p className="mt-2 font-black">
                {booking.operatorName}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Trip type
              </p>

              <p className="mt-2 font-black">
                {booking.tripType}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-black">
          Passenger details
        </h2>

        {passengers.length === 0 ? (
          <p className="mt-5 text-slate-500">
            Passenger information is unavailable.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {passengers.map(
              (passenger) => (
                <div
                  key={passenger.number}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Passenger{" "}
                      {passenger.number}
                    </p>

                    <p className="mt-1 font-black">
                      {passenger.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Adult
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-black">
          Notes
        </h2>

        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
          {booking.notes ||
            "No additional notes were provided."}
        </p>
      </section>
    </div>

    <aside className="space-y-6">
      <StatusEditor
        rowId={booking.$id}
        initialBookingStatus={
          booking.bookingStatus
        }
        initialPaymentStatus={
          booking.paymentStatus
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">
          Customer information
        </h2>

        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="text-slate-400">
              Full name
            </p>

            <p className="font-bold">
              {booking.customerFullName}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Email
            </p>

            <p className="break-all font-bold">
              {booking.customerEmail}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              WhatsApp
            </p>

            <p className="font-bold">
              {booking.customerWhatsapp}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Country
            </p>

            <p className="font-bold">
              {booking.customerCountry}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">
          Payment summary
        </h2>

        <div className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4 text-slate-500">
            <span>
              {booking.passengerCount} passenger
              {booking.passengerCount === 1
                ? ""
                : "s"}
            </span>

            <span>
              {formatCurrency(
                booking.totalPrice
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
            <span className="font-black">
              Total
            </span>

            <span className="text-xl font-black text-cyan-700">
              {formatCurrency(
                booking.totalPrice
              )}
            </span>
          </div>
        </div>
      </section>
    </aside>
  </section>
</main>

)
}

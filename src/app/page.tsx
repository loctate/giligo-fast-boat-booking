import SearchForm from "@/components/SearchForm"

const popularRoutes = [
  {
    from: "Padang Bai",
    to: "Gili Trawangan",
    duration: "1 hour 30 minutes",
    price: "IDR 350,000",
  },
  {
    from: "Sanur",
    to: "Nusa Penida",
    duration: "45 minutes",
    price: "IDR 175,000",
  },
  {
    from: "Serangan",
    to: "Gili Air",
    duration: "2 hours 30 minutes",
    price: "IDR 425,000",
  },
]

const destinations = [
  {
    name: "Gili Trawangan",
    description: "White beaches, diving and island nightlife.",
    image:
      "https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Nusa Penida",
    description: "Dramatic cliffs and unforgettable ocean views.",
    image:
      "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Lombok",
    description: "Beautiful beaches, culture and natural adventures.",
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80",
  },
]

const bookingSteps = [
  {
    number: "01",
    title: "Compare schedules",
    text: "Find suitable departure times and compare available fast boat options.",
  },
  {
    number: "02",
    title: "Secure your booking",
    text: "Enter your passenger information and review your trip before booking.",
  },
  {
    number: "03",
    title: "Receive your ticket",
    text: "Get your booking confirmation and electronic ticket for check-in.",
  },
]

export default function Home() {
  return (
    <main
      id="top"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* Header */}
      <header className="absolute left-0 top-0 z-30 w-full border-b border-white/20 bg-slate-950/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950">
              G
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight text-white">
                Gili<span className="text-cyan-300">Go</span>
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">
                Fast Boat Booking
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-white md:flex">
            <a
              href="#routes"
              className="transition hover:text-cyan-300"
            >
              Routes
            </a>

            <a
              href="#destinations"
              className="transition hover:text-cyan-300"
            >
              Destinations
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-cyan-300"
            >
              How to Book
            </a>

            <a
              href="#contact"
              className="transition hover:text-cyan-300"
            >
              Contact
            </a>
          </nav>

          <button
            type="button"
            className="rounded-full border border-white/40 px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-900"
          >
            My Booking
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative flex min-h-[760px] items-center bg-cover bg-center pt-28"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-cyan-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1fr_1.08fr] lg:px-8">
          {/* Hero Text */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
              Bali · Lombok · Gili Islands · Nusa Penida
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your island journey starts here.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
              Compare fast boat schedules and book your journey between Bali,
              Lombok and the Gili Islands in just a few simple steps.
            </p>

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs text-emerald-950">
                  ✓
                </span>
                Easy booking
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs text-emerald-950">
                  ✓
                </span>
                Trusted operators
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs text-emerald-950">
                  ✓
                </span>
                Instant confirmation
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="rounded-[28px] bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-7">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                Find your trip
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Search fast boat tickets
              </h2>
            </div>

            <SearchForm />
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section id="routes" className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                Popular routes
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Start your island adventure
              </h2>
            </div>

            <a
              href="#top"
              className="font-bold text-cyan-700 hover:text-cyan-900"
            >
              Search all routes →
            </a>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {popularRoutes.map((route) => (
              <article
                key={`${route.from}-${route.to}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700">
                    Fast Boat
                  </span>

                  <span className="text-sm text-slate-500">
                    {route.duration}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      From
                    </p>

                    <p className="truncate text-lg font-black">
                      {route.from}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-cyan-700">
                    →
                  </div>

                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      To
                    </p>

                    <p className="truncate text-lg font-black">
                      {route.to}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-xs text-slate-400">
                      Starting from
                    </p>

                    <p className="text-xl font-black text-cyan-700">
                      {route.price}
                    </p>
                  </div>

                  <a
                    href="#top"
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-cyan-700"
                  >
                    Check schedule
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section
        id="destinations"
        className="bg-slate-900 py-20 text-white"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              Explore Indonesia
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Popular island destinations
            </h2>

            <p className="mt-4 text-slate-300">
              Discover some of the most beautiful island destinations around
              Bali and Lombok.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {destinations.map((destination) => (
              <article
                key={destination.name}
                className="group relative min-h-[390px] overflow-hidden rounded-3xl"
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-0 p-7">
                  <h3 className="text-2xl font-black">
                    {destination.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {destination.description}
                  </p>

                  <a
                    href="#top"
                    className="mt-5 inline-block text-sm font-black text-cyan-300 hover:text-cyan-200"
                  >
                    Find a boat →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
              Why GiliGo
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Easy booking for every island journey
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {bookingSteps.map((item) => (
              <div key={item.number} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-xl font-black text-cyan-800">
                  {item.number}
                </div>

                <h3 className="mt-5 text-xl font-black">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-cyan-700 to-blue-800 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="font-bold text-cyan-200">
              Ready to explore?
            </p>

            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Find your next island journey.
            </h2>
          </div>

          <a
            href="#top"
            className="rounded-full bg-white px-7 py-4 font-black text-cyan-800 shadow-xl transition hover:-translate-y-1"
          >
            Search fast boat
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-slate-950 py-12 text-slate-300"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="text-3xl font-black text-white">
              Gili<span className="text-cyan-300">Go</span>
            </div>

            <p className="mt-4 max-w-md leading-7 text-slate-400">
              A fast boat booking platform for travel between Bali, Lombok,
              the Gili Islands and Nusa Penida.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white">
              Quick links
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a
                href="#routes"
                className="hover:text-cyan-300"
              >
                Popular routes
              </a>

              <a
                href="#destinations"
                className="hover:text-cyan-300"
              >
                Destinations
              </a>

              <a
                href="#how-it-works"
                className="hover:text-cyan-300"
              >
                How to book
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-black text-white">
              Contact
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>WhatsApp: +62 xxx xxxx xxxx</p>
              <p>Email: booking@giligo.demo</p>
              <p>Bali, Indonesia</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-800 px-5 pt-7 text-sm text-slate-500 lg:px-8">
          © 2026 GiliGo. Demo website for presentation purposes.
        </div>
      </footer>
    </main>
  )
}
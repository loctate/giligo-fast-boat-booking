import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title:
    "Tentang Kami | Nusa Gili Boat",
  description:
    "Nusa Gili Boat adalah platform pemesanan tiket fast boat online untuk perjalanan antara Bali, Nusa Penida, Nusa Lembongan, Nusa Ceningan, Kepulauan Gili, dan Lombok.",
}

const serviceValues = [
  {
    title: "Pemesanan online yang mudah",
    description:
      "Cari rute, pilih jadwal, isi data penumpang, dan selesaikan pemesanan melalui alur yang sederhana.",
  },
  {
    title: "Pilihan perjalanan yang jelas",
    description:
      "Informasi operator, kapal, jadwal, rute, harga, dan ketersediaan kursi ditampilkan sebelum booking.",
  },
  {
    title: "Harga yang transparan",
    description:
      "Rincian harga perjalanan ditampilkan sebelum pelanggan menyelesaikan pemesanan.",
  },
  {
    title: "Dukungan pelanggan",
    description:
      "Tim kami membantu pelanggan terkait booking, informasi perjalanan, perubahan jadwal, dan pertanyaan lainnya.",
  },
]

const bookingAdvantages = [
  "Pilihan operator fast boat yang telah diseleksi",
  "Pemesanan one-way dan round-trip",
  "Informasi harga dan jadwal yang jelas",
  "Konfirmasi booking dengan kode pemesanan",
  "Booking dapat diperiksa kembali menggunakan email",
  "Dukungan sebelum dan setelah pemesanan",
]

const destinations = [
  "Bali",
  "Nusa Penida",
  "Nusa Lembongan",
  "Nusa Ceningan",
  "Gili Trawangan",
  "Gili Air",
  "Gili Meno",
  "Lombok",
]

const routeExamples = [
  "Bali – Nusa Penida",
  "Bali – Nusa Lembongan",
  "Bali – Nusa Ceningan",
  "Bali – Gili Trawangan",
  "Bali – Gili Air",
  "Bali – Gili Meno",
  "Bali – Lombok",
  "Rute antar pulau sesuai ketersediaan operator",
]

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="Tentang Kami"
      title="Membuat perjalanan antar pulau lebih mudah direncanakan"
      description="Nusa Gili Boat adalah platform pemesanan tiket fast boat secara online yang membantu wisatawan mencari dan memesan perjalanan antara Bali, Nusa Penida, Nusa Lembongan, Nusa Ceningan, Kepulauan Gili, dan Lombok."
    >
      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Tentang Nusa Gili Boat
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat hadir untuk membantu wisatawan
          merencanakan perjalanan antar pulau dengan lebih
          mudah, praktis, dan terstruktur.
        </p>

        <p className="leading-8 text-slate-600">
          Melalui platform kami, pelanggan dapat mencari
          jadwal perjalanan, melihat informasi operator dan
          kapal, memeriksa ketersediaan kursi, serta melakukan
          pemesanan dalam satu alur yang sederhana.
        </p>

        <p className="leading-8 text-slate-600">
          Layanan kami dapat digunakan untuk berbagai
          kebutuhan perjalanan, mulai dari liburan,
          island hopping, kunjungan keluarga, hingga
          perjalanan bisnis.
        </p>

        <p className="leading-8 text-slate-600">
          Sebagai layanan yang sedang berkembang, fokus kami
          adalah membangun pengalaman pemesanan yang jelas,
          bertanggung jawab, dan mudah digunakan sejak awal.
        </p>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Misi Kami
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Menyederhanakan pemesanan transportasi laut
          </h2>
        </div>

        <p className="leading-8 text-slate-600">
          Misi Nusa Gili Boat adalah membantu wisatawan
          menemukan dan memesan perjalanan fast boat melalui
          layanan yang mudah digunakan, transparan, dan
          didukung oleh informasi perjalanan yang jelas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {serviceValues.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="font-semibold text-slate-950">
                {item.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Mengapa memilih kami
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Informasi lebih jelas sebelum Anda memesan
          </h2>
        </div>

        <p className="leading-8 text-slate-600">
          Kami berupaya memberikan informasi penting yang
          dibutuhkan pelanggan sebelum menyelesaikan booking.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {bookingAdvantages.map((advantage) => (
            <div
              key={advantage}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
            >
              <span
                aria-hidden="true"
                className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700"
              >
                ✓
              </span>

              <p className="leading-7 text-slate-600">
                {advantage}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Layanan Kami
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Pemesanan fast boat untuk destinasi populer
          </h2>
        </div>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat menyediakan layanan pemesanan
          perjalanan fast boat untuk berbagai rute yang
          menghubungkan Bali, Kepulauan Nusa, Kepulauan
          Gili, dan Lombok.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {routeExamples.map((route) => (
            <div
              key={route}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium text-slate-700"
            >
              {route}
            </div>
          ))}
        </div>

        <p className="text-sm leading-7 text-slate-500">
          Ketersediaan rute, jadwal, kapal, dan kursi
          bergantung pada data perjalanan serta inventory
          dari operator pada tanggal pencarian.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Destinasi yang kami layani
        </h2>

        <div className="flex flex-wrap gap-3">
          {destinations.map((destination) => (
            <span
              key={destination}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {destination}
            </span>
          ))}
        </div>

        <p className="leading-8 text-slate-600">
          Kami akan terus mengembangkan pilihan rute dan
          layanan perjalanan berdasarkan kerja sama operator,
          kebutuhan pelanggan, dan ketersediaan layanan.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Peran Nusa Gili Boat
        </h2>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat menyediakan layanan pencarian,
          pemesanan tiket, pencatatan booking, dan bantuan
          pelanggan. Kami bertindak sebagai perantara
          pemesanan antara pelanggan dan operator fast boat
          yang dipilih.
        </p>

        <p className="leading-8 text-slate-600">
          Layanan pelayaran, pengoperasian kapal, awak kapal,
          keselamatan transportasi, keputusan keberangkatan,
          dan pelayanan di lapangan menjadi tanggung jawab
          operator fast boat terkait.
        </p>

        <p className="leading-8 text-slate-600">
          Jadwal, kapal, rute, pelabuhan, dan waktu perjalanan
          dapat berubah karena kondisi cuaca, keadaan laut,
          keselamatan, kebutuhan operasional, kapasitas
          penumpang, atau instruksi otoritas terkait.
        </p>

        <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="font-semibold text-sky-950">
            Transparansi operator
          </h3>

          <p className="mt-2 leading-7 text-sky-900">
            Nama operator yang menyediakan perjalanan akan
            ditampilkan pada hasil pencarian, detail trip,
            checkout, dan konfirmasi booking pelanggan.
          </p>
        </aside>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Komitmen Kami
        </h2>

        <p className="leading-8 text-slate-600">
          Kami bekerja sama dengan operator fast boat yang
          telah dipilih dan berupaya menyediakan informasi
          jadwal, rute, harga, serta ketersediaan kursi secara
          jelas.
        </p>

        <p className="leading-8 text-slate-600">
          Kami berkomitmen membantu pelanggan sejak proses
          pencarian dan pemesanan hingga memperoleh informasi
          keberangkatan yang dibutuhkan.
        </p>

        <p className="leading-8 text-slate-600">
          Seiring berkembangnya Nusa Gili Boat, kami akan
          terus meningkatkan sistem pemesanan, metode
          pembayaran, dukungan pelanggan, pilihan operator,
          dan layanan perjalanan lainnya.
        </p>
      </section>

      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Perjalanan Anda dimulai di sini
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Temukan perjalanan fast boat yang sesuai
        </h2>

        <p className="mt-4 max-w-2xl leading-8 text-slate-300">
          Pilih rute, tanggal, dan jumlah penumpang untuk
          melihat jadwal serta kursi yang tersedia.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Cari perjalanan
          </Link>

          <Link
            href="/contact"
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-white transition hover:border-slate-500 hover:bg-slate-900"
          >
            Hubungi kami
          </Link>
        </div>
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Informasi usaha sedang dilengkapi
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Identitas pemilik usaha, alamat operasional, nomor
          layanan pelanggan, dan jam operasional resmi akan
          diperbarui setelah seluruh data administrasi usaha
          selesai dikonfirmasi.
        </p>
      </aside>
    </PublicInfoPage>
  )
}
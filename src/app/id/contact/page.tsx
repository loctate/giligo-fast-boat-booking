import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "id",
  path: "/contact",
  title: "Hubungi Kami | Nusa Gili Boat",
  description: "Hubungi tim Nusa Gili Boat untuk bantuan booking tiket fast boat, informasi jadwal, perubahan perjalanan, pembayaran, pembatalan, refund, dan e-ticket.",
})

const supportTopics = [
  {
    title: "Pemesanan tiket fast boat",
    description:
      "Bantuan mencari perjalanan, memilih operator, membuat booking one-way atau round-trip, dan memeriksa ketersediaan kursi.",
  },
  {
    title: "Informasi jadwal dan rute",
    description:
      "Informasi mengenai jadwal perjalanan, rute, pelabuhan keberangkatan, tujuan, operator, dan kapal.",
  },
  {
    title: "Perubahan booking",
    description:
      "Permintaan perubahan nama penumpang, tanggal perjalanan, jadwal, rute, atau data booking sesuai ketentuan operator.",
  },
  {
    title: "Pembatalan dan refund",
    description:
      "Bantuan terkait pembatalan booking, kelayakan refund, dokumen pendukung, dan status pengembalian dana.",
  },
  {
    title: "Pembayaran",
    description:
      "Bantuan untuk pembayaran tertunda, transaksi gagal, pembayaran ganda, atau status pembayaran yang belum diperbarui.",
  },
  {
    title: "Check-in dan perjalanan",
    description:
      "Informasi titik check-in, waktu kedatangan, dokumen perjalanan, e-ticket, dan persyaratan sebelum keberangkatan.",
  },
]

const requiredInformation = [
  "Nama lengkap pemesan.",
  "Kode booking atau Booking ID, apabila sudah tersedia.",
  "Alamat email yang digunakan saat booking.",
  "Nomor telepon atau WhatsApp yang dapat dihubungi.",
  "Tanggal dan rute perjalanan.",
  "Nama operator atau kapal, apabila tersedia.",
  "Penjelasan singkat mengenai pertanyaan atau kendala.",
  "Bukti pembayaran atau dokumen pendukung apabila relevan.",
]

export default function ContactPage() {
  return (
    <PublicInfoPage
      locale="id"
      eyebrow="Layanan Pelanggan"
      title="Kami siap membantu perjalanan Anda"
      description="Hubungi tim Nusa Gili Boat untuk pertanyaan mengenai booking tiket, jadwal keberangkatan, perubahan perjalanan, pembayaran, pembatalan, refund, e-ticket, dan informasi perjalanan lainnya."
    >
      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Email
          </p>

          <h2 className="mt-3 text-xl font-bold text-slate-950">
            Kirim pertanyaan melalui email
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Gunakan email resmi Nusa Gili Boat untuk
            pertanyaan umum, booking, pembayaran,
            perubahan perjalanan, pembatalan, refund,
            dan pelindungan data pribadi.
          </p>

          <a
            href="mailto:nusagiliboat@gmail.com"
            className="mt-5 inline-flex break-all rounded-full bg-sky-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-800"
          >
            nusagiliboat@gmail.com
          </a>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            WhatsApp
          </p>

          <h2 className="mt-3 text-xl font-bold text-slate-950">
            Hubungi layanan pelanggan
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Gunakan WhatsApp untuk bantuan booking,
            informasi keberangkatan, perubahan jadwal,
            atau perjalanan yang akan berlangsung dalam
            waktu dekat.
          </p>

          <a
            href="https://wa.me/6282180126117"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            +62 821 8012 6117
          </a>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              Jam operasional
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              Senin–Minggu
            </h2>

            <p className="mt-3 text-3xl font-black text-slate-950">
              08.00–20.00 WITA
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              WITA adalah Waktu Indonesia Tengah atau
              UTC+8.
            </p>
          </div>

          <div className="space-y-3 leading-7 text-slate-600">
            <p>
              Kami berupaya memberikan respons secepat
              mungkin selama jam operasional.
            </p>

            <p>
              Pesan yang diterima di luar jam layanan
              akan ditinjau pada periode operasional
              berikutnya.
            </p>

            <p>
              Waktu respons dapat berbeda tergantung
              jumlah permintaan, tingkat urgensi, dan
              kebutuhan konfirmasi kepada operator.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Layanan bantuan
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Hal yang dapat kami bantu
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {supportTopics.map((topic) => (
            <article
              key={topic.title}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <h3 className="font-semibold text-slate-950">
                {topic.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {topic.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Informasi yang perlu disertakan
        </h2>

        <p className="leading-8 text-slate-600">
          Agar permintaan dapat diperiksa dengan lebih
          cepat dan tepat, sertakan informasi yang
          relevan berikut:
        </p>

        <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
          {requiredInformation.map((item) => (
            <li key={item}>
              {item}
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-950">
            Lindungi informasi pembayaran Anda
          </h3>

          <p className="mt-2 leading-7 text-amber-900">
            Jangan mengirimkan PIN, kata sandi
            perbankan, nomor kartu lengkap, CVV, atau
            kode OTP melalui email, WhatsApp, maupun
            saluran layanan pelanggan lainnya.
          </p>
        </aside>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Perjalanan dalam waktu dekat
        </h2>

        <p className="leading-8 text-slate-600">
          Untuk perjalanan yang akan berangkat dalam
          waktu dekat, cantumkan kata
          <strong className="font-semibold text-slate-950">
            {" URGENT "}
          </strong>
          dan kode booking pada awal pesan atau subjek
          email.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila Anda sudah berada di pelabuhan,
          ikuti juga arahan petugas pelabuhan dan
          operator fast boat yang tercantum pada
          konfirmasi perjalanan atau e-ticket.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bukan layanan darurat. Dalam
          kondisi yang mengancam keselamatan, segera
          hubungi petugas pelabuhan, operator kapal,
          atau layanan darurat setempat.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Periksa booking Anda
        </h2>

        <p className="leading-8 text-slate-600">
          Detail booking dapat diperiksa kembali
          menggunakan kode booking dan alamat email
          yang digunakan saat pemesanan.
        </p>

        <Link
          href="/"
          className="inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Periksa booking
        </Link>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Kebijakan layanan
        </h2>

        <p className="leading-8 text-slate-600">
          Sebelum mengajukan perubahan, pembatalan,
          refund, atau permintaan terkait data pribadi,
          silakan membaca kebijakan yang relevan.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/id/terms-and-conditions"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
          >
            Syarat dan Ketentuan
          </Link>

          <Link
            href="/id/refund-and-cancellation-policy"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
          >
            Refund dan Pembatalan
          </Link>

          <Link
            href="/id/privacy-policy"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
          >
            Kebijakan Privasi
          </Link>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Informasi kontak resmi
        </p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Nusa Gili Boat
        </h2>

        <dl className="mt-6 grid gap-5 text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-white">
              Email
            </dt>

            <dd className="mt-1">
              <a
                href="mailto:nusagiliboat@gmail.com"
                className="transition hover:text-cyan-300"
              >
                nusagiliboat@gmail.com
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-white">
              WhatsApp
            </dt>

            <dd className="mt-1">
              <a
                href="https://wa.me/6282180126117"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-cyan-300"
              >
                +62 821 8012 6117
              </a>
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-white">
              Website
            </dt>

            <dd className="mt-1">
              www.nusagiliboat.com
            </dd>
          </div>

          <div>
            <dt className="font-semibold text-white">
              Jam operasional
            </dt>

            <dd className="mt-1">
              Setiap hari, 08.00–20.00 WITA
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-slate-200 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Lokasi Bisnis dan Wilayah Layanan
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Operasional bisnis dan layanan pelanggan
            </h2>

            <p className="mt-3 text-lg font-semibold text-slate-700">
              Jakarta, Indonesia
            </p>

            <p className="mt-3 leading-7 text-slate-600">
              Administrasi bisnis dan layanan pelanggan
              dikelola secara online dari Jakarta
              melalui WhatsApp dan email.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Wilayah layanan fast boat
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Bali, Nusa Penida, Nusa Lembongan,
              Nusa Ceningan, Kepulauan Gili, dan
              Lombok.
            </p>

            <p className="mt-3 leading-7 text-slate-600">
              Layanan transportasi dijalankan oleh
              operator fast boat yang dipilih dalam
              booking pelanggan.
            </p>
          </div>
        </div>
      </section>

    </PublicInfoPage>
  )
}
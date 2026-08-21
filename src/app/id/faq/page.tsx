import type {
  Metadata,
} from "next"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"
import { createPublicPageMetadata } from "@/lib/publicPageMetadata"

export const metadata: Metadata = createPublicPageMetadata({
  locale: "id",
  path: "/faq",
  title: "Pertanyaan yang Sering Diajukan | Nusa Gili Boat",
  description: "Jawaban mengenai pemesanan tiket fast boat, rute, jadwal, pembayaran online aman melalui iPaymu, konfirmasi, tiket, pembatalan, refund, bagasi, dan layanan pelanggan.",
})

type FaqItem = {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: "Apa itu Nusa Gili Boat?",
    answer: "Nusa Gili Boat adalah layanan pemesanan tiket fast boat secara online. Kami membantu pelanggan mencari jadwal, memilih rute, mengisi data penumpang, membuat booking, serta berkomunikasi dengan layanan pelanggan untuk pembayaran dan konfirmasi.",
  },
  {
    question: "Siapa yang menjalankan perjalanan fast boat?",
    answer: "Layanan transportasi laut, kapal, awak kapal, check-in, boarding, dan perjalanan dijalankan oleh operator fast boat yang dipilih. Nusa Gili Boat mengelola website booking, informasi inventory, komunikasi pelanggan, dan administrasi booking.",
  },
  {
    question: "Destinasi dan rute apa saja yang tersedia?",
    answer: "Rute yang tersedia dapat mencakup Bali, Nusa Penida, Kepulauan Gili, dan Lombok. Rute, jadwal, operator, harga, dan ketersediaan kursi yang tampil bergantung pada inventory terbaru.",
  },
  {
    question: "Bagaimana cara membuat booking?",
    answer: "Pilih perjalanan satu arah atau pulang-pergi, lokasi keberangkatan, tujuan, tanggal perjalanan, dan jumlah penumpang. Pilih perjalanan yang tersedia, isi data pelanggan dan penumpang, periksa kembali detailnya, lalu kirim booking.",
  },
  {
    question: "Mengapa saya tidak dapat memesan untuk hari ini atau besok?",
    answer: "Nusa Gili Boat menerapkan batas minimum waktu pemesanan. Perjalanan umumnya dapat dipesan mulai dua hari setelah tanggal saat ini agar admin dan operator memiliki waktu untuk memverifikasi inventory dan memproses reservasi.",
  },
  {
    question: "Apakah hasil pencarian menjamin kursi tersedia?",
    answer: "Hasil pencarian mengikuti inventory yang tercatat saat pencarian dilakukan. Kursi belum ditahan sampai booking berhasil dibuat. Ketersediaan dapat berubah sebelum proses booking selesai.",
  },
  {
    question: "Kapan booking saya dianggap terkonfirmasi?",
    answer: "Terbitnya kode booking belum berarti pembayaran dan konfirmasi telah selesai. Booking dikonfirmasi setelah pembayaran diterima dan diverifikasi admin, kemudian status booking diubah menjadi Confirmed.",
  },
  {
    question: "Metode pembayaran apa yang tersedia saat ini?",
    answer: "Metode pembayaran online yang tersedia ditampilkan melalui halaman pembayaran aman iPaymu setelah booking dibuat. Selesaikan pembayaran menggunakan salah satu metode yang tersedia untuk transaksi Anda.",
  },
  {
    question: "Bagaimana proses pembayaran melalui QRIS?",
    answer: "Jika QRIS tersedia untuk transaksi Anda, pilih metode tersebut pada halaman pembayaran aman iPaymu dan ikuti instruksi pembayaran yang ditampilkan.",
  },
  {
    question: "Bagaimana pembayaran menggunakan kartu kredit atau debit?",
    answer: "Jika pembayaran kartu tersedia untuk transaksi Anda, pilih opsi yang sesuai pada halaman pembayaran aman iPaymu dan ikuti instruksi yang ditampilkan.",
  },
  {
    question: "Apakah saya harus mengirimkan data kartu atau perbankan melalui WhatsApp?",
    answer: "Tidak. Jangan pernah mengirim PIN, OTP, CVV, kata sandi perbankan, nomor kartu lengkap, atau kredensial finansial rahasia melalui WhatsApp, email, maupun formulir layanan pelanggan.",
  },
  {
    question: "Berapa lama kursi ditahan saat pembayaran masih pending?",
    answer: "Kursi hanya ditahan untuk jangka waktu terbatas selama booking berstatus pending. Segera selesaikan pembayaran dan perhatikan informasi kedaluwarsa pada halaman booking. Booking yang kedaluwarsa atau dibatalkan dapat melepaskan kursi secara otomatis.",
  },
  {
    question: "Bagaimana saya menerima konfirmasi atau tiket?",
    answer: "Setelah pembayaran diverifikasi dan booking dikonfirmasi, Nusa Gili Boat akan memberikan konfirmasi booking serta tiket atau instruksi perjalanan yang berlaku melalui informasi kontak yang dicantumkan pada booking.",
  },
  {
    question: "Apakah biaya pelabuhan dan biaya lokal sudah termasuk?",
    answer: "Website menampilkan harga tiket dan biaya yang termasuk apabila informasinya tersedia pada detail booking. Bergantung pada rute atau operator, biaya pelabuhan, retribusi, biaya wisata, transfer, bagasi berlebih, atau layanan lain dapat ditagihkan secara terpisah.",
  },
  {
    question: "Bagaimana ketentuan check-in dan bagasi?",
    answer: "Waktu check-in, titik pertemuan, batas bagasi, dan aturan barang khusus dapat berbeda pada setiap operator. Pelanggan wajib mengikuti instruksi pada booking yang telah dikonfirmasi dan datang lebih awal untuk check-in serta boarding.",
  },
  {
    question: "Apakah jadwal keberangkatan dapat berubah?",
    answer: "Ya. Jadwal fast boat dapat berubah karena cuaca, kondisi laut, instruksi pelabuhan, kebutuhan operasional, atau keputusan operator. Kami akan menyampaikan informasi penting yang diterima dari operator apabila memungkinkan.",
  },
  {
    question: "Apakah data penumpang dapat diubah atau booking dapat dibatalkan?",
    answer: "Hubungi layanan pelanggan secepat mungkin. Perubahan, pembatalan, dan refund bergantung pada status booking, waktu keberangkatan, ketentuan operator, serta Kebijakan Refund dan Pembatalan Nusa Gili Boat.",
  },
  {
    question: "Bagaimana cara menghubungi Nusa Gili Boat?",
    answer: "Gunakan halaman Hubungi Kami untuk melihat email resmi, nomor WhatsApp, jam operasional, dan lokasi bisnis. Sertakan kode booking apabila Anda membutuhkan bantuan untuk booking yang sudah dibuat.",
  },
]

export default function FrequentlyAskedQuestionsPage() {
  return (
    <PublicInfoPage
      locale="id"
      eyebrow="Layanan Pelanggan"
      title="Pertanyaan yang Sering Diajukan"
      description="Temukan jawaban mengenai pencarian perjalanan, pemesanan tiket fast boat, pembayaran online aman melalui iPaymu, konfirmasi booking, jadwal, tiket, pembatalan, dan layanan pelanggan."
      lastUpdated="24 Juli 2026"
    >
      <section className="space-y-4">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
          <h2 className="text-lg font-black text-cyan-950">
            Sebelum melakukan perjalanan
          </h2>

          <p className="mt-2 leading-7 text-cyan-900">
            Periksa kembali rute, tanggal perjalanan, data
            penumpang, status booking, status pembayaran,
            dan instruksi operator sebelum keberangkatan.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-cyan-300 open:bg-cyan-50/40"
            >
              <summary className="cursor-pointer list-none pr-8 font-bold text-slate-950 marker:hidden">
                <span className="mr-2 text-cyan-700">
                  {index + 1}.
                </span>
                {item.question}
              </summary>

              <p className="mt-4 leading-7 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-black text-slate-950">
          Masih membutuhkan bantuan?
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Hubungi tim layanan pelanggan kami dan sertakan
          kode booking apabila pertanyaan berkaitan dengan
          reservasi yang sudah dibuat.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/id/contact"
            className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            Hubungi Kami
          </Link>

          <Link
            href="/id/terms-and-conditions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Syarat dan Ketentuan
          </Link>

          <Link
            href="/id/refund-and-cancellation-policy"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Kebijakan Refund
          </Link>
        </div>
      </section>
    </PublicInfoPage>
  )
}

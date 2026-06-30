import type {
  Metadata,
} from "next"

import type {
  ReactNode,
} from "react"

import Link from "next/link"

import PublicInfoPage from "@/components/PublicInfoPage"

export const metadata: Metadata = {
  title:
    "Syarat dan Ketentuan | Nusa Gili Boat",
  description:
    "Syarat dan ketentuan penggunaan situs, pencarian perjalanan, pemesanan, pembayaran, perubahan, pembatalan, dan layanan fast boat melalui Nusa Gili Boat.",
}

type PolicySectionProps = {
  number: number
  title: string
  children: ReactNode
}

type BulletListProps = {
  items: string[]
}

function PolicySection({
  number,
  title,
  children,
}: PolicySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        {number}. {title}
      </h2>

      {children}
    </section>
  )
}

function BulletList({
  items,
}: BulletListProps) {
  return (
    <ul className="list-disc space-y-3 pl-6 leading-7 text-slate-600">
      {items.map((item) => (
        <li key={item}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function TermsAndConditionsPage() {
  return (
    <PublicInfoPage
      eyebrow="Informasi Hukum"
      title="Syarat dan Ketentuan"
      description="Syarat dan Ketentuan ini mengatur penggunaan situs, pencarian perjalanan, pemesanan tiket, pembayaran, perubahan, pembatalan, dan layanan fast boat yang dipesan melalui Nusa Gili Boat."
      lastUpdated="30 Juni 2026"
    >
      <PolicySection
        number={1}
        title="Persetujuan terhadap Syarat dan Ketentuan"
      >
        <p className="leading-8 text-slate-600">
          Selamat datang di Nusa Gili Boat. Dengan
          mengakses, menjelajahi, mencari perjalanan,
          membuat booking, melakukan pembayaran, atau
          menggunakan layanan yang tersedia melalui
          situs Nusa Gili Boat, pengguna dianggap telah
          membaca, memahami, dan menyetujui seluruh
          Syarat dan Ketentuan ini.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila pengguna tidak menyetujui sebagian
          atau seluruh ketentuan ini, pengguna tidak
          disarankan melanjutkan penggunaan layanan
          atau membuat booking.
        </p>

        <p className="leading-8 text-slate-600">
          Pengguna yang membuat booking untuk orang
          lain menyatakan bahwa pengguna berwenang
          memberikan data penumpang tersebut dan telah
          menyampaikan ketentuan perjalanan yang berlaku
          kepada seluruh penumpang dalam booking.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="Definisi"
      >
        <p className="leading-8 text-slate-600">
          Dalam Syarat dan Ketentuan ini, istilah berikut
          memiliki arti sebagai berikut:
        </p>

        <BulletList
          items={[
            "Nusa Gili Boat adalah platform daring yang menyediakan layanan pencarian dan pemesanan tiket fast boat.",
            "Pengguna adalah setiap orang yang mengakses situs atau menggunakan layanan Nusa Gili Boat.",
            "Pelanggan adalah pengguna yang membuat atau membayar sebuah booking.",
            "Penumpang adalah orang yang namanya tercatat dalam booking untuk menggunakan layanan transportasi.",
            "Operator adalah penyedia layanan transportasi fast boat yang menjalankan perjalanan yang dipilih pelanggan.",
            "Booking adalah reservasi perjalanan yang dibuat melalui sistem Nusa Gili Boat.",
            "Kode booking adalah kode unik yang digunakan untuk mengidentifikasi reservasi pelanggan.",
            "Konfirmasi booking adalah informasi elektronik yang memuat detail dan status reservasi pelanggan.",
            "E-ticket adalah tiket atau voucher elektronik yang diterbitkan setelah pembayaran berhasil dan booking dikonfirmasi.",
            "Perjalanan atau trip adalah satu layanan transportasi dari pelabuhan keberangkatan menuju pelabuhan tujuan.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={3}
        title="Ruang lingkup layanan"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat membantu pengguna mencari,
          membandingkan, dan memesan perjalanan fast
          boat menuju destinasi yang tersedia pada
          platform.
        </p>

        <p className="leading-8 text-slate-600">
          Destinasi tersebut dapat mencakup Bali, Nusa
          Penida, Nusa Lembongan, Nusa Ceningan,
          Gili Trawangan, Gili Air, Gili Meno, Lombok,
          dan rute antar pulau lainnya sesuai
          ketersediaan operator.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bertindak sebagai perantara
          pemesanan antara pelanggan dan operator.
          Transportasi laut, kapal, awak kapal,
          keselamatan pelayaran, check-in, boarding,
          dan pelaksanaan perjalanan disediakan oleh
          operator terkait.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="Persyaratan pengguna"
      >
        <p className="leading-8 text-slate-600">
          Pihak yang membuat booking harus berusia
          sekurang-kurangnya 18 tahun dan memiliki
          kewenangan hukum untuk melakukan transaksi.
        </p>

        <p className="leading-8 text-slate-600">
          Booking untuk anak atau bayi harus dilakukan
          oleh orang tua, wali, atau orang dewasa yang
          bertanggung jawab atas perjalanan tersebut.
        </p>

        <p className="leading-8 text-slate-600">
          Pengguna wajib memberikan informasi yang
          benar, lengkap, terkini, dan dapat
          diverifikasi.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Proses pemesanan"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan harus memilih rute, tanggal,
          jadwal, operator, jumlah penumpang, dan detail
          perjalanan sebelum mengisi informasi
          pelanggan dan penumpang.
        </p>

        <p className="leading-8 text-slate-600">
          Sebelum mengirim booking, pelanggan wajib
          memeriksa kembali seluruh informasi yang
          ditampilkan pada halaman checkout.
        </p>

        <p className="leading-8 text-slate-600">
          Setelah booking berhasil dibuat, sistem akan
          menerbitkan kode booking dan halaman
          konfirmasi yang berisi detail serta status
          reservasi.
        </p>

        <p className="leading-8 text-slate-600">
          Booking belum dianggap telah dibayar atau
          dikonfirmasi hanya karena kode booking telah
          diterbitkan. Pelanggan harus memeriksa status
          pembayaran dan status booking.
        </p>
      </PolicySection>

      <PolicySection
        number={6}
        title="Ketersediaan kursi"
      >
        <p className="leading-8 text-slate-600">
          Hasil pencarian didasarkan pada informasi
          jadwal, inventory, dan ketersediaan kursi
          yang tercatat pada sistem saat pencarian
          dilakukan.
        </p>

        <p className="leading-8 text-slate-600">
          Ketersediaan kursi dapat berubah sebelum
          booking berhasil diproses. Pemilihan
          perjalanan pada hasil pencarian tidak dengan
          sendirinya menjamin bahwa kursi telah dipesan.
        </p>

        <p className="leading-8 text-slate-600">
          Pemesanan hanya dapat dilakukan untuk tanggal
          perjalanan yang memenuhi batas waktu minimum
          pemesanan yang ditentukan dalam sistem Nusa
          Gili Boat.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Harga dan biaya tambahan"
      >
        <p className="leading-8 text-slate-600">
          Harga yang ditampilkan berlaku pada saat
          booking dibuat dan dapat berubah sebelum
          pembayaran berhasil diselesaikan.
        </p>

        <p className="leading-8 text-slate-600">
          Harga pada situs ditampilkan dalam Rupiah
          Indonesia, kecuali dinyatakan lain secara
          jelas.
        </p>

        <p className="leading-8 text-slate-600">
          Harga dapat mencakup tiket fast boat serta
          pajak atau biaya lain yang secara jelas
          dicantumkan dalam rincian pembayaran.
        </p>

        <p className="leading-8 text-slate-600">
          Bergantung pada rute dan operator, harga tiket
          dapat tidak mencakup:
        </p>

        <BulletList
          items={[
            "Biaya pelabuhan.",
            "Retribusi daerah.",
            "Biaya masuk kawasan wisata.",
            "Biaya konservasi atau pungutan pemerintah.",
            "Transportasi atau layanan antar-jemput hotel.",
            "Bagasi berlebih atau barang khusus.",
            "Layanan tambahan yang tidak disebutkan dalam detail perjalanan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Biaya lokal yang tidak termasuk dalam harga
          online dapat ditagihkan oleh operator,
          pelabuhan, pengelola destinasi, atau otoritas
          terkait.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="Pembayaran"
      >
        <p className="leading-8 text-slate-600">
          Pembayaran dilakukan melalui metode yang
          tersedia pada halaman pembayaran.
        </p>

        <p className="leading-8 text-slate-600">
          Pembayaran online dapat diproses oleh penyedia
          payment gateway, bank, virtual account,
          dompet elektronik, QRIS, kartu pembayaran,
          atau penyedia pembayaran lainnya.
        </p>

        <p className="leading-8 text-slate-600">
          Status resmi yang diterima dari penyedia
          pembayaran akan menjadi dasar penentuan
          apakah transaksi berhasil, tertunda,
          kedaluwarsa, dibatalkan, ditolak, atau telah
          dikembalikan.
        </p>

        <p className="leading-8 text-slate-600">
          Booking yang tidak dibayar sampai batas waktu
          pembayaran dapat kedaluwarsa. Kursi yang
          sebelumnya dialokasikan dapat dilepas kembali
          tanpa pemberitahuan tambahan.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat tidak meminta PIN, CVV,
          password perbankan, maupun kode OTP melalui
          email, WhatsApp, atau layanan pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={9}
        title="Konfirmasi booking dan e-ticket"
      >
        <p className="leading-8 text-slate-600">
          Booking dinyatakan terkonfirmasi setelah
          pembayaran berhasil diterima dan status
          booking telah diperbarui menjadi dikonfirmasi
          oleh sistem atau tim Nusa Gili Boat.
        </p>

        <p className="leading-8 text-slate-600">
          Setelah pembayaran berhasil dan booking
          dikonfirmasi, pelanggan akan memperoleh
          konfirmasi booking yang memuat kode booking
          serta informasi perjalanan.
        </p>

        <p className="leading-8 text-slate-600">
          Setelah fitur e-ticket diaktifkan pada
          layanan Nusa Gili Boat, sistem juga akan
          menerbitkan e-ticket atau voucher elektronik
          secara otomatis.
        </p>

        <p className="leading-8 text-slate-600">
          E-ticket akan dikirimkan ke alamat email yang
          digunakan saat pemesanan dan dapat tersedia
          melalui halaman detail booking.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan bertanggung jawab memeriksa kode
          booking, nama penumpang, rute, tanggal,
          operator, jadwal, jumlah penumpang, status
          pembayaran, dan informasi lain yang tercantum
          dalam konfirmasi maupun e-ticket.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila terdapat kesalahan atau perbedaan
          informasi, pelanggan harus segera menghubungi
          layanan pelanggan setelah mengetahuinya dan
          sebelum waktu keberangkatan.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Kewajiban penumpang dan check-in"
      >
        <p className="leading-8 text-slate-600">
          Penumpang wajib mengikuti waktu check-in yang
          ditentukan oleh operator atau tercantum dalam
          konfirmasi perjalanan maupun e-ticket.
        </p>

        <p className="leading-8 text-slate-600">
          Sebagai pedoman umum, penumpang dianjurkan
          berada di lokasi check-in sekurang-kurangnya
          60 menit sebelum keberangkatan, kecuali
          operator memberikan instruksi waktu yang
          berbeda.
        </p>

        <BulletList
          items={[
            "Membawa identitas dan dokumen perjalanan yang diperlukan.",
            "Membawa konfirmasi booking atau e-ticket apabila telah diterbitkan.",
            "Mengikuti prosedur check-in dan boarding.",
            "Mematuhi aturan pelabuhan.",
            "Mematuhi instruksi keselamatan dari operator dan awak kapal.",
            "Memastikan informasi kontak dapat digunakan untuk menerima pembaruan perjalanan.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={11}
        title="Jadwal perjalanan"
      >
        <p className="leading-8 text-slate-600">
          Waktu keberangkatan, waktu kedatangan, dan
          durasi perjalanan merupakan perkiraan
          berdasarkan jadwal yang tersedia.
        </p>

        <p className="leading-8 text-slate-600">
          Operator dapat mengubah waktu, kapal, rute,
          pelabuhan, titik check-in, atau pengaturan
          perjalanan karena:
        </p>

        <BulletList
          items={[
            "Cuaca dan kondisi laut.",
            "Pasang surut air laut.",
            "Kepadatan atau penutupan pelabuhan.",
            "Gangguan atau pemeriksaan teknis.",
            "Pertimbangan keselamatan.",
            "Kapasitas dan kebutuhan operasional.",
            "Instruksi pemerintah atau otoritas pelabuhan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat akan berupaya menyampaikan
          pembaruan yang diterima dari operator melalui
          informasi kontak pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Keterlambatan dan perjalanan lanjutan"
      >
        <p className="leading-8 text-slate-600">
          Transportasi laut dapat mengalami
          keterlambatan karena faktor cuaca, kondisi
          laut, pelabuhan, teknis, keselamatan, atau
          operasional.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan disarankan memberikan jeda waktu
          yang memadai sebelum penerbangan, hotel, tur,
          rapat, atau transportasi lanjutan.
        </p>

        <p className="leading-8 text-slate-600">
          Sejauh diperbolehkan hukum, biaya tidak
          langsung yang terjadi karena perubahan
          jadwal operator, seperti tiket lanjutan,
          hotel, agenda pribadi, atau kehilangan
          kesempatan bisnis, tidak otomatis menjadi
          tanggungan Nusa Gili Boat.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Perubahan dan pembatalan oleh pelanggan"
      >
        <p className="leading-8 text-slate-600">
          Permintaan perubahan nama, tanggal, jadwal,
          rute, penumpang, atau pembatalan harus
          diajukan melalui saluran layanan pelanggan
          resmi.
        </p>

        <p className="leading-8 text-slate-600">
          Persetujuan perubahan bergantung pada
          kebijakan operator, kondisi tarif,
          ketersediaan kursi, status pembayaran, dan
          waktu pengajuan.
        </p>

        <p className="leading-8 text-slate-600">
          Selisih harga, penalti operator, biaya
          administrasi, atau biaya pemrosesan dapat
          berlaku apabila telah diinformasikan dan
          memang relevan terhadap permintaan tersebut.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Baca Kebijakan Refund dan Pembatalan
        </Link>
      </PolicySection>

      <PolicySection
        number={14}
        title="Pembatalan oleh operator"
      >
        <p className="leading-8 text-slate-600">
          Operator dapat membatalkan perjalanan karena
          cuaca buruk, kondisi laut yang tidak aman,
          masalah teknis, alasan operasional, penutupan
          pelabuhan, instruksi otoritas, atau keadaan
          kahar.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila perjalanan dibatalkan operator,
          alternatif yang tersedia dapat berupa:
        </p>

        <BulletList
          items={[
            "Pemindahan ke jadwal lain.",
            "Pemindahan ke operator lain dengan persetujuan pelanggan.",
            "Kredit perjalanan apabila disepakati.",
            "Refund untuk perjalanan yang terdampak sesuai kebijakan yang berlaku.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Alternatif perjalanan tetap bergantung pada
          ketersediaan kursi dan kondisi operasional.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Tidak hadir atau no-show"
      >
        <p className="leading-8 text-slate-600">
          Penumpang dapat dianggap no-show apabila:
        </p>

        <BulletList
          items={[
            "Tidak hadir pada waktu check-in.",
            "Datang setelah proses boarding ditutup.",
            "Tidak berada di titik keberangkatan yang ditentukan.",
            "Tidak membawa identitas atau dokumen wajib.",
            "Tidak memenuhi persyaratan perjalanan yang berlaku.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Booking no-show pada umumnya tidak dapat
          direfund atau dijadwalkan ulang, kecuali
          operator memutuskan lain.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Booking pulang-pergi"
      >
        <p className="leading-8 text-slate-600">
          Booking pulang-pergi terdiri dari perjalanan
          keberangkatan dan perjalanan kembali yang
          diperlakukan sebagai dua perjalanan.
        </p>

        <p className="leading-8 text-slate-600">
          Setiap perjalanan dapat memiliki operator,
          kapal, harga, jadwal, ketentuan perubahan,
          dan kebijakan pembatalan yang berbeda.
        </p>

        <p className="leading-8 text-slate-600">
          Pembatalan atau perubahan satu perjalanan
          tidak otomatis membatalkan perjalanan lainnya,
          kecuali telah disetujui dan dikonfirmasi.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Bagasi"
      >
        <p className="leading-8 text-slate-600">
          Jumlah, berat, ukuran, dan jenis bagasi yang
          diperbolehkan mengikuti ketentuan operator.
        </p>

        <p className="leading-8 text-slate-600">
          Papan selancar, sepeda, peralatan menyelam,
          perlengkapan olahraga, hewan, atau barang
          berukuran besar dapat memerlukan persetujuan
          dan biaya tambahan.
        </p>

        <p className="leading-8 text-slate-600">
          Barang berbahaya, mudah terbakar, mudah
          meledak, ilegal, atau berpotensi mengganggu
          keselamatan dilarang dibawa.
        </p>

        <p className="leading-8 text-slate-600">
          Penumpang bertanggung jawab menjaga uang,
          dokumen, perangkat elektronik, obat-obatan,
          perhiasan, dan barang berharga lainnya.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Kesehatan dan keselamatan"
      >
        <p className="leading-8 text-slate-600">
          Perjalanan fast boat dapat melibatkan
          pergerakan kapal, gelombang, proses naik turun
          kapal, dan fasilitas yang berbeda dari
          transportasi darat.
        </p>

        <p className="leading-8 text-slate-600">
          Penumpang yang sedang hamil, memiliki kondisi
          jantung, gangguan punggung, keterbatasan
          mobilitas, kondisi medis tertentu, atau
          membutuhkan bantuan khusus harus meminta
          saran medis dan menghubungi kami sebelum
          membuat booking.
        </p>

        <p className="leading-8 text-slate-600">
          Operator dapat menerapkan pembatasan
          perjalanan berdasarkan kondisi keselamatan,
          fasilitas kapal, keadaan laut, dan rekomendasi
          medis.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="Anak dan bayi"
      >
        <p className="leading-8 text-slate-600">
          Anak dan bayi harus didampingi orang dewasa
          yang bertanggung jawab selama check-in,
          boarding, dan perjalanan.
        </p>

        <p className="leading-8 text-slate-600">
          Kategori usia, harga, tempat duduk, dokumen,
          dan persyaratan anak atau bayi mengikuti
          ketentuan operator yang dipilih.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="Dokumen perjalanan"
      >
        <p className="leading-8 text-slate-600">
          Penumpang bertanggung jawab memiliki
          identitas, paspor, visa, izin perjalanan,
          tiket, atau dokumen lain yang diwajibkan.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat tidak bertanggung jawab atas
          penolakan check-in atau boarding yang
          disebabkan dokumen penumpang tidak lengkap,
          tidak sesuai, atau tidak berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Asuransi perjalanan"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan dianjurkan memiliki asuransi
          perjalanan yang sesuai dengan kebutuhan dan
          risiko perjalanannya.
        </p>

        <p className="leading-8 text-slate-600">
          Pertanggungan dapat mencakup kecelakaan,
          biaya medis, pembatalan perjalanan, kehilangan
          bagasi, keterlambatan, dan evakuasi darurat,
          sesuai polis yang dipilih pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Keadaan kahar"
      >
        <p className="leading-8 text-slate-600">
          Keadaan kahar adalah peristiwa di luar
          kendali wajar yang menghambat atau menyebabkan
          layanan tidak dapat dilaksanakan sebagaimana
          direncanakan.
        </p>

        <BulletList
          items={[
            "Cuaca ekstrem dan kondisi laut berbahaya.",
            "Gempa bumi, tsunami, letusan gunung berapi, atau bencana alam lainnya.",
            "Wabah, pandemi, atau keadaan darurat kesehatan.",
            "Perang, terorisme, kerusuhan, atau gangguan keamanan.",
            "Pemogokan atau gangguan layanan publik.",
            "Penutupan pelabuhan atau pembatasan pemerintah.",
            "Gangguan teknis besar pada sistem atau infrastruktur.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Penyelesaian booking dalam keadaan tersebut
          akan mempertimbangkan kondisi aktual,
          kebijakan operator, metode pembayaran, dan
          ketentuan hukum yang berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Pembagian tanggung jawab"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bertanggung jawab atas
          pelaksanaan layanan pemesanan yang berada
          dalam kendali kami, termasuk pemrosesan data
          booking, penyajian informasi, dan bantuan
          pelanggan dengan kehati-hatian yang wajar.
        </p>

        <p className="leading-8 text-slate-600">
          Operator bertanggung jawab atas pengoperasian
          kapal, awak kapal, pelayanan transportasi,
          keselamatan pelayaran, bagasi yang diterima
          operator, dan tindakan operasionalnya.
        </p>

        <p className="leading-8 text-slate-600">
          Keluhan mengenai pelaksanaan transportasi
          dapat diteruskan kepada operator terkait.
          Nusa Gili Boat dapat membantu komunikasi dan
          penanganan keluhan berdasarkan informasi yang
          tersedia.
        </p>

        <p className="leading-8 text-slate-600">
          Tidak ada bagian dalam Syarat dan Ketentuan
          ini yang dimaksudkan untuk menghapus hak
          konsumen atau tanggung jawab yang tidak dapat
          dikesampingkan berdasarkan hukum Republik
          Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Akurasi informasi"
      >
        <p className="leading-8 text-slate-600">
          Kami berupaya menampilkan informasi rute,
          jadwal, harga, operator, kapal, dan
          ketersediaan kursi secara akurat.
        </p>

        <p className="leading-8 text-slate-600">
          Informasi tersebut dapat berubah karena
          pembaruan operator, perubahan inventory,
          kebutuhan operasional, atau kesalahan teknis.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila ditemukan kesalahan yang berdampak
          material terhadap booking, kami akan
          menghubungi pelanggan untuk menawarkan
          koreksi atau penyelesaian yang sesuai.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Ketersediaan situs"
      >
        <p className="leading-8 text-slate-600">
          Kami berupaya menjaga situs dan layanan tetap
          tersedia, tetapi tidak menjamin situs akan
          selalu bebas gangguan.
        </p>

        <p className="leading-8 text-slate-600">
          Gangguan sementara dapat terjadi akibat
          pemeliharaan, pembaruan perangkat lunak,
          gangguan jaringan, masalah server, serangan
          keamanan, atau keadaan lain di luar kendali
          kami.
        </p>
      </PolicySection>

      <PolicySection
        number={26}
        title="Hak kekayaan intelektual"
      >
        <p className="leading-8 text-slate-600">
          Logo, nama, teks, desain, ilustrasi,
          tampilan, kode perangkat lunak, dan konten
          asli Nusa Gili Boat dilindungi sesuai
          ketentuan hak kekayaan intelektual yang
          berlaku.
        </p>

        <p className="leading-8 text-slate-600">
          Konten milik operator, fotografer, penyedia
          layanan, atau pihak lain tetap menjadi hak
          pemiliknya masing-masing.
        </p>

        <p className="leading-8 text-slate-600">
          Pengguna tidak diperbolehkan menyalin,
          menjual, memodifikasi, atau menggunakan
          konten secara komersial tanpa izin.
        </p>
      </PolicySection>

      <PolicySection
        number={27}
        title="Perilaku pengguna"
      >
        <p className="leading-8 text-slate-600">
          Pengguna dilarang:
        </p>

        <BulletList
          items={[
            "Mengirimkan data atau booking palsu.",
            "Melakukan transaksi yang menipu atau tidak sah.",
            "Mengakses sistem tanpa izin.",
            "Mengganggu keamanan atau operasional situs.",
            "Menggunakan program berbahaya atau otomatisasi yang merugikan layanan.",
            "Menggunakan situs untuk kegiatan yang melanggar hukum.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Kami dapat menolak booking, membatasi akses,
          menahan transaksi untuk pemeriksaan, atau
          melaporkan aktivitas yang diduga melanggar
          hukum kepada pihak terkait.
        </p>
      </PolicySection>

      <PolicySection
        number={28}
        title="Perlindungan data pribadi"
      >
        <p className="leading-8 text-slate-600">
          Data pelanggan dan penumpang akan diproses
          untuk menyediakan booking, pembayaran,
          pelayanan pelanggan, komunikasi perjalanan,
          penerbitan e-ticket, pencegahan penipuan, dan
          pemenuhan kewajiban hukum.
        </p>

        <p className="leading-8 text-slate-600">
          Informasi lebih lengkap mengenai data yang
          dikumpulkan, tujuan penggunaan, pembagian
          data, penyimpanan, keamanan, dan hak pengguna
          tersedia dalam Kebijakan Privasi.
        </p>

        <Link
          href="/privacy-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Baca Kebijakan Privasi
        </Link>
      </PolicySection>

      <PolicySection
        number={29}
        title="Refund"
      >
        <p className="leading-8 text-slate-600">
          Kelayakan dan jumlah refund bergantung pada
          alasan pembatalan, waktu pengajuan, status
          pembayaran, perjalanan yang terdampak,
          kebijakan operator, dan ketentuan tarif.
        </p>

        <p className="leading-8 text-slate-600">
          Waktu penyelesaian refund dapat berbeda
          bergantung pada verifikasi operator, payment
          gateway, bank, dompet elektronik, dan metode
          pembayaran.
        </p>

        <Link
          href="/refund-and-cancellation-policy"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Baca Kebijakan Refund dan Pembatalan
        </Link>
      </PolicySection>

      <PolicySection
        number={30}
        title="Keluhan dan penyelesaian sengketa"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan dapat menyampaikan keluhan melalui
          saluran kontak resmi dengan menyertakan kode
          booking, email pemesan, kronologi, dan bukti
          pendukung.
        </p>

        <p className="leading-8 text-slate-600">
          Kami akan berupaya menyelesaikan perselisihan
          terlebih dahulu melalui komunikasi dan
          musyawarah dengan pelanggan serta operator
          terkait.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila tidak dapat diselesaikan melalui
          musyawarah, para pihak dapat menggunakan
          mekanisme penyelesaian sengketa yang tersedia
          berdasarkan hukum Republik Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={31}
        title="Hukum dan bahasa yang berlaku"
      >
        <p className="leading-8 text-slate-600">
          Syarat dan Ketentuan ini diatur dan
          ditafsirkan berdasarkan hukum Republik
          Indonesia.
        </p>

        <p className="leading-8 text-slate-600">
          Dokumen ini dibuat dalam Bahasa Indonesia.
          Terjemahan bahasa Inggris atau bahasa lain
          dapat disediakan untuk membantu pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila terdapat perbedaan penafsiran, versi
          Bahasa Indonesia menjadi acuan sejauh
          diperbolehkan oleh hukum.
        </p>
      </PolicySection>

      <PolicySection
        number={32}
        title="Perubahan Syarat dan Ketentuan"
      >
        <p className="leading-8 text-slate-600">
          Kami dapat memperbarui Syarat dan Ketentuan
          ini untuk menyesuaikan perubahan layanan,
          teknologi, operator, metode pembayaran, atau
          ketentuan hukum.
        </p>

        <p className="leading-8 text-slate-600">
          Versi terbaru dan tanggal pembaruannya akan
          diterbitkan pada halaman ini.
        </p>

        <p className="leading-8 text-slate-600">
          Kecuali diperlukan oleh hukum, keamanan, atau
          keadaan tertentu, hak dan kewajiban booking
          yang telah dibuat akan mengacu pada ketentuan
          yang berlaku ketika booking dilakukan.
        </p>
      </PolicySection>

      <PolicySection
        number={33}
        title="Hubungi kami"
      >
        <p className="leading-8 text-slate-600">
          Pertanyaan mengenai Syarat dan Ketentuan,
          booking, pembayaran, e-ticket, perubahan
          perjalanan, atau keluhan dapat disampaikan
          melalui halaman kontak.
        </p>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Hubungi Nusa Gili Boat
        </Link>
      </PolicySection>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Informasi usaha sedang dilengkapi
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Nama resmi pemilik usaha, alamat operasional,
          nomor layanan pelanggan, jam operasional,
          metode pembayaran final, dan ketentuan khusus
          masing-masing operator akan diperbarui sebelum
          pembayaran production diaktifkan.
        </p>
      </aside>
    </PublicInfoPage>
  )
}
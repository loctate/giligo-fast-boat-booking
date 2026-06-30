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
    "Kebijakan Privasi | Nusa Gili Boat",
  description:
    "Kebijakan Privasi Nusa Gili Boat menjelaskan pengumpulan, penggunaan, penyimpanan, pembagian, dan perlindungan data pribadi pelanggan serta penumpang.",
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

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Pelindungan Data Pribadi"
      title="Kebijakan Privasi"
      description="Kebijakan Privasi ini menjelaskan bagaimana Nusa Gili Boat memperoleh, mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi ketika Anda menggunakan situs dan layanan pemesanan kami."
      lastUpdated="30 Juni 2026"
    >
      <PolicySection
        number={1}
        title="Pendahuluan"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat menghargai privasi pelanggan,
          penumpang, dan setiap pengguna situs kami.
          Kami berkomitmen memproses data pribadi
          secara bertanggung jawab, transparan, aman,
          dan sesuai dengan ketentuan hukum yang
          berlaku.
        </p>

        <p className="leading-8 text-slate-600">
          Kebijakan Privasi ini berlaku ketika Anda
          mengunjungi situs, mencari perjalanan,
          membuat booking, melakukan pembayaran,
          memeriksa booking, menghubungi layanan
          pelanggan, atau menggunakan layanan lain
          yang disediakan Nusa Gili Boat.
        </p>

        <p className="leading-8 text-slate-600">
          Dengan menggunakan layanan kami, Anda
          mengakui telah menerima dan membaca Kebijakan
          Privasi ini. Apabila persetujuan diperlukan
          untuk suatu pemrosesan tertentu, kami akan
          meminta persetujuan tersebut secara terpisah
          sesuai kebutuhan.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="Pihak yang mengendalikan data"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bertindak sebagai pihak yang
          menentukan tujuan dan cara pemrosesan data
          pribadi yang dilakukan dalam pengoperasian
          situs dan layanan pemesanan kami.
        </p>

        <p className="leading-8 text-slate-600">
          Dalam pelaksanaan perjalanan dan pembayaran,
          operator fast boat serta penyedia pembayaran
          dapat bertindak sebagai pengendali atau
          pemroses data sesuai peran, layanan, dan
          kebijakan masing-masing.
        </p>

        <p className="leading-8 text-slate-600">
          Pertanyaan atau permintaan terkait data
          pribadi dapat disampaikan melalui informasi
          kontak yang tercantum pada bagian akhir
          Kebijakan Privasi ini.
        </p>
      </PolicySection>

      <PolicySection
        number={3}
        title="Data pribadi yang kami kumpulkan"
      >
        <p className="leading-8 text-slate-600">
          Jenis data yang dikumpulkan bergantung pada
          cara Anda menggunakan layanan kami. Data
          tersebut dapat mencakup:
        </p>

        <h3 className="text-lg font-semibold text-slate-950">
          A. Informasi pelanggan
        </h3>

        <BulletList
          items={[
            "Nama lengkap.",
            "Alamat email.",
            "Nomor telepon atau WhatsApp.",
            "Kewarganegaraan apabila diperlukan.",
            "Informasi kontak lain yang diberikan secara sukarela.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          B. Informasi penumpang
        </h3>

        <BulletList
          items={[
            "Nama penumpang.",
            "Kategori penumpang, seperti dewasa, anak, atau bayi.",
            "Jumlah penumpang.",
            "Kewarganegaraan atau data identitas apabila diperlukan operator.",
            "Informasi kebutuhan bantuan khusus yang diberikan secara sukarela.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          C. Informasi booking dan perjalanan
        </h3>

        <BulletList
          items={[
            "Kode booking.",
            "Rute dan tanggal perjalanan.",
            "Pelabuhan keberangkatan dan tujuan.",
            "Jadwal keberangkatan dan kedatangan.",
            "Operator dan kapal yang dipilih.",
            "Perjalanan satu arah atau pulang-pergi.",
            "Jumlah kursi dan harga perjalanan.",
            "Status booking, perubahan, pembatalan, dan refund.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          D. Informasi pembayaran
        </h3>

        <BulletList
          items={[
            "Nomor referensi atau ID transaksi.",
            "Order ID dari penyedia pembayaran.",
            "Jumlah transaksi.",
            "Metode pembayaran.",
            "Status pembayaran.",
            "Waktu transaksi.",
            "Informasi refund atau pembatalan pembayaran.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          E. Informasi teknis
        </h3>

        <BulletList
          items={[
            "Alamat IP.",
            "Jenis dan versi browser.",
            "Sistem operasi.",
            "Jenis perangkat.",
            "Tanggal dan waktu akses.",
            "Halaman yang dikunjungi.",
            "Situs atau halaman rujukan.",
            "Data log, kesalahan sistem, dan aktivitas keamanan.",
            "Cookie, session storage, dan teknologi serupa.",
          ]}
        />

        <h3 className="text-lg font-semibold text-slate-950">
          F. Komunikasi dan dukungan pelanggan
        </h3>

        <BulletList
          items={[
            "Pesan email dan WhatsApp.",
            "Permintaan perubahan atau pembatalan.",
            "Keluhan serta kronologi kejadian.",
            "Dokumen atau bukti yang diberikan untuk menangani permintaan.",
            "Pilihan pelanggan terkait komunikasi pemasaran.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Kami meminta agar Anda tidak mengirimkan PIN,
          CVV, kata sandi perbankan, kode OTP, atau data
          finansial rahasia lainnya melalui email,
          WhatsApp, maupun formulir layanan pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="Sumber data pribadi"
      >
        <p className="leading-8 text-slate-600">
          Data pribadi dapat kami peroleh:
        </p>

        <BulletList
          items={[
            "Secara langsung dari pelanggan ketika mencari perjalanan, membuat booking, atau menghubungi kami.",
            "Dari orang yang membuat booking atas nama penumpang lain.",
            "Dari operator fast boat yang menangani perjalanan.",
            "Dari payment gateway, bank, atau penyedia metode pembayaran.",
            "Dari sistem teknis, log server, cookie, dan alat keamanan.",
            "Dari penyedia layanan yang membantu operasional situs dan booking.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Pelanggan yang memberikan data penumpang lain
          harus memastikan bahwa data tersebut diberikan
          untuk tujuan perjalanan yang sah dan bahwa
          penumpang telah diberi informasi yang
          diperlukan mengenai pemrosesan datanya.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Tujuan penggunaan data"
      >
        <p className="leading-8 text-slate-600">
          Kami dapat menggunakan data pribadi untuk:
        </p>

        <BulletList
          items={[
            "Menampilkan dan memproses pilihan perjalanan.",
            "Membuat, mengelola, dan mengonfirmasi booking.",
            "Mengalokasikan kursi pada perjalanan yang dipilih.",
            "Menyampaikan data yang diperlukan kepada operator fast boat.",
            "Memproses serta memverifikasi pembayaran.",
            "Menerbitkan dan mengirim konfirmasi booking.",
            "Menerbitkan serta mengirim e-ticket ketika fitur tersebut tersedia.",
            "Memberikan informasi check-in dan keberangkatan.",
            "Menyampaikan perubahan jadwal, keterlambatan, atau pembatalan.",
            "Memproses perubahan booking, pengaduan, dan refund.",
            "Memberikan dukungan pelanggan.",
            "Mendeteksi dan mencegah penipuan atau penyalahgunaan.",
            "Menjaga keamanan situs, server, database, dan transaksi.",
            "Menganalisis serta meningkatkan kinerja situs dan pengalaman pengguna.",
            "Memenuhi kewajiban akuntansi, perpajakan, hukum, dan regulator.",
            "Menangani klaim, sengketa, audit, atau pemeriksaan.",
            "Mengirim komunikasi pemasaran apabila pelanggan telah memilih untuk menerimanya.",
          ]}
        />
      </PolicySection>

      <PolicySection
        number={6}
        title="Dasar pemrosesan data"
      >
        <p className="leading-8 text-slate-600">
          Bergantung pada konteksnya, pemrosesan data
          pribadi dapat dilakukan berdasarkan:
        </p>

        <BulletList
          items={[
            "Pelaksanaan perjanjian atau tindakan yang diminta pelanggan untuk membuat dan menjalankan booking.",
            "Persetujuan pelanggan untuk pemrosesan tertentu, seperti komunikasi pemasaran.",
            "Pemenuhan kewajiban hukum dan peraturan.",
            "Pelindungan kepentingan vital pelanggan atau penumpang dalam keadaan tertentu.",
            "Kepentingan yang sah untuk keamanan, pencegahan penipuan, pengelolaan layanan, dan peningkatan sistem, sepanjang tidak mengesampingkan hak pengguna.",
            "Dasar pemrosesan lain yang diperbolehkan peraturan perundang-undangan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Apabila pemrosesan didasarkan pada
          persetujuan, pengguna dapat menarik
          persetujuannya sesuai ketentuan hukum.
          Penarikan persetujuan tidak memengaruhi
          keabsahan pemrosesan yang telah dilakukan
          sebelumnya.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Pembagian data dengan operator fast boat"
      >
        <p className="leading-8 text-slate-600">
          Kami dapat memberikan data yang diperlukan
          kepada operator yang menyediakan perjalanan
          yang dipilih pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Data tersebut dapat mencakup:
        </p>

        <BulletList
          items={[
            "Nama pelanggan dan penumpang.",
            "Nomor kontak.",
            "Kode atau referensi booking.",
            "Jumlah dan kategori penumpang.",
            "Rute, jadwal, dan tanggal perjalanan.",
            "Informasi yang diperlukan untuk check-in dan boarding.",
            "Informasi kebutuhan khusus yang relevan dan telah diberikan pelanggan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Operator dapat memproses data tersebut sesuai
          kebutuhan transportasi, keselamatan,
          manifest penumpang, check-in, dan kewajiban
          hukum yang berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="Pemrosesan pembayaran"
      >
        <p className="leading-8 text-slate-600">
          Pembayaran online dapat diproses melalui
          Midtrans atau penyedia pembayaran lain yang
          ditampilkan pada halaman pembayaran.
        </p>

        <p className="leading-8 text-slate-600">
          Penyedia pembayaran dapat mengumpulkan dan
          memproses data yang dibutuhkan untuk
          memverifikasi, mengotorisasi, menyelesaikan,
          membatalkan, atau mengembalikan transaksi.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat dapat menerima informasi
          transaksi seperti order ID, ID transaksi,
          metode pembayaran, jumlah pembayaran, status
          transaksi, waktu pembayaran, dan status
          refund.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat tidak bermaksud menyimpan
          nomor kartu pembayaran secara lengkap, CVV,
          PIN, kata sandi perbankan, maupun kode OTP.
          Informasi sensitif tersebut diproses melalui
          sistem penyedia pembayaran terkait.
        </p>

        <a
          href="https://midtrans.com/id/pemberitahuan-privasi"
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Baca Pemberitahuan Privasi Midtrans
        </a>
      </PolicySection>

      <PolicySection
        number={9}
        title="Pihak lain yang dapat menerima data"
      >
        <p className="leading-8 text-slate-600">
          Sepanjang diperlukan untuk menjalankan
          layanan, kami dapat membagikan data kepada:
        </p>

        <BulletList
          items={[
            "Penyedia hosting, server, cloud, database, dan penyimpanan data.",
            "Penyedia email, notifikasi, dan komunikasi pelanggan.",
            "Penyedia layanan keamanan, pemantauan, dan pencegahan penipuan.",
            "Penyedia analytics dan pengukuran kinerja situs.",
            "Penyedia layanan akuntansi, audit, pajak, atau bantuan profesional.",
            "Bank, payment gateway, dan penyedia jasa pembayaran.",
            "Instansi pemerintah, regulator, pengadilan, atau aparat penegak hukum apabila diwajibkan.",
            "Pihak lain berdasarkan instruksi atau persetujuan pengguna.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Kami hanya berupaya memberikan data yang
          relevan dan diperlukan untuk tujuan layanan
          pihak tersebut.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Penjualan data pribadi"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat tidak menjual atau menyewakan
          data pribadi pelanggan sebagai basis data
          komersial kepada pihak lain.
        </p>

        <p className="leading-8 text-slate-600">
          Pembagian data kepada operator, penyedia
          pembayaran, dan penyedia teknis dilakukan
          untuk menjalankan layanan atau memenuhi
          kewajiban yang sah, bukan untuk menjual data
          pribadi.
        </p>
      </PolicySection>

      <PolicySection
        number={11}
        title="Cookie dan penyimpanan browser"
      >
        <p className="leading-8 text-slate-600">
          Situs kami dapat menggunakan cookie, session
          storage, local storage, dan teknologi serupa
          untuk:
        </p>

        <BulletList
          items={[
            "Menjaga fungsi navigasi dan sesi pengguna.",
            "Menyimpan informasi booking sementara.",
            "Membantu pelanggan membuka halaman konfirmasi.",
            "Menjaga keamanan dan mencegah penyalahgunaan.",
            "Mengingat pilihan atau preferensi tertentu.",
            "Mengukur kinerja dan penggunaan situs.",
            "Mendeteksi serta memperbaiki kesalahan teknis.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Pengguna dapat menghapus atau membatasi
          cookie melalui pengaturan browser. Beberapa
          fungsi situs mungkin tidak bekerja secara
          optimal apabila teknologi tersebut
          dinonaktifkan.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Analytics dan komunikasi pemasaran"
      >
        <p className="leading-8 text-slate-600">
          Kami dapat menggunakan informasi penggunaan
          situs untuk memahami performa halaman,
          memperbaiki proses booking, dan meningkatkan
          pengalaman pengguna.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila alat analytics pihak ketiga
          digunakan, informasinya akan diperbarui dalam
          Kebijakan Privasi atau pemberitahuan cookie
          yang relevan.
        </p>

        <p className="leading-8 text-slate-600">
          Komunikasi promosi, penawaran tiket,
          informasi destinasi, dan newsletter hanya
          akan dikirim berdasarkan pilihan atau
          persetujuan pelanggan apabila diperlukan.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan dapat berhenti menerima komunikasi
          promosi melalui tautan berhenti berlangganan
          atau dengan menghubungi kami. Pesan penting
          mengenai booking dan perjalanan tetap dapat
          dikirim karena diperlukan untuk menjalankan
          layanan.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Keakuratan data"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan bertanggung jawab memberikan data
          yang benar, lengkap, dan terkini.
        </p>

        <p className="leading-8 text-slate-600">
          Informasi yang salah dapat menyebabkan
          kegagalan komunikasi, kesalahan e-ticket,
          kendala check-in, penolakan boarding, atau
          masalah dalam proses refund.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan harus segera menghubungi kami
          apabila terdapat kesalahan pada data booking
          atau penumpang.
        </p>
      </PolicySection>

      <PolicySection
        number={14}
        title="Penyimpanan dan masa retensi"
      >
        <p className="leading-8 text-slate-600">
          Data dapat disimpan dalam sistem booking,
          database, server, backup, sistem pembayaran,
          email, serta catatan dukungan pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Kami menyimpan data hanya selama diperlukan
          untuk:
        </p>

        <BulletList
          items={[
            "Menjalankan dan membuktikan transaksi booking.",
            "Memberikan dukungan pelanggan.",
            "Menangani perubahan, refund, klaim, dan sengketa.",
            "Mencegah penipuan dan menjaga keamanan.",
            "Memenuhi kewajiban akuntansi, audit, pajak, dan hukum.",
            "Menjaga backup dan keberlangsungan layanan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Masa penyimpanan dapat berbeda berdasarkan
          jenis data, tujuan pemrosesan, hubungan dengan
          pelanggan, dan kewajiban hukum.
        </p>

        <p className="leading-8 text-slate-600">
          Data yang tidak lagi diperlukan akan dihapus,
          dimusnahkan, dianonimkan, atau dibatasi
          pemrosesannya sesuai kebijakan serta ketentuan
          yang berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Keamanan data"
      >
        <p className="leading-8 text-slate-600">
          Kami menerapkan langkah administratif,
          teknis, dan organisasional yang wajar untuk
          melindungi data dari:
        </p>

        <BulletList
          items={[
            "Akses tanpa izin.",
            "Penggunaan atau pengungkapan yang tidak sah.",
            "Perubahan data yang tidak semestinya.",
            "Kehilangan atau kerusakan data.",
            "Penghancuran data.",
            "Serangan, penipuan, dan penyalahgunaan sistem.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Perlindungan dapat mencakup koneksi
          terenkripsi, pembatasan akses server,
          autentikasi, firewall, pemantauan keamanan,
          pencadangan, pembaruan sistem, serta
          pencatatan aktivitas.
        </p>

        <p className="leading-8 text-slate-600">
          Tidak ada metode pengiriman atau penyimpanan
          elektronik yang dapat dijamin sepenuhnya
          bebas risiko. Kami akan terus menyesuaikan
          perlindungan berdasarkan kebutuhan dan risiko
          layanan.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Kegagalan pelindungan data"
      >
        <p className="leading-8 text-slate-600">
          Apabila terjadi insiden yang mengakibatkan
          kerusakan, kehilangan, perubahan,
          pengungkapan, atau akses tidak sah terhadap
          data pribadi, kami akan melakukan
          pemeriksaan, penanganan, pemulihan, dan
          mitigasi risiko.
        </p>

        <p className="leading-8 text-slate-600">
          Kami akan memberikan pemberitahuan kepada
          pihak yang terdampak dan otoritas terkait
          dalam bentuk serta tenggat waktu yang
          diwajibkan oleh peraturan perundang-undangan.
        </p>

        <p className="leading-8 text-slate-600">
          Pemberitahuan dapat memuat jenis data yang
          terdampak, waktu dan penyebab insiden yang
          diketahui, dampak potensial, serta tindakan
          penanganan dan pemulihan.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Pemrosesan dan transfer lintas wilayah"
      >
        <p className="leading-8 text-slate-600">
          Sebagian penyedia layanan teknologi dapat
          menggunakan infrastruktur atau personel yang
          berada di luar lokasi pengguna atau di luar
          wilayah Indonesia.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila data perlu ditransfer ke luar wilayah
          Indonesia, kami akan memperhatikan persyaratan
          pelindungan data yang berlaku, termasuk
          tingkat pelindungan, pengamanan yang mengikat,
          atau persetujuan ketika diperlukan.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Data anak"
      >
        <p className="leading-8 text-slate-600">
          Pihak yang membuat booking harus berusia
          sekurang-kurangnya 18 tahun.
        </p>

        <p className="leading-8 text-slate-600">
          Data anak atau bayi dapat diproses sebagai
          data penumpang apabila booking dilakukan oleh
          orang tua, wali, atau orang dewasa yang
          bertanggung jawab.
        </p>

        <p className="leading-8 text-slate-600">
          Pihak yang memberikan data anak menyatakan
          memiliki kewenangan yang diperlukan untuk
          memberikan data tersebut bagi tujuan booking
          dan perjalanan.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila kami mengetahui data anak telah
          diberikan tanpa kewenangan yang sesuai, kami
          dapat mengambil langkah untuk membatasi atau
          menghapusnya, sejauh tidak bertentangan
          dengan kewajiban hukum dan booking yang sah.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="Hak pengguna atas data pribadi"
      >
        <p className="leading-8 text-slate-600">
          Sesuai ketentuan hukum dan setelah verifikasi
          identitas, pengguna dapat memiliki hak untuk:
        </p>

        <BulletList
          items={[
            "Memperoleh informasi mengenai tujuan dan dasar pemrosesan data.",
            "Memperoleh akses dan salinan data pribadi.",
            "Melengkapi, memperbarui, atau memperbaiki data yang tidak akurat.",
            "Menarik persetujuan apabila pemrosesan didasarkan pada persetujuan.",
            "Meminta penghentian, penghapusan, atau pemusnahan data dalam kondisi yang diperbolehkan.",
            "Meminta penundaan atau pembatasan pemrosesan dalam kondisi tertentu.",
            "Mengajukan keberatan atas keputusan yang hanya didasarkan pada pemrosesan otomatis dan menimbulkan akibat hukum atau dampak signifikan.",
            "Memperoleh atau memindahkan data dalam format yang sesuai apabila berlaku.",
            "Mengajukan keluhan dan meminta ganti rugi sesuai mekanisme hukum yang berlaku.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Hak tertentu dapat dibatasi apabila data
          masih diperlukan untuk menjalankan booking,
          memenuhi kewajiban hukum, mencegah penipuan,
          menyelesaikan sengketa, atau melindungi hak
          pihak lain.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="Cara menggunakan hak data pribadi"
      >
        <p className="leading-8 text-slate-600">
          Permintaan terkait data dapat disampaikan
          melalui email atau halaman kontak Nusa Gili
          Boat.
        </p>

        <p className="leading-8 text-slate-600">
          Permintaan sebaiknya mencantumkan:
        </p>

        <BulletList
          items={[
            "Nama lengkap.",
            "Email atau nomor kontak yang digunakan ketika booking.",
            "Kode booking apabila berkaitan dengan transaksi.",
            "Jenis permintaan yang diajukan.",
            "Informasi pendukung yang diperlukan untuk verifikasi.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Kami dapat meminta verifikasi identitas untuk
          mencegah data diberikan, diubah, atau dihapus
          atas permintaan pihak yang tidak berwenang.
        </p>

        <p className="leading-8 text-slate-600">
          Kami akan menangani permintaan sesuai
          ketentuan dan tenggat waktu yang diwajibkan
          peraturan perundang-undangan.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Keputusan otomatis dan pencegahan penipuan"
      >
        <p className="leading-8 text-slate-600">
          Sistem dapat melakukan pemeriksaan otomatis
          terhadap ketersediaan kursi, validitas input,
          status pembayaran, dan aktivitas yang
          mencurigakan.
        </p>

        <p className="leading-8 text-slate-600">
          Penyedia pembayaran juga dapat menggunakan
          sistem otomatis untuk menilai risiko,
          mengotorisasi transaksi, dan mencegah
          penipuan berdasarkan kebijakan mereka.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila suatu keputusan otomatis menimbulkan
          dampak signifikan terhadap pengguna, pengguna
          dapat menghubungi kami untuk meminta
          penjelasan atau peninjauan, sejauh hak
          tersebut berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Tautan dan layanan pihak ketiga"
      >
        <p className="leading-8 text-slate-600">
          Situs kami dapat memuat tautan ke operator,
          penyedia pembayaran, peta, media sosial, atau
          situs pihak ketiga lainnya.
        </p>

        <p className="leading-8 text-slate-600">
          Pemrosesan data pada situs pihak ketiga
          tunduk pada kebijakan privasi mereka.
          Nusa Gili Boat tidak mengendalikan seluruh
          praktik privasi pihak yang independen
          tersebut.
        </p>

        <p className="leading-8 text-slate-600">
          Pengguna disarankan membaca pemberitahuan
          privasi pihak ketiga sebelum memberikan data.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Perubahan Kebijakan Privasi"
      >
        <p className="leading-8 text-slate-600">
          Kami dapat memperbarui Kebijakan Privasi ini
          untuk menyesuaikan perubahan layanan,
          teknologi, penyedia pembayaran, proses
          bisnis, atau peraturan.
        </p>

        <p className="leading-8 text-slate-600">
          Versi terbaru akan diterbitkan pada halaman
          ini bersama tanggal pembaruan.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila perubahan berdampak material terhadap
          cara kami memproses data, kami akan berupaya
          memberikan pemberitahuan tambahan yang
          sesuai.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Hukum dan bahasa yang berlaku"
      >
        <p className="leading-8 text-slate-600">
          Kebijakan Privasi ini diatur dan ditafsirkan
          berdasarkan hukum Republik Indonesia,
          termasuk ketentuan mengenai pelindungan data
          pribadi dan sistem elektronik.
        </p>

        <p className="leading-8 text-slate-600">
          Kebijakan ini dibuat dalam Bahasa Indonesia.
          Terjemahan dalam bahasa lain dapat disediakan
          untuk membantu pengguna.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila terdapat perbedaan penafsiran, versi
          Bahasa Indonesia menjadi acuan sejauh
          diperbolehkan oleh hukum.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Hubungi kami"
      >
        <p className="leading-8 text-slate-600">
          Pertanyaan, keluhan, serta permintaan terkait
          data pribadi dapat disampaikan melalui:
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <dl className="space-y-4 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-950">
                Nama layanan
              </dt>

              <dd className="mt-1">
                Nusa Gili Boat
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-950">
                Email
              </dt>

              <dd className="mt-1">
                <a
                  href="mailto:nusagiliboat@gmail.com"
                  className="font-semibold text-sky-700 transition hover:text-sky-900"
                >
                  nusagiliboat@gmail.com
                </a>
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-950">
                Situs
              </dt>

              <dd className="mt-1">
                https://www.nusagiliboat.com
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-950">
                Jam layanan
              </dt>

              <dd className="mt-1">
                Setiap hari, pukul 08.00–20.00 WITA
              </dd>
            </div>
          </dl>
        </div>

        <Link
          href="/contact"
          className="inline-flex font-semibold text-sky-700 transition hover:text-sky-900"
        >
          Buka halaman kontak
        </Link>
      </PolicySection>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">
          Informasi identitas usaha akan dilengkapi
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Nama resmi pemilik usaha, alamat operasional,
          informasi pengendali data, daftar penyedia
          analytics, dan jadwal retensi data yang lebih
          terperinci akan diperbarui sebelum pembayaran
          production diaktifkan.
        </p>
      </aside>
    </PublicInfoPage>
  )
}
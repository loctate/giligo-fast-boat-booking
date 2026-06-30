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
    "Kebijakan Refund dan Pembatalan | Nusa Gili Boat",
  description:
    "Kebijakan pembatalan, perubahan booking, no-show, pembatalan operator, dan pengembalian dana untuk tiket fast boat yang dipesan melalui Nusa Gili Boat.",
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

export default function RefundAndCancellationPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Informasi Booking"
      title="Kebijakan Refund dan Pembatalan"
      description="Kebijakan ini menjelaskan ketentuan pembatalan, perubahan perjalanan, no-show, pembatalan oleh operator, dan pengembalian dana untuk booking yang dibuat melalui Nusa Gili Boat."
      lastUpdated="30 Juni 2026"
    >
      <PolicySection
        number={1}
        title="Persetujuan terhadap kebijakan"
      >
        <p className="leading-8 text-slate-600">
          Dengan membuat booking atau melakukan
          pembayaran melalui Nusa Gili Boat, pelanggan
          dianggap telah membaca dan memahami Kebijakan
          Refund dan Pembatalan ini.
        </p>

        <p className="leading-8 text-slate-600">
          Kebijakan ini merupakan bagian dari Syarat dan
          Ketentuan Nusa Gili Boat dan harus dibaca
          bersama informasi perjalanan, ketentuan tarif,
          serta kebijakan operator yang ditampilkan
          sebelum pembayaran.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila booking dibuat untuk penumpang lain,
          pihak yang membuat booking bertanggung jawab
          menyampaikan kebijakan ini kepada seluruh
          penumpang dalam reservasi tersebut.
        </p>
      </PolicySection>

      <PolicySection
        number={2}
        title="Peran Nusa Gili Boat"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat adalah platform pemesanan
          online yang membantu pelanggan mencari dan
          memesan tiket fast boat dari operator yang
          tersedia pada sistem kami.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bukan pemilik atau operator
          kapal. Pengoperasian kapal, awak kapal,
          keselamatan pelayaran, jadwal, keputusan
          keberangkatan, serta pelayanan transportasi
          dilaksanakan oleh operator terkait.
        </p>

        <p className="leading-8 text-slate-600">
          Kami membantu menerima permintaan pelanggan,
          memeriksa data booking, berkomunikasi dengan
          operator, memproses perubahan yang disetujui,
          dan memfasilitasi refund sesuai ketentuan yang
          berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={3}
        title="Kebijakan operator dan ketentuan tarif"
      >
        <p className="leading-8 text-slate-600">
          Setiap operator atau jenis tarif dapat
          memiliki ketentuan pembatalan, perubahan,
          no-show, dan refund yang berbeda.
        </p>

        <p className="leading-8 text-slate-600">
          Ketentuan khusus operator atau tarif yang
          ditampilkan sebelum pembayaran menjadi bagian
          dari booking pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila ketentuan khusus operator tidak
          tersedia, permintaan akan ditangani berdasarkan
          kebijakan umum pada halaman ini, kondisi
          booking, dan hasil konfirmasi dengan operator.
        </p>

        <p className="leading-8 text-slate-600">
          Kebijakan operator tidak dimaksudkan untuk
          menghapus hak konsumen yang tidak dapat
          dikesampingkan berdasarkan hukum Republik
          Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={4}
        title="Pembatalan oleh pelanggan"
      >
        <p className="leading-8 text-slate-600">
          Permintaan pembatalan harus disampaikan
          melalui saluran layanan pelanggan resmi
          sebelum waktu keberangkatan.
        </p>

        <p className="leading-8 text-slate-600">
          Waktu pengajuan dihitung berdasarkan waktu
          ketika permintaan lengkap diterima oleh Nusa
          Gili Boat, bukan ketika pelanggan mulai
          menulis atau mengirim pesan yang belum
          memuat informasi booking secara lengkap.
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">
                    Waktu permintaan
                  </th>

                  <th className="px-5 py-4 text-sm font-semibold">
                    Ketentuan umum
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    Lebih dari 72 jam sebelum
                    keberangkatan
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    Booking dapat memenuhi syarat untuk
                    refund setelah memperhitungkan
                    ketentuan operator, kondisi tarif,
                    dan biaya yang benar-benar tidak
                    dapat dikembalikan.
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    Antara 24 sampai 72 jam sebelum
                    keberangkatan
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    Refund penuh, refund sebagian, kredit
                    perjalanan, atau penolakan refund
                    dapat berlaku berdasarkan kebijakan
                    operator dan jenis tarif.
                  </td>
                </tr>

                <tr className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-950">
                    Kurang dari 24 jam sebelum
                    keberangkatan
                  </td>

                  <td className="px-5 py-4 leading-7 text-slate-600">
                    Booking pada umumnya tidak dapat
                    direfund, kecuali operator
                    menyetujui penyelesaian lain atau
                    terdapat ketentuan hukum yang
                    mewajibkan penyelesaian berbeda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm leading-7 text-slate-500">
          Tabel tersebut merupakan kebijakan umum.
          Ketentuan khusus yang ditampilkan pada detail
          perjalanan atau checkout dapat berbeda.
        </p>
      </PolicySection>

      <PolicySection
        number={5}
        title="Tiket promo dan harga khusus"
      >
        <p className="leading-8 text-slate-600">
          Tiket yang dibeli melalui promo, voucher,
          flash sale, potongan harga, kampanye khusus,
          atau harga terbatas dapat memiliki ketentuan
          khusus.
        </p>

        <p className="leading-8 text-slate-600">
          Berdasarkan ketentuan yang ditampilkan,
          tiket tersebut dapat:
        </p>

        <BulletList
          items={[
            "Tidak dapat dibatalkan.",
            "Tidak dapat direfund.",
            "Tidak dapat diubah.",
            "Tidak dapat dialihkan kepada penumpang lain.",
            "Memiliki masa berlaku atau jadwal penggunaan tertentu.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Ketentuan promo atau harga khusus akan
          diinformasikan sebelum pembayaran apabila
          berlaku pada booking pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={6}
        title="Tidak hadir atau no-show"
      >
        <p className="leading-8 text-slate-600">
          Penumpang dapat dianggap no-show apabila:
        </p>

        <BulletList
          items={[
            "Tidak hadir sebelum batas waktu check-in.",
            "Datang setelah check-in atau boarding ditutup.",
            "Tidak berada di titik keberangkatan yang ditentukan.",
            "Tidak membawa identitas atau dokumen perjalanan yang diwajibkan.",
            "Tidak memenuhi persyaratan perjalanan yang berlaku.",
            "Tidak dapat mengikuti perjalanan karena kesalahan atau keputusan pribadi.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Booking dengan status no-show pada umumnya
          tidak dapat direfund, dijadwalkan ulang, atau
          diubah menjadi kredit perjalanan, kecuali
          operator secara khusus menyetujui
          penyelesaian lain.
        </p>
      </PolicySection>

      <PolicySection
        number={7}
        title="Perubahan booking"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan dapat meminta perubahan terhadap:
        </p>

        <BulletList
          items={[
            "Tanggal perjalanan.",
            "Jam atau jadwal keberangkatan.",
            "Rute atau pelabuhan.",
            "Nama dan data penumpang.",
            "Operator atau kapal.",
            "Jumlah penumpang.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Semua permintaan perubahan bergantung pada
          ketersediaan kursi, kebijakan operator, jenis
          tarif, waktu pengajuan, dan persetujuan pihak
          terkait.
        </p>

        <p className="leading-8 text-slate-600">
          Selisih harga, biaya perubahan, biaya
          administrasi, atau penalti operator dapat
          berlaku. Besar biaya akan disampaikan sebelum
          perubahan diproses apabila informasinya telah
          tersedia.
        </p>

        <p className="leading-8 text-slate-600">
          Perubahan belum dianggap berhasil sampai
          pelanggan menerima konfirmasi perubahan dari
          Nusa Gili Boat.
        </p>
      </PolicySection>

      <PolicySection
        number={8}
        title="Booking satu arah dan pulang-pergi"
      >
        <p className="leading-8 text-slate-600">
          Booking satu arah terdiri dari satu perjalanan
          atau satu leg.
        </p>

        <p className="leading-8 text-slate-600">
          Booking pulang-pergi terdiri dari perjalanan
          keberangkatan dan perjalanan kembali yang
          diperlakukan sebagai dua leg terpisah.
        </p>

        <p className="leading-8 text-slate-600">
          Setiap leg dapat memiliki operator, kapal,
          jadwal, harga, ketentuan perubahan, dan
          kebijakan pembatalan yang berbeda.
        </p>

        <p className="leading-8 text-slate-600">
          Pembatalan atau perubahan pada satu leg tidak
          otomatis membatalkan atau mengubah leg
          lainnya.
        </p>

        <p className="leading-8 text-slate-600">
          Refund sebagian untuk booking pulang-pergi
          dihitung berdasarkan nilai leg yang memenuhi
          syarat untuk direfund, bukan berdasarkan
          keseluruhan nilai booking.
        </p>
      </PolicySection>

      <PolicySection
        number={9}
        title="Pembatalan oleh operator"
      >
        <p className="leading-8 text-slate-600">
          Operator dapat membatalkan perjalanan karena:
        </p>

        <BulletList
          items={[
            "Cuaca buruk atau kondisi laut yang tidak aman.",
            "Gelombang tinggi atau perubahan pasang surut.",
            "Penutupan atau pembatasan pelabuhan.",
            "Kerusakan, pemeriksaan, atau kendala teknis kapal.",
            "Kebutuhan operasional.",
            "Pertimbangan keselamatan.",
            "Instruksi pemerintah atau otoritas terkait.",
            "Keadaan kahar.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Dalam kondisi tersebut, Nusa Gili Boat akan
          membantu menawarkan penyelesaian yang tersedia,
          seperti:
        </p>

        <BulletList
          items={[
            "Pemindahan ke jadwal berikutnya.",
            "Pemindahan ke operator lain dengan persetujuan pelanggan.",
            "Kredit perjalanan apabila disepakati.",
            "Refund sebagian atau penuh untuk leg yang dibatalkan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Alternatif perjalanan bergantung pada
          ketersediaan kursi dan kondisi operasional.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila alternatif yang wajar tidak tersedia
          atau tidak diterima pelanggan, permintaan
          refund untuk perjalanan yang dibatalkan akan
          diproses sesuai kebijakan operator, nilai
          layanan yang tidak digunakan, dan hukum yang
          berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={10}
        title="Keterlambatan dan perubahan jadwal"
      >
        <p className="leading-8 text-slate-600">
          Jadwal keberangkatan, kedatangan, dan durasi
          perjalanan merupakan perkiraan.
        </p>

        <p className="leading-8 text-slate-600">
          Operator dapat melakukan perubahan waktu,
          kapal, titik check-in, pelabuhan, atau rute
          karena cuaca, kondisi laut, teknis,
          keselamatan, kepadatan pelabuhan, atau
          kebutuhan operasional.
        </p>

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat akan berupaya menyampaikan
          perubahan setelah menerima informasi dari
          operator melalui email, telepon, WhatsApp,
          atau halaman booking.
        </p>

        <p className="leading-8 text-slate-600">
          Perubahan kecil yang tidak secara material
          mengurangi layanan tidak otomatis memberikan
          hak atas refund atau kompensasi.
        </p>
      </PolicySection>

      <PolicySection
        number={11}
        title="Perubahan jadwal yang signifikan"
      >
        <p className="leading-8 text-slate-600">
          Perubahan dapat dianggap signifikan apabila
          secara material mengubah tanggal, rute,
          pelabuhan, atau waktu perjalanan sehingga
          layanan tidak lagi sesuai dengan kebutuhan
          utama booking pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Untuk perubahan signifikan, penyelesaian dapat
          berupa jadwal pengganti, operator alternatif,
          kredit perjalanan, atau refund untuk leg yang
          terdampak.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan harus merespons penawaran penyelesaian
          dalam batas waktu yang disampaikan agar
          ketersediaan alternatif dapat dipertahankan.
        </p>
      </PolicySection>

      <PolicySection
        number={12}
        title="Keadaan kahar"
      >
        <p className="leading-8 text-slate-600">
          Keadaan kahar adalah peristiwa di luar kendali
          wajar Nusa Gili Boat dan operator yang
          menghambat atau menyebabkan perjalanan tidak
          dapat dilaksanakan sebagaimana direncanakan.
        </p>

        <BulletList
          items={[
            "Cuaca ekstrem dan kondisi laut berbahaya.",
            "Gempa bumi, tsunami, banjir, atau bencana alam lainnya.",
            "Letusan gunung berapi.",
            "Wabah, epidemi, atau pandemi.",
            "Perang, terorisme, kerusuhan, atau gangguan keamanan.",
            "Pemogokan atau gangguan layanan publik.",
            "Penutupan pelabuhan.",
            "Pembatasan atau kebijakan pemerintah.",
            "Gangguan besar terhadap infrastruktur atau sistem.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Penyelesaian booking dalam keadaan kahar akan
          mempertimbangkan kebijakan operator,
          ketersediaan alternatif, status pembayaran,
          layanan yang telah digunakan, dan ketentuan
          hukum yang berlaku.
        </p>
      </PolicySection>

      <PolicySection
        number={13}
        title="Booking yang belum dibayar atau kedaluwarsa"
      >
        <p className="leading-8 text-slate-600">
          Booking yang belum dibayar sampai batas waktu
          pembayaran dapat berstatus kedaluwarsa dan
          kursinya dapat dilepas kembali.
        </p>

        <p className="leading-8 text-slate-600">
          Karena tidak ada dana yang berhasil diterima,
          booking yang kedaluwarsa sebelum pembayaran
          tidak menimbulkan proses refund.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila pembayaran berhasil dilakukan tetapi
          sistem belum memperbarui status booking,
          pelanggan harus menghubungi kami dengan
          menyertakan bukti transaksi agar pembayaran
          dapat diverifikasi.
        </p>
      </PolicySection>

      <PolicySection
        number={14}
        title="Pembayaran ganda atau jumlah yang tidak sesuai"
      >
        <p className="leading-8 text-slate-600">
          Apabila pelanggan melakukan pembayaran lebih
          dari satu kali untuk order yang sama,
          pelanggan dapat meminta pengembalian dana
          untuk pembayaran berlebih.
        </p>

        <p className="leading-8 text-slate-600">
          Refund akan diproses setelah nomor transaksi,
          jumlah pembayaran, status settlement, dan
          kepemilikan transaksi berhasil diverifikasi.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila jumlah yang dibayar kurang dari jumlah
          tagihan, booking dapat tetap berstatus belum
          dibayar sampai kekurangan diselesaikan atau
          transaksi dibatalkan.
        </p>
      </PolicySection>

      <PolicySection
        number={15}
        title="Layanan pihak ketiga"
      >
        <p className="leading-8 text-slate-600">
          Layanan tambahan yang dibeli bersama atau
          terpisah dari tiket dapat memiliki kebijakan
          pembatalan dan refund sendiri.
        </p>

        <p className="leading-8 text-slate-600">
          Layanan tersebut dapat mencakup:
        </p>

        <BulletList
          items={[
            "Shuttle atau transfer bersama.",
            "Transfer hotel atau kendaraan pribadi.",
            "Paket wisata dan aktivitas.",
            "Akomodasi.",
            "Asuransi perjalanan.",
            "Bagasi atau layanan tambahan operator.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Refund layanan pihak ketiga mengikuti
          ketentuan penyedia layanan terkait yang
          diinformasikan kepada pelanggan.
        </p>
      </PolicySection>

      <PolicySection
        number={16}
        title="Biaya yang mungkin tidak dikembalikan"
      >
        <p className="leading-8 text-slate-600">
          Tidak semua biaya otomatis dipotong dari
          refund. Pengurangan hanya dapat berlaku
          apabila biaya tersebut benar-benar telah
          timbul, tidak dikembalikan oleh pihak terkait,
          relevan dengan transaksi, dan telah
          diinformasikan kepada pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Biaya yang mungkin tidak dapat dikembalikan
          dapat meliputi:
        </p>

        <BulletList
          items={[
            "Penalti pembatalan yang diberlakukan operator.",
            "Biaya bank yang tidak dikembalikan.",
            "Biaya konversi mata uang.",
            "Biaya administrasi atau layanan yang telah diinformasikan.",
            "Premi asuransi yang telah aktif.",
            "Biaya layanan pihak ketiga yang telah digunakan atau tidak dapat dibatalkan.",
            "Biaya payment gateway apabila penyedia pembayaran menetapkannya sebagai tidak dapat dikembalikan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Nusa Gili Boat tidak akan menyatakan suatu
          biaya sebagai tidak dapat dikembalikan apabila
          biaya tersebut sebenarnya dikembalikan oleh
          penyedia terkait.
        </p>
      </PolicySection>

      <PolicySection
        number={17}
        title="Perhitungan nilai refund"
      >
        <p className="leading-8 text-slate-600">
          Nilai refund ditentukan berdasarkan:
        </p>

        <BulletList
          items={[
            "Jumlah yang berhasil dibayar.",
            "Leg atau layanan yang dibatalkan.",
            "Bagian layanan yang telah digunakan.",
            "Waktu permintaan pembatalan.",
            "Kebijakan operator dan jenis tarif.",
            "Selisih harga apabila terjadi perubahan.",
            "Biaya yang benar-benar tidak dapat dikembalikan.",
            "Refund atau kompensasi yang telah diberikan sebelumnya.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Sebelum refund diproses, pelanggan akan
          diberi informasi mengenai hasil peninjauan
          dan jumlah yang disetujui apabila tersedia.
        </p>
      </PolicySection>

      <PolicySection
        number={18}
        title="Metode pengembalian dana"
      >
        <p className="leading-8 text-slate-600">
          Refund akan dikembalikan melalui metode
          pembayaran semula apabila metode tersebut
          mendukung proses refund.
        </p>

        <p className="leading-8 text-slate-600">
          Bergantung pada metode pembayaran, refund
          dapat diproses melalui payment gateway,
          pengembalian limit kartu, dompet elektronik,
          rekening bank, atau metode lain yang
          disepakati.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila refund ke metode semula tidak tersedia,
          kami dapat meminta data rekening atau informasi
          lain yang diperlukan setelah melakukan
          verifikasi identitas pelanggan.
        </p>

        <p className="leading-8 text-slate-600">
          Nama pemilik rekening atau akun penerima dapat
          diminta sesuai dengan nama pelanggan atau
          pihak pembayar untuk mencegah penipuan.
        </p>
      </PolicySection>

      <PolicySection
        number={19}
        title="Waktu pemrosesan refund"
      >
        <p className="leading-8 text-slate-600">
          Peninjauan refund dimulai setelah permintaan
          dan dokumen pendukung diterima secara lengkap.
        </p>

        <p className="leading-8 text-slate-600">
          Apabila persetujuan operator diperlukan,
          proses akan dilanjutkan setelah operator
          memberikan hasil verifikasi.
        </p>

        <p className="leading-8 text-slate-600">
          Setelah refund disetujui dan diajukan ke
          penyedia pembayaran, dana umumnya memerlukan
          sekitar 7 sampai 30 hari kerja untuk diterima.
        </p>

        <p className="leading-8 text-slate-600">
          Waktu tersebut merupakan perkiraan dan dapat
          berbeda bergantung pada bank, payment gateway,
          penerbit kartu, dompet elektronik, jaringan
          pembayaran, hari libur, serta proses konversi
          mata uang.
        </p>

        <p className="leading-8 text-slate-600">
          Kami akan memberikan informasi status refund
          berdasarkan data yang tersedia dari operator
          dan penyedia pembayaran.
        </p>
      </PolicySection>

      <PolicySection
        number={20}
        title="Cara mengajukan pembatalan atau refund"
      >
        <p className="leading-8 text-slate-600">
          Permintaan harus disampaikan melalui halaman
          kontak atau saluran layanan pelanggan resmi
          Nusa Gili Boat.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan harus menyertakan:
        </p>

        <BulletList
          items={[
            "Kode booking.",
            "Nama pelanggan atau penumpang.",
            "Alamat email yang digunakan saat booking.",
            "Nomor telepon atau WhatsApp.",
            "Perjalanan atau leg yang ingin dibatalkan.",
            "Alasan pembatalan.",
            "Bukti pembayaran apabila diminta.",
            "Dokumen pendukung apabila relevan.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Permintaan yang tidak lengkap dapat
          memperlambat proses pemeriksaan.
        </p>

        <p className="leading-8 text-slate-600">
          Pengiriman permintaan tidak otomatis berarti
          refund telah disetujui. Pelanggan akan
          menerima informasi setelah peninjauan selesai.
        </p>
      </PolicySection>

      <PolicySection
        number={21}
        title="Tanggung jawab pelanggan"
      >
        <p className="leading-8 text-slate-600">
          Sebelum melakukan pembayaran, pelanggan wajib
          memeriksa:
        </p>

        <BulletList
          items={[
            "Nama dan data penumpang.",
            "Rute dan pelabuhan.",
            "Tanggal dan jadwal perjalanan.",
            "Operator dan kapal.",
            "Jumlah penumpang.",
            "Harga dan biaya tambahan.",
            "Alamat email dan nomor kontak.",
            "Kebijakan pembatalan serta perubahan yang berlaku.",
          ]}
        />

        <p className="leading-8 text-slate-600">
          Kesalahan data yang diberikan pelanggan dapat
          menyebabkan biaya perubahan, penolakan
          boarding, kehilangan perjalanan, atau
          berkurangnya hak refund.
        </p>

        <p className="leading-8 text-slate-600">
          Pelanggan juga bertanggung jawab memastikan
          rekening, kartu, dompet elektronik, atau
          metode pembayaran yang digunakan berada
          dalam kewenangannya.
        </p>
      </PolicySection>

      <PolicySection
        number={22}
        title="Chargeback dan perselisihan pembayaran"
      >
        <p className="leading-8 text-slate-600">
          Pelanggan disarankan menghubungi Nusa Gili
          Boat terlebih dahulu apabila terdapat
          masalah pembayaran atau permintaan refund.
        </p>

        <p className="leading-8 text-slate-600">
          Pengajuan chargeback yang tidak sah,
          penggunaan metode pembayaran tanpa izin,
          atau penyampaian informasi palsu dapat
          diperiksa bersama penyedia pembayaran dan
          pihak berwenang.
        </p>

        <p className="leading-8 text-slate-600">
          Selama perselisihan pembayaran berlangsung,
          booking atau refund terkait dapat ditahan
          sementara sampai proses verifikasi selesai.
        </p>
      </PolicySection>

      <PolicySection
        number={23}
        title="Pembagian tanggung jawab"
      >
        <p className="leading-8 text-slate-600">
          Nusa Gili Boat bertanggung jawab memproses
          booking, menerima permintaan, menyampaikan
          informasi yang tersedia, dan memfasilitasi
          refund yang telah disetujui dengan
          kehati-hatian yang wajar.
        </p>

        <p className="leading-8 text-slate-600">
          Operator bertanggung jawab atas pengoperasian
          kapal, keselamatan pelayaran, awak kapal,
          perubahan operasional, dan pelaksanaan layanan
          transportasi.
        </p>

        <p className="leading-8 text-slate-600">
          Sejauh diperbolehkan hukum, biaya tidak
          langsung seperti hotel tambahan, penerbangan
          lanjutan, transportasi lain, kegiatan wisata,
          atau kehilangan kesempatan bisnis tidak
          otomatis menjadi bagian dari refund tiket
          fast boat.
        </p>

        <p className="leading-8 text-slate-600">
          Tidak ada bagian dalam kebijakan ini yang
          dimaksudkan untuk menghapus hak konsumen atau
          tanggung jawab yang tidak dapat dikesampingkan
          berdasarkan hukum Republik Indonesia.
        </p>
      </PolicySection>

      <PolicySection
        number={24}
        title="Keluhan atas keputusan refund"
      >
        <p className="leading-8 text-slate-600">
          Apabila pelanggan tidak menyetujui hasil
          peninjauan, pelanggan dapat meminta penjelasan
          dengan menyertakan kode booking dan alasan
          keberatan.
        </p>

        <p className="leading-8 text-slate-600">
          Kami akan memeriksa kembali informasi booking,
          bukti pembayaran, ketentuan tarif, kebijakan
          operator, dan komunikasi sebelumnya.
        </p>

        <p className="leading-8 text-slate-600">
          Perselisihan akan diupayakan untuk diselesaikan
          terlebih dahulu melalui komunikasi dan
          musyawarah.
        </p>
      </PolicySection>

      <PolicySection
        number={25}
        title="Perubahan kebijakan"
      >
        <p className="leading-8 text-slate-600">
          Kebijakan ini dapat diperbarui untuk
          menyesuaikan perubahan layanan, operator,
          teknologi pembayaran, atau peraturan yang
          berlaku.
        </p>

        <p className="leading-8 text-slate-600">
          Versi terbaru akan diterbitkan pada halaman
          ini bersama tanggal pembaruan.
        </p>

        <p className="leading-8 text-slate-600">
          Kecuali diwajibkan oleh hukum atau disepakati
          dengan pelanggan, kelayakan refund suatu
          booking akan mengacu pada ketentuan yang
          berlaku ketika booking tersebut dibuat.
        </p>
      </PolicySection>

      <PolicySection
        number={26}
        title="Hubungi kami"
      >
        <p className="leading-8 text-slate-600">
          Pertanyaan, pembatalan, perubahan, dan
          permintaan refund dapat disampaikan melalui:
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
          Ketentuan operator sedang dilengkapi
        </h2>

        <p className="mt-2 leading-7 text-amber-900">
          Kebijakan pembatalan khusus setiap operator,
          biaya administrasi final, metode refund per
          jenis pembayaran, identitas resmi pemilik
          usaha, serta alamat operasional akan
          diperbarui sebelum pembayaran production
          diaktifkan.
        </p>
      </aside>
    </PublicInfoPage>
  )
}
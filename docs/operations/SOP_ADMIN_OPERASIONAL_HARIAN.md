# SOP Admin Operasional Harian Nusa Gili Boat

**Sistem:** NusaGiliBoat / GiliGo Booking Operations  
**Zona waktu:** WITA — Asia/Makassar  
**Versi:** 1.0  
**Tanggal berlaku:** 6 Agustus 2026  
**Status:** Final operasional

## 1. Tujuan

SOP ini menjadi panduan admin untuk memperbarui inventory, memantau booking dan pembayaran, membantu pelanggan, menyiapkan manifest, serta menjaga data operasional tetap akurat.

Admin tidak boleh menebak ketersediaan kursi atau mengonfirmasi booking sebelum pembayaran dan ketersediaan kursi dipastikan.

## 2. Prinsip Dasar

### Aturan H+2

Pelanggan hanya dapat memesan perjalanan minimal dua hari dari tanggal pemesanan. Admin harus memastikan inventory beberapa hari berikutnya tersedia.

### Posisi kursi

| Kondisi booking | Posisi kursi |
|---|---|
| Pending | Held |
| Confirmed | Booked |
| Completed | Booked |
| Cancelled | Dilepaskan |
| Expired dan belum dibayar | Dilepaskan |

Booking yang belum dibayar tidak dihitung sebagai penjualan.

### Aturan manifest

Manifest hanya memuat:

```text
Booking Status = Confirmed atau Completed
Payment Status = Paid
```

Booking Pending, Cancelled, Expired, atau belum dibayar tidak dimasukkan.

### Dokumen pelanggan

Nusa Gili Boat menerbitkan **Booking Confirmation**, bukan tiket resmi fast boat. Pelanggan menunjukkan dokumen tersebut kepada agen atau provider untuk verifikasi dan penerbitan tiket resmi.

## 3. Persiapan Awal Hari

Buka Dashboard dan periksa:

- Pending Customer Follow-up
- Paid Bookings Ready for Manifest
- Today’s Departures
- Today’s Passengers
- Tomorrow
- Next 7 Days

Lalu periksa Trip Inventory:

- tanggal perjalanan;
- operator, kapal, rute, dan jam;
- kapasitas kursi;
- Booked, Held, dan Available;
- harga;
- Sales Status;
- status aktif.

Prioritaskan inventory yang belum diperbarui, booking Pending, pembayaran bermasalah, keberangkatan terdekat, dan manifest yang harus dikirim.

## 4. Update Trip Inventory

Kapasitas kursi harus berdasarkan informasi terbaru dari agen atau provider. Jangan menebak sisa kursi.

Jika provider belum memberi konfirmasi:

```text
Sales Status = CLOSED
```

Data yang harus diperiksa saat membuat atau mengubah inventory:

- Trip Schedule
- Travel Date
- Seat Capacity
- Adult, Child, dan Infant Price
- Currency
- Sales Status
- Notes
- Trip inventory is active

Status penjualan:

| Status | Penggunaan |
|---|---|
| OPEN | Jadwal aktif dan dapat dijual |
| CLOSED | Penjualan ditutup sementara |
| SOLD_OUT | Kursi sudah habis |

Inventory hanya tampil di pencarian jika OPEN, aktif, dan Available Seats lebih dari 0.

Seat Capacity tidak boleh melebihi kapasitas aktif kapal atau lebih kecil dari jumlah Booked dan Held.

Inventory lama tidak dihapus karena menjadi bagian dari riwayat booking dan pembayaran.

## 5. Pemeriksaan Booking Pending

Booking Pending berarti:

```text
Booking Status = Pending
Payment Status = Pending
Seats = Held
```

Pada flow Production, kursi booking Pending berada pada posisi **Held**
selama masa pembayaran. Durasi seat hold default adalah **30 menit**.

Admin tidak perlu membatalkan booking Pending normal hanya karena
pelanggan belum langsung membayar. Sistem expiry otomatis akan
memproses booking yang melewati masa hold.

Jika masa hold berakhir dan pembayaran belum berhasil, hasil normalnya:

```text
Booking Status = Cancelled
Payment Status = Pending
Held Seats dilepaskan
Available Seats bertambah kembali
```

Scheduler Production memeriksa expired held booking secara berkala.

Periksa booking code, pelanggan, kontak, rute, tanggal, jumlah penumpang, total, metode pembayaran, batas waktu pembayaran, dan posisi kursi.

Hubungi pelanggan bila pembayaran belum selesai, ada kendala, data belum lengkap, jadwal semakin dekat, atau inventory provider berubah.

Contoh pesan:

```text
Halo Bapak/Ibu,

Kami menghubungi Anda terkait booking Nusa Gili Boat dengan kode [BOOKING CODE].

Status pembayaran masih Pending. Apakah ada kendala dalam proses pembayaran yang dapat kami bantu?

Terima kasih.
```

Jika booking expired atau dibatalkan, pastikan Held Seats berkurang dan Available Seats bertambah kembali.

## 6. Pemeriksaan Pembayaran

### Pembayaran iPaymu

Flow pembayaran Production normal menggunakan pembayaran online langsung
melalui **iPaymu**.

Alur normal:

1. booking dibuat sebagai Pending + Pending;
2. kursi berada pada posisi Held;
3. pelanggan membuka halaman pembayaran aman iPaymu;
4. pelanggan menyelesaikan pembayaran;
5. iPaymu mengirim callback;
6. sistem memverifikasi callback;
7. booking berubah menjadi Confirmed + Paid;
8. kursi berpindah dari Held ke Booked.

Target:

```text
Booking Status = Confirmed
Payment Status = Paid
Held Seats berkurang
Booked Seats bertambah
```

Admin **tidak boleh** mengubah booking menjadi Paid hanya berdasarkan
pengakuan pelanggan, screenshot, atau pesan pembayaran tanpa verifikasi
yang memadai.

Jika pelanggan mengalami kendala pembayaran, admin boleh memberikan
bantuan operasional dan komunikasi kepada pelanggan. Bantuan tersebut
tidak menggantikan status pembayaran yang berasal dari sistem.

### Payment Review

Beberapa kondisi pembayaran dapat membutuhkan pemeriksaan manual,
misalnya pembayaran diterima setelah kursi sebelumnya sudah dilepaskan.

Jika Booking Detail menampilkan **Payment Review Required**:

1. jangan abaikan tanda review;
2. periksa booking dan status pembayaran;
3. periksa inventory dan ketersediaan kursi;
4. jangan memasukkan booking ke manifest sebelum status final valid;
5. tentukan penyelesaian yang benar.

Payment Review hanya boleh diselesaikan dalam salah satu kondisi final:

- **Confirmed + Paid** setelah pembayaran diverifikasi dan kursi aman;
- **Cancelled + Refunded** setelah refund benar-benar selesai.

Jangan menandai Payment Review sebagai resolved jika booking masih dalam
kondisi antara seperti Cancelled + Paid atau Cancelled + Pending.

### Pembayaran setelah pembatalan

Jika pembayaran diterima setelah booking dibatalkan:

1. jangan langsung mengubah booking menjadi Confirmed;
2. periksa Payment Review;
3. periksa apakah kursi masih tersedia;
4. hubungi pelanggan bila diperlukan;
5. pilih salah satu hasil final:
   - Confirmed + Paid jika pembayaran valid dan kursi tersedia; atau
   - Cancelled + Refunded jika booking tidak dapat dipenuhi dan refund
     telah selesai;
6. catat tindakan admin yang relevan.

## 7. Perubahan Status Booking

| Booking Status | Payment Status yang sesuai |
|---|---|
| Pending | Pending |
| Confirmed | Paid, Refunded, atau Demo |
| Completed | Paid, Refunded, atau Demo |
| Cancelled | Pending, Paid, Refunded, atau Demo sesuai kasus |

Kombinasi berikut tidak boleh dibuat:

```text
Pending + Paid
Confirmed + Pending
Completed + Pending
```

## 8. Menyiapkan Manifest Provider

Manifest diperiksa menjelang keberangkatan setelah status pembayaran dipastikan.

Hanya booking Confirmed/Completed dengan status Paid yang masuk manifest.

Periksa:

- booking code;
- nama pemesan dan kontak;
- nama dan jumlah penumpang;
- status booking dan pembayaran;
- rute, tanggal, dan jam;
- operator dan kapal.

Gunakan **Print / Save as PDF**, periksa hasilnya, lalu kirim melalui kanal yang disepakati dengan provider.

Contoh pesan:

```text
Halo,

Berikut manifest penumpang Nusa Gili Boat untuk keberangkatan:

Tanggal:
Jam:
Rute:
Operator/Kapal:

Manifest hanya berisi booking yang sudah dikonfirmasi dan dibayar.

Terima kasih.
```

## 9. Hari Keberangkatan

1. Buka Departures dan pilih tanggal perjalanan.
2. Periksa Booked dan Held.
3. Pastikan manifest sudah dikirim.
4. Pastikan pelanggan memahami proses verifikasi dengan provider.
5. Bantu pelanggan bila ada kendala.
6. Catat masalah operasional.
7. Setelah perjalanan selesai, ubah booking menjadi Completed bila diperlukan.

Booking Pending yang belum dibayar tidak dihitung sebagai penumpang terjual.

## 10. Penutupan Operasional Harian

Sebelum selesai bekerja:

- periksa booking Pending;
- tindak lanjuti pembayaran bermasalah;
- pastikan tidak ada Payment Review Required yang terlewat;
- pastikan inventory beberapa hari ke depan tersedia;
- tutup inventory yang belum dikonfirmasi provider;
- periksa keberangkatan hari berikutnya;
- periksa manifest yang harus dikirim;
- pastikan tidak ada status booking yang tidak konsisten.

Checklist:

```text
[ ] Inventory berikutnya tersedia
[ ] Pending booking diperiksa
[ ] Pembayaran bermasalah ditindaklanjuti
[ ] Payment Review Required diperiksa
[ ] Paid booking masuk manifest
[ ] Manifest keberangkatan berikutnya siap
[ ] Data test tidak tampil sebagai inventory normal
[ ] Tidak ada OPEN inventory dengan Available 0
```

## 11. Prosedur High Season

Saat high season:

- periksa inventory lebih sering;
- lakukan follow-up Pending lebih cepat;
- tutup penjualan jika kursi tidak pasti;
- catat waktu terakhir konfirmasi dan nama kontak provider;
- pantau perubahan jadwal, pembatalan, dan titik check-in;
- hindari overselling dengan mengutamakan data terbaru.

Jika ketersediaan tidak dapat dipastikan:

```text
Sales Status = CLOSED
```

## 12. Penanganan Data Pengujian

Inventory atau booking test harus diberi catatan yang jelas, tidak dibiarkan aktif untuk pelanggan umum, dan dinonaktifkan setelah pengujian.

Jangan menghapus inventory yang sudah memiliki booking atau payment session. Simpan sebagai riwayat pengujian Production.

Jika masih memiliki Held Seats, tunggu booking expired atau selesaikan status booking sebelum menonaktifkan inventory.

## 13. Tindakan Darurat

### Website atau pembayaran bermasalah

1. jangan mengubah status sembarangan;
2. catat booking code dan waktu kejadian;
3. simpan screenshot error;
4. gunakan bantuan manual bila diperlukan;
5. hubungi pelanggan;
6. periksa kembali setelah sistem normal.

### Perubahan jadwal provider

1. ubah inventory menjadi CLOSED;
2. hentikan penjualan;
3. identifikasi booking terdampak;
4. hubungi pelanggan;
5. tawarkan jadwal pengganti atau refund sesuai kebijakan.

### Overselling

1. hentikan penjualan;
2. konfirmasi kapasitas dengan provider;
3. prioritaskan booking Paid dan Confirmed;
4. hubungi pelanggan terdampak;
5. catat seluruh tindakan.

### iPaymu bridge atau callback bermasalah

Jika halaman pembayaran, callback, atau bridge iPaymu diduga bermasalah:

1. jangan mengubah Payment Status menjadi Paid secara manual hanya untuk
   melewati gangguan;
2. catat booking code, waktu kejadian, dan pesan error;
3. periksa apakah masalah hanya terjadi pada satu booking atau seluruh
   pembayaran;
4. arahkan pelanggan untuk menunggu apabila status pembayaran belum
   dapat dipastikan;
5. eskalasi pemeriksaan bridge kepada penanggung jawab teknis;
6. setelah layanan normal, periksa kembali Booking Detail dan Payment
   Review sebelum mengambil tindakan lanjutan.

### Seat cleanup scheduler bermasalah

Jika booking yang sudah melewati masa hold tetap berada pada Pending
dengan Held Seats, atau scheduler cleanup dilaporkan gagal:

1. jangan mengurangi Held Seats secara manual tanpa mengetahui booking
   sumbernya;
2. catat booking dan inventory terkait;
3. jika risiko overselling ada, ubah inventory menjadi CLOSED;
4. eskalasi pemeriksaan scheduler dan cleanup service kepada penanggung
   jawab teknis;
5. setelah recovery, pastikan booking expired diproses dan Available
   Seats kembali konsisten.

### Held Seats atau inventory tidak konsisten

Jika angka Booked, Held, Available, dan Capacity terlihat tidak sesuai:

1. jangan menebak atau mengubah counter kursi secara spekulatif;
2. identifikasi booking yang menggunakan inventory tersebut;
3. hentikan penjualan dengan status CLOSED apabila ketersediaan tidak
   dapat dipastikan;
4. cocokkan booking Pending, Confirmed, Cancelled, dan status pembayaran;
5. eskalasi jika sumber selisih tidak dapat dijelaskan dari booking yang
   ada;
6. buka kembali penjualan hanya setelah angka inventory konsisten.

### Manifest tidak sesuai

Jika jumlah booking atau penumpang di manifest tidak sesuai dengan data
operasional:

1. jangan kirim manifest yang diketahui tidak akurat kepada provider;
2. periksa apakah booking terkait berstatus Confirmed atau Completed;
3. pastikan Payment Status = Paid;
4. cocokkan jumlah penumpang dan data penumpang pada Booking Detail;
5. selesaikan Payment Review terlebih dahulu apabila masih aktif;
6. setelah data sumber benar, buka kembali manifest dan periksa hasil
   sebelum Print / Save as PDF.

## 14. Ringkasan Alur Admin

```text
Update Inventory
        ↓
Pantau Booking Pending
        ↓
Bantu Pelanggan Bermasalah
        ↓
Verifikasi Pembayaran
        ↓
Confirmed + Paid
        ↓
Held menjadi Booked
        ↓
Masuk Manifest
        ↓
Kirim ke Provider
        ↓
Pantau Keberangkatan
        ↓
Selesaikan dan Arsipkan
```

## 15. Aturan yang Tidak Boleh Dilanggar

1. Jangan menebak jumlah kursi.
2. Jangan mengonfirmasi booking sebelum pembayaran diverifikasi.
3. Jangan memasukkan booking Pending ke manifest.
4. Jangan menghapus inventory yang memiliki riwayat booking.
5. Jangan mempertahankan OPEN jika kursi tidak pasti.
6. Jangan mengubah integrasi payment tanpa prosedur teknis.
7. Jangan membagikan API key, token, VA merchant, atau credential.
8. Jangan menganggap Booking Confirmation sebagai tiket resmi provider.
9. Jangan menjanjikan kursi sebelum inventory tersedia.
10. Utamakan akurasi data dibanding jumlah penjualan.

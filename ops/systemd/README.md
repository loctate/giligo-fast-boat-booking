# Expired Held-Seat Cleanup Scheduler

Systemd timer ini menjalankan endpoint internal untuk membatalkan booking
Pending yang melewati `seatHoldExpiresAt` dan melepaskan `heldSeats`.

## Included files

- `nusagiliboat-seat-cleanup.service`
- `nusagiliboat-seat-cleanup.timer`
- `seat-cleanup.env.example`
- `../../scripts/run-expired-seat-cleanup.sh`

## Activation requirements

Scheduler belum boleh diaktifkan sebelum:

1. Endpoint cleanup sudah di-commit, push, dan deploy.
2. GET endpoint menghasilkan HTTP 405.
3. POST tanpa autentikasi menghasilkan HTTP 401.
4. POST dengan CRON_SECRET yang benar menghasilkan HTTP 200.
5. Database berada pada baseline yang sudah diverifikasi.
6. Secret aplikasi sama dengan secret pada VPS scheduler.

Endpoint yang digunakan:

`/api/internal/expire-held-bookings`

## Installation paths

- `/etc/systemd/system/nusagiliboat-seat-cleanup.service`
- `/etc/systemd/system/nusagiliboat-seat-cleanup.timer`
- `/etc/nusagiliboat/seat-cleanup.env`
- `/usr/local/lib/nusagiliboat/run-expired-seat-cleanup.sh`

Secret sebenarnya tidak boleh disimpan dalam repository.

## Install directories and files

Jalankan pada VPS scheduler yang sudah disetujui sebagai root:

```bash
install -d -o root -g root -m 0755 /usr/local/lib/nusagiliboat
install -d -o root -g root -m 0700 /etc/nusagiliboat

install -o root -g root -m 0755 \
  scripts/run-expired-seat-cleanup.sh \
  /usr/local/lib/nusagiliboat/run-expired-seat-cleanup.sh

install -o root -g root -m 0644 \
  ops/systemd/nusagiliboat-seat-cleanup.service \
  /etc/systemd/system/nusagiliboat-seat-cleanup.service

install -o root -g root -m 0644 \
  ops/systemd/nusagiliboat-seat-cleanup.timer \
  /etc/systemd/system/nusagiliboat-seat-cleanup.timer
```

## Environment file

Buat `/etc/nusagiliboat/seat-cleanup.env` dengan mode `0600`.

```text
CLEANUP_ENDPOINT_URL=https://APPROVED_HOST/api/internal/expire-held-bookings
CRON_SECRET=REPLACE_WITH_DEPLOYED_APPLICATION_SECRET
```

Persyaratan keamanan:

- owner dan group harus `root`;
- mode file harus `0600`;
- panjang secret 32 sampai 256 karakter;
- secret tidak boleh dicetak ke terminal atau log;
- environment aplikasi dan scheduler harus memakai secret yang sama.

Validasi permission tanpa membuka isi file:

```bash
stat -c 'owner=%U group=%G mode=%a path=%n' \
  /etc/nusagiliboat/seat-cleanup.env
```

## Validate before enabling

Validasi runner dan unit sebelum timer diaktifkan:

```bash
bash -n /usr/local/lib/nusagiliboat/run-expired-seat-cleanup.sh

systemd-analyze verify \
  /etc/systemd/system/nusagiliboat-seat-cleanup.service \
  /etc/systemd/system/nusagiliboat-seat-cleanup.timer

systemctl daemon-reload
systemctl start nusagiliboat-seat-cleanup.service

systemctl status --no-pager \
  nusagiliboat-seat-cleanup.service

journalctl \
  -u nusagiliboat-seat-cleanup.service \
  --since '-10 minutes' \
  --no-pager
```

Manual test harus selesai tanpa error dan menghasilkan `failed=0`.

## Enable timer

Aktifkan hanya setelah manual test berhasil:

```bash
systemctl enable --now nusagiliboat-seat-cleanup.timer

systemctl status --no-pager \
  nusagiliboat-seat-cleanup.timer

systemctl list-timers --all \
  nusagiliboat-seat-cleanup.timer
```

Timer berjalan setiap lima menit dengan randomized delay kecil.

## Disable and rollback

```bash
systemctl disable --now nusagiliboat-seat-cleanup.timer

rm -f \
  /etc/systemd/system/nusagiliboat-seat-cleanup.service \
  /etc/systemd/system/nusagiliboat-seat-cleanup.timer \
  /etc/nusagiliboat/seat-cleanup.env \
  /usr/local/lib/nusagiliboat/run-expired-seat-cleanup.sh

systemctl daemon-reload
systemctl reset-failed
```

Menghapus scheduler tidak mengubah row booking atau inventory.

## Secret rotation

1. Update `CRON_SECRET` pada environment aplikasi.
2. Deploy aplikasi dan pastikan environment baru aktif.
3. Update `/etc/nusagiliboat/seat-cleanup.env`.
4. Jalankan service secara manual.
5. Pastikan autentikasi sukses dan `failed=0`.
6. Pastikan timer tetap aktif.

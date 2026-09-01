"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type ScheduleOption = {
  $id: string

  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string
  isActive: boolean

  operatorName: string
  vesselName: string
  vesselActiveCapacity: number

  routeCode: string
  fromPort: string
  toPort: string
}

export type TripInventoryRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  inventoryCode: string

  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string

  salesStatus: string
  isActive: boolean

  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null

  scheduleCode?: string | null
  operatorName?: string | null
  vesselName?: string | null
  routeCode?: string | null
  fromPort?: string | null
  toPort?: string | null
}

type InventoryForm = {
  scheduleId: string
  travelDate: string
  seatCapacity: string

  adultPrice: string
  childPrice: string
  infantPrice: string

  currency: string
  salesStatus: string
  isActive: boolean
  notes: string
}

type ApiResponse = {
  success: boolean
  inventory?: TripInventoryRow
  error?: string
}

type BulkInventoryForm = {
  scheduleId: string
  startDate: string
  endDate: string

  seatCapacity: string

  adultPrice: string
  childPrice: string
  infantPrice: string

  currency: string
  salesStatus: string
  isActive: boolean

  notes: string
}

type BulkPreviewStatus =
  | "CREATE"
  | "EXISTS"
  | "NON_OPERATING_DAY"

type BulkPreviewRow = {
  travelDate: string
  weekdayCode: string
  inventoryCode: string
  status: BulkPreviewStatus
}

type BulkCreateExecutionStatus =
  | "CREATED"
  | "SKIPPED"
  | "FAILED"

type BulkCreateExecutionRow = {
  travelDate: string
  inventoryCode: string
  status: BulkCreateExecutionStatus
  message?: string
}

type BulkUpdateExecutionStatus =
  | "UPDATED"
  | "SKIPPED"
  | "FAILED"

type BulkUpdateExecutionRow = {
  travelDate: string
  inventoryCode: string
  status: BulkUpdateExecutionStatus
  message?: string
}

type BulkPreflightResponse = {
  success: boolean
  inventory?: TripInventoryRow[]
  total?: number
  error?: string
}

type BulkUpdateForm = {
  scheduleId: string
  startDate: string
  endDate: string

  applySeatCapacity: boolean
  seatCapacity: string

  applyAdultPrice: boolean
  adultPrice: string

  applyChildPrice: boolean
  childPrice: string

  applyInfantPrice: boolean
  infantPrice: string

  applyCurrency: boolean
  currency: string

  applySalesStatus: boolean
  salesStatus: string

  applyIsActive: boolean
  isActive: boolean

  applyNotes: boolean
  notes: string
}

type BulkUpdatePreviewStatus =
  | "UPDATE"
  | "MISSING"
  | "BLOCKED"
  | "NON_OPERATING_DAY"

type BulkUpdatePreviewRow = {
  travelDate: string
  weekdayCode: string
  inventoryCode: string
  inventoryId: string | null

  bookedSeats: number
  heldSeats: number

  status: BulkUpdatePreviewStatus
  reason?: string
}

type InventoryView =
  | "UPCOMING"
  | "PAST"
  | "ALL"

type TripInventoryManagerProps = {
  initialInventory: TripInventoryRow[]
  schedules: ScheduleOption[]
}

const emptyBulkUpdateForm: BulkUpdateForm = {
  scheduleId: "",
  startDate: "",
  endDate: "",

  applySeatCapacity: false,
  seatCapacity: "",

  applyAdultPrice: false,
  adultPrice: "",

  applyChildPrice: false,
  childPrice: "",

  applyInfantPrice: false,
  infantPrice: "",

  applyCurrency: false,
  currency: "IDR",

  applySalesStatus: false,
  salesStatus: "OPEN",

  applyIsActive: false,
  isActive: true,

  applyNotes: false,
  notes: "",
}

const emptyBulkForm: BulkInventoryForm = {
  scheduleId: "",
  startDate: "",
  endDate: "",

  seatCapacity: "",

  adultPrice: "",
  childPrice: "0",
  infantPrice: "0",

  currency: "IDR",
  salesStatus: "OPEN",
  isActive: true,

  notes: "",
}

const emptyForm: InventoryForm = {
  scheduleId: "",
  travelDate: "",
  seatCapacity: "",

  adultPrice: "",
  childPrice: "0",
  infantPrice: "0",

  currency: "IDR",
  salesStatus: "OPEN",
  isActive: true,
  notes: "",
}

function inventoryToForm(
  inventory: TripInventoryRow
): InventoryForm {
  return {
    scheduleId: inventory.scheduleId,

    travelDate: inventory.travelDate,

    seatCapacity: String(
      inventory.seatCapacity
    ),

    adultPrice: String(
      inventory.adultPrice
    ),

    childPrice: String(
      inventory.childPrice
    ),

    infantPrice: String(
      inventory.infantPrice
    ),

    currency: inventory.currency,

    salesStatus:
      inventory.salesStatus === "SOLD_OUT"
        ? "OPEN"
        : inventory.salesStatus,

    isActive: inventory.isActive,

    notes: inventory.notes || "",
  }
}

function sortInventory(
  inventory: TripInventoryRow[]
): TripInventoryRow[] {
  return [...inventory].sort(
    (firstItem, secondItem) => {
      const dateComparison =
        firstItem.travelDate.localeCompare(
          secondItem.travelDate
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return firstItem.departureTime.localeCompare(
        secondItem.departureTime
      )
    }
  )
}

function getCurrentBaliDate(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Makassar",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    )

  const values: Record<
    string,
    string
  > = {}

  for (
    const part of
    formatter.formatToParts(
      new Date()
    )
  ) {
    values[part.type] =
      part.value
  }

  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  )
}

function isPastInventory(
  item: TripInventoryRow,
  baliToday: string
): boolean {
  const travelDate =
    item.travelDate.trim()

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      travelDate
    )
  ) {
    return false
  }

  return travelDate < baliToday
}

function formatMoney(
  value: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(value)
  } catch {
    return `${currency} ${value.toLocaleString(
      "id-ID"
    )}`
  }
}

function getStatusClass(
  salesStatus: string
): string {
  switch (salesStatus) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-700"

    case "CLOSED":
      return "bg-amber-100 text-amber-700"

    case "SOLD_OUT":
      return "bg-red-100 text-red-700"

    case "CANCELLED":
      return "bg-rose-100 text-rose-700"

    default:
      return "bg-slate-200 text-slate-700"
  }
}

function getInventoryRowClass(
  item: TripInventoryRow
): string {
  if (!item.isActive) {
    return "bg-slate-100 opacity-80"
  }

  if (item.salesStatus === "CANCELLED") {
    return "bg-rose-50"
  }

  if (item.salesStatus === "CLOSED") {
    return "bg-amber-50"
  }

  if (
    item.salesStatus === "SOLD_OUT" ||
    item.availableSeats <= 0
  ) {
    return "bg-red-50"
  }

  if (item.availableSeats <= 5) {
    return "bg-amber-50"
  }

  return "bg-slate-50"
}

function getAvailabilityClass(
  item: TripInventoryRow
): string {
  if (!item.isActive) {
    return "bg-slate-200 text-slate-700"
  }

  if (
    item.salesStatus === "SOLD_OUT" ||
    item.availableSeats <= 0
  ) {
    return "bg-red-100 text-red-700"
  }

  if (item.availableSeats <= 5) {
    return "bg-amber-100 text-amber-800"
  }

  return "bg-emerald-100 text-emerald-700"
}

function getAvailabilityLabel(
  item: TripInventoryRow
): string {
  if (!item.isActive) {
    return "Inactive"
  }

  if (
    item.salesStatus === "SOLD_OUT" ||
    item.availableSeats <= 0
  ) {
    return "Sold out"
  }

  if (item.availableSeats <= 5) {
    return "Low seats"
  }

  return "Available"
}

const BULK_MAX_DATES = 90

const WEEKDAY_CODES = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const

function parseDateOnly(
  value: string
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(
    Date.UTC(year, month - 1, day)
  )

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function formatDateOnly(
  date: Date
): string {
  const year = String(
    date.getUTCFullYear()
  )

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function buildBulkDateRange(
  startDate: string,
  endDate: string
):
  | {
      success: true
      dates: string[]
    }
  | {
      success: false
      error: string
    } {
  const start = parseDateOnly(startDate)
  const end = parseDateOnly(endDate)

  if (!start || !end) {
    return {
      success: false,
      error:
        "Start date dan end date wajib menggunakan tanggal yang valid.",
    }
  }

  if (end.getTime() < start.getTime()) {
    return {
      success: false,
      error:
        "End date tidak boleh lebih awal dari start date.",
    }
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000

  const dateCount =
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay
    ) + 1

  if (dateCount > BULK_MAX_DATES) {
    return {
      success: false,
      error:
        `Bulk inventory maksimal ${BULK_MAX_DATES} tanggal dalam satu proses.`,
    }
  }

  const dates: string[] = []

  for (
    let offset = 0;
    offset < dateCount;
    offset += 1
  ) {
    const date = new Date(
      start.getTime() +
        offset * millisecondsPerDay
    )

    dates.push(formatDateOnly(date))
  }

  return {
    success: true,
    dates,
  }
}

function getWeekdayCode(
  travelDate: string
): string {
  const date = parseDateOnly(travelDate)

  if (!date) {
    return ""
  }

  return WEEKDAY_CODES[
    date.getUTCDay()
  ]
}

export default function TripInventoryManager({
  initialInventory,
  schedules,
}: TripInventoryManagerProps) {
  const [inventory, setInventory] =
    useState(initialInventory)

  const [form, setForm] =
    useState<InventoryForm>(
      emptyForm
    )

  const [search, setSearch] =
    useState("")

  const [
    inventoryView,
    setInventoryView,
  ] = useState<InventoryView>(
    "UPCOMING"
  )

  const baliToday =
    getCurrentBaliDate()

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  const [bulkForm, setBulkForm] =
    useState<BulkInventoryForm>(
      emptyBulkForm
    )

  const [
    bulkPreview,
    setBulkPreview,
  ] = useState<BulkPreviewRow[]>([])

  const [
    bulkPreviewError,
    setBulkPreviewError,
  ] = useState("")

  const [
    isBulkPreviewLoading,
    setIsBulkPreviewLoading,
  ] = useState(false)

  const [
    bulkUpdateForm,
    setBulkUpdateForm,
  ] = useState<BulkUpdateForm>(
    emptyBulkUpdateForm
  )

  const [
    bulkUpdatePreview,
    setBulkUpdatePreview,
  ] = useState<BulkUpdatePreviewRow[]>([])

  const [
    bulkUpdatePreviewError,
    setBulkUpdatePreviewError,
  ] = useState("")

  const [
    isBulkUpdatePreviewLoading,
    setIsBulkUpdatePreviewLoading,
  ] = useState(false)


  const [
    bulkUpdateResults,
    setBulkUpdateResults,
  ] = useState<BulkUpdateExecutionRow[]>([])

  const [
    isBulkUpdating,
    setIsBulkUpdating,
  ] = useState(false)

  const [
    bulkCreateResults,
    setBulkCreateResults,
  ] = useState<BulkCreateExecutionRow[]>([])

  const [
    isBulkCreating,
    setIsBulkCreating,
  ] = useState(false)

  const selectedSchedule =
    useMemo(
      () =>
        schedules.find(
          (schedule) =>
            schedule.$id ===
            form.scheduleId
        ),
      [schedules, form.scheduleId]
    )

  const selectedBulkSchedule =
    useMemo(
      () =>
        schedules.find(
          (item) =>
            item.$id ===
            bulkForm.scheduleId
        ) ?? null,
      [
        schedules,
        bulkForm.scheduleId,
      ]
    )

  const selectedBulkUpdateSchedule =
    useMemo(
      () =>
        schedules.find(
          (item) =>
            item.$id ===
            bulkUpdateForm.scheduleId
        ) ?? null,
      [
        schedules,
        bulkUpdateForm.scheduleId,
      ]
    )

  const upcomingInventory =
    useMemo(
      () =>
        inventory.filter(
          (item) =>
            !isPastInventory(
              item,
              baliToday
            )
        ),
      [inventory, baliToday]
    )

  const pastInventory =
    useMemo(
      () =>
        inventory.filter(
          (item) =>
            isPastInventory(
              item,
              baliToday
            )
        ),
      [inventory, baliToday]
    )

  const inventoryForView =
    useMemo(() => {
      if (inventoryView === "PAST") {
        return pastInventory
      }

      if (inventoryView === "ALL") {
        return inventory
      }

      return upcomingInventory
    }, [
      inventory,
      inventoryView,
      pastInventory,
      upcomingInventory,
    ])

  const filteredInventory =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase()

      if (!keyword) {
        return inventoryForView
      }

      return inventoryForView.filter(
        (item) => {
          const searchableText = [
            item.inventoryCode,
            item.scheduleCode,
            item.operatorName,
            item.vesselName,
            item.routeCode,
            item.fromPort,
            item.toPort,
            item.travelDate,
            item.departureTime,
            item.salesStatus,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return searchableText.includes(
            keyword
          )
        }
      )
    }, [inventoryForView, search])

  const openCount =
    upcomingInventory.filter(
      (item) =>
        item.isActive &&
        item.salesStatus === "OPEN"
    ).length

  const soldOutCount =
    upcomingInventory.filter(
      (item) =>
        item.salesStatus ===
        "SOLD_OUT"
    ).length

  const availableSeatTotal =
    upcomingInventory.reduce(
      (total, item) => {
        if (
          !item.isActive ||
          item.salesStatus !== "OPEN"
        ) {
          return total
        }

        return (
          total +
          item.availableSeats
        )
      },
      0
    )

  const bulkPreviewSummary =
    useMemo(
      () => ({
        total: bulkPreview.length,

        create: bulkPreview.filter(
          (row) =>
            row.status === "CREATE"
        ).length,

        exists: bulkPreview.filter(
          (row) =>
            row.status === "EXISTS"
        ).length,

        nonOperating:
          bulkPreview.filter(
            (row) =>
              row.status ===
              "NON_OPERATING_DAY"
          ).length,
      }),
      [bulkPreview]
    )

  const bulkUpdatePreviewSummary =
    useMemo(
      () => ({
        total: bulkUpdatePreview.length,

        update: bulkUpdatePreview.filter(
          (row) =>
            row.status === "UPDATE"
        ).length,

        missing: bulkUpdatePreview.filter(
          (row) =>
            row.status === "MISSING"
        ).length,

        blocked: bulkUpdatePreview.filter(
          (row) =>
            row.status === "BLOCKED"
        ).length,

        nonOperating:
          bulkUpdatePreview.filter(
            (row) =>
              row.status ===
              "NON_OPERATING_DAY"
          ).length,
      }),
      [bulkUpdatePreview]
    )

  const bulkCreateResultSummary =
    useMemo(
      () => ({
        created:
          bulkCreateResults.filter(
            (row) =>
              row.status === "CREATED"
          ).length,

        skipped:
          bulkCreateResults.filter(
            (row) =>
              row.status === "SKIPPED"
          ).length,

        failed:
          bulkCreateResults.filter(
            (row) =>
              row.status === "FAILED"
          ).length,
      }),
      [bulkCreateResults]
    )

  const bulkUpdateResultSummary =
    useMemo(
      () => ({
        updated:
          bulkUpdateResults.filter(
            (row) =>
              row.status === "UPDATED"
          ).length,

        skipped:
          bulkUpdateResults.filter(
            (row) =>
              row.status === "SKIPPED"
          ).length,

        failed:
          bulkUpdateResults.filter(
            (row) =>
              row.status === "FAILED"
          ).length,
      }),
      [bulkUpdateResults]
    )

  const isInventoryFormStarted = Boolean(
    editingId ||
      form.scheduleId ||
      form.travelDate ||
      form.seatCapacity ||
      form.adultPrice
  )

  const seatCapacityValue = Number(
    form.seatCapacity
  )

  const hasSeatCapacityInput =
    form.seatCapacity.trim() !== ""

  const formWarnings: string[] = []

  if (
    isInventoryFormStarted &&
    !hasSeatCapacityInput
  ) {
    formWarnings.push(
      "Seat capacity wajib diisi sesuai alokasi kursi dari vendor."
    )
  }

  if (
    hasSeatCapacityInput &&
    Number.isInteger(seatCapacityValue)
  ) {
    if (
      seatCapacityValue === 0 &&
      form.salesStatus === "OPEN"
    ) {
      formWarnings.push(
        "Kursi 0 tetapi sales status masih OPEN. Gunakan SOLD_OUT atau CLOSED agar jadwal tidak dijual."
      )
    }

    if (
      seatCapacityValue > 0 &&
      form.salesStatus === "SOLD_OUT"
    ) {
      formWarnings.push(
        "Status SOLD_OUT tetapi seat capacity masih lebih dari 0. Pastikan kursi memang sudah habis."
      )
    }

    if (
      selectedSchedule &&
      seatCapacityValue >
        selectedSchedule.vesselActiveCapacity
    ) {
      formWarnings.push(
        `Seat capacity melebihi alokasi kapal (${selectedSchedule.vesselActiveCapacity} seats).`
      )
    }
  }

  if (
    form.salesStatus === "OPEN" &&
    !form.isActive
  ) {
    formWarnings.push(
      "Sales status OPEN tidak akan tampil di pencarian jika Trip inventory is active tidak dicentang."
    )
  }

  function clearBulkPreview() {
    setBulkPreview([])
    setBulkPreviewError("")
    setBulkCreateResults([])
  }

  function updateBulkField<
    Key extends keyof BulkInventoryForm,
  >(
    key: Key,
    value: BulkInventoryForm[Key]
  ) {
    setBulkForm((current) => ({
      ...current,
      [key]: value,
    }))

    clearBulkPreview()
  }

  function handleBulkScheduleChange(
    scheduleId: string
  ) {
    const schedule = schedules.find(
      (item) => item.$id === scheduleId
    )

    setBulkForm((current) => ({
      ...current,

      scheduleId,

      seatCapacity:
        schedule &&
        !current.seatCapacity
          ? String(
              schedule.vesselActiveCapacity
            )
          : current.seatCapacity,
    }))

    clearBulkPreview()
  }

  async function handleBulkPreview() {
    clearBulkPreview()

    if (!selectedBulkSchedule) {
      setBulkPreviewError(
        "Pilih trip schedule terlebih dahulu."
      )
      return
    }

    const seatCapacity = Number(
      bulkForm.seatCapacity
    )

    const adultPrice = Number(
      bulkForm.adultPrice
    )

    const childPrice = Number(
      bulkForm.childPrice
    )

    const infantPrice = Number(
      bulkForm.infantPrice
    )

    const numericFields = [
      {
        value: bulkForm.seatCapacity,
        numericValue: seatCapacity,
        label: "Seat capacity",
        maximum: 1000,
      },
      {
        value: bulkForm.adultPrice,
        numericValue: adultPrice,
        label: "Adult price",
        maximum: 1000000000,
      },
      {
        value: bulkForm.childPrice,
        numericValue: childPrice,
        label: "Child price",
        maximum: 1000000000,
      },
      {
        value: bulkForm.infantPrice,
        numericValue: infantPrice,
        label: "Infant price",
        maximum: 1000000000,
      },
    ]

    for (const field of numericFields) {
      if (
        field.value.trim() === "" ||
        !Number.isInteger(
          field.numericValue
        ) ||
        field.numericValue < 0 ||
        field.numericValue >
          field.maximum
      ) {
        setBulkPreviewError(
          `${field.label} harus berupa angka bulat valid antara 0 dan ${field.maximum}.`
        )
        return
      }
    }

    if (
      seatCapacity >
      selectedBulkSchedule
        .vesselActiveCapacity
    ) {
      setBulkPreviewError(
        `Seat capacity tidak boleh melebihi alokasi kapal (${selectedBulkSchedule.vesselActiveCapacity} seats).`
      )
      return
    }

    if (
      bulkForm.isActive &&
      bulkForm.salesStatus === "OPEN" &&
      seatCapacity < 1
    ) {
      setBulkPreviewError(
        "OPEN inventory harus memiliki minimal satu seat capacity."
      )
      return
    }

    if (
      !/^[A-Za-z]{3}$/.test(
        bulkForm.currency.trim()
      )
    ) {
      setBulkPreviewError(
        "Currency harus berisi tepat tiga huruf, misalnya IDR."
      )
      return
    }

    if (
      ![
        "OPEN",
        "CLOSED",
        "CANCELLED",
      ].includes(
        bulkForm.salesStatus
          .trim()
          .toUpperCase()
      )
    ) {
      setBulkPreviewError(
        "Sales status harus OPEN, CLOSED, atau CANCELLED."
      )
      return
    }

    if (bulkForm.notes.length > 1000) {
      setBulkPreviewError(
        "Notes tidak boleh lebih dari 1000 karakter."
      )
      return
    }

    const dateRange =
      buildBulkDateRange(
        bulkForm.startDate,
        bulkForm.endDate
      )

    if (!dateRange.success) {
      setBulkPreviewError(
        dateRange.error
      )
      return
    }

    const operatingDays =
      new Set(
        selectedBulkSchedule
          .operatingDays
          .split(",")
          .map((day) =>
            day.trim().toUpperCase()
          )
          .filter(Boolean)
      )

    const scheduleCode =
      selectedBulkSchedule
        .scheduleCode
        .trim()
        .toUpperCase()

    const baseRows:
      BulkPreviewRow[] =
      dateRange.dates.map(
        (travelDate) => {
          const weekdayCode =
            getWeekdayCode(
              travelDate
            )

          const inventoryCode =
            `${scheduleCode}-${travelDate.replaceAll(
              "-",
              ""
            )}`

          return {
            travelDate,
            weekdayCode,
            inventoryCode,
            status:
              operatingDays.has(
                weekdayCode
              )
                ? "CREATE"
                : "NON_OPERATING_DAY",
          }
        }
      )

    const operatingRows =
      baseRows.filter(
        (row) =>
          row.status === "CREATE"
      )

    if (operatingRows.length === 0) {
      setBulkPreview(baseRows)
      return
    }

    const searchParams =
      new URLSearchParams()

    for (const row of operatingRows) {
      searchParams.append(
        "inventoryCode",
        row.inventoryCode
      )
    }

    setIsBulkPreviewLoading(true)

    try {
      const response = await fetch(
        `/api/admin/trip-inventory?${searchParams.toString()}`,
        {
          cache: "no-store",
        }
      )

      const result =
        (await response.json()) as
          BulkPreflightResponse

      if (
        !response.ok ||
        result.success !== true
      ) {
        throw new Error(
          result.error ||
            "Bulk inventory preview could not be loaded."
        )
      }

      const existingInventoryCodes =
        new Set(
          (result.inventory ?? []).map(
            (item) =>
              item.inventoryCode
                .trim()
                .toUpperCase()
          )
        )

      setBulkPreview(
        baseRows.map((row) => {
          if (
            row.status ===
            "NON_OPERATING_DAY"
          ) {
            return row
          }

          return {
            ...row,
            status:
              existingInventoryCodes.has(
                row.inventoryCode
              )
                ? "EXISTS"
                : "CREATE",
          }
        })
      )
    } catch (previewError) {
      setBulkPreviewError(
        previewError instanceof Error
          ? previewError.message
          : "Bulk inventory preview could not be loaded."
      )
    } finally {
      setIsBulkPreviewLoading(false)
    }
  }

  async function handleBulkCreate() {
    setBulkPreviewError("")
    setBulkCreateResults([])

    if (!selectedBulkSchedule) {
      setBulkPreviewError(
        "Pilih trip schedule terlebih dahulu."
      )
      return
    }

    const rowsToCreate =
      bulkPreview.filter(
        (row) =>
          row.status === "CREATE"
      )

    if (rowsToCreate.length === 0) {
      setBulkPreviewError(
        "Tidak ada inventory baru berstatus CREATE untuk diproses."
      )
      return
    }

    const confirmed = window.confirm(
      `Create ${rowsToCreate.length} new inventories? Existing and non-operating dates will remain untouched.`
    )

    if (!confirmed) {
      return
    }

    const seatCapacity = Number(
      bulkForm.seatCapacity
    )

    const adultPrice = Number(
      bulkForm.adultPrice
    )

    const childPrice = Number(
      bulkForm.childPrice
    )

    const infantPrice = Number(
      bulkForm.infantPrice
    )

    const executionResults:
      BulkCreateExecutionRow[] = []

    const createdInventories:
      TripInventoryRow[] = []

    setIsBulkCreating(true)

    try {
      for (const row of rowsToCreate) {
        try {
          const response = await fetch(
            "/api/admin/trip-inventory",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                scheduleId:
                  bulkForm.scheduleId,

                travelDate:
                  row.travelDate,

                seatCapacity,

                adultPrice,
                childPrice,
                infantPrice,

                currency:
                  bulkForm.currency
                    .trim()
                    .toUpperCase(),

                salesStatus:
                  bulkForm.salesStatus,

                isActive:
                  bulkForm.isActive,

                notes:
                  bulkForm.notes,
              }),
            }
          )

          const result =
            (await response.json()) as
              ApiResponse

          if (response.status === 409) {
            executionResults.push({
              travelDate:
                row.travelDate,
              inventoryCode:
                row.inventoryCode,
              status: "SKIPPED",
              message:
                result.error ||
                "Inventory already exists.",
            })

            continue
          }

          if (
            !response.ok ||
            !result.inventory
          ) {
            executionResults.push({
              travelDate:
                row.travelDate,
              inventoryCode:
                row.inventoryCode,
              status: "FAILED",
              message:
                result.error ||
                "Inventory could not be created.",
            })

            continue
          }

          createdInventories.push(
            result.inventory
          )

          executionResults.push({
            travelDate:
              row.travelDate,
            inventoryCode:
              row.inventoryCode,
            status: "CREATED",
          })
        } catch (rowError) {
          executionResults.push({
            travelDate:
              row.travelDate,
            inventoryCode:
              row.inventoryCode,
            status: "FAILED",
            message:
              rowError instanceof Error
                ? rowError.message
                : "Inventory could not be created.",
          })
        }
      }

      if (
        createdInventories.length > 0
      ) {
        setInventory((current) => {
          const existingIds =
            new Set(
              current.map(
                (item) => item.$id
              )
            )

          const newRows =
            createdInventories.filter(
              (item) =>
                !existingIds.has(
                  item.$id
                )
            )

          return sortInventory([
            ...current,
            ...newRows,
          ])
        })
      }

      const completedCodes =
        new Set(
          executionResults
            .filter(
              (row) =>
                row.status ===
                  "CREATED" ||
                row.status ===
                  "SKIPPED"
            )
            .map(
              (row) =>
                row.inventoryCode
            )
        )

      setBulkPreview((current) =>
        current.map((row) => {
          if (
            row.status === "CREATE" &&
            completedCodes.has(
              row.inventoryCode
            )
          ) {
            return {
              ...row,
              status: "EXISTS",
            }
          }

          return row
        })
      )

      setBulkCreateResults(
        executionResults
      )
    } finally {
      setIsBulkCreating(false)
    }
  }

  function clearBulkUpdatePreview() {
    setBulkUpdatePreview([])
    setBulkUpdatePreviewError("")
    setBulkUpdateResults([])
  }

  function updateBulkUpdateField<
    Key extends keyof BulkUpdateForm,
  >(
    key: Key,
    value: BulkUpdateForm[Key]
  ) {
    setBulkUpdateForm((current) => ({
      ...current,
      [key]: value,
    }))

    clearBulkUpdatePreview()
  }

  function handleBulkUpdateScheduleChange(
    scheduleId: string
  ) {
    updateBulkUpdateField(
      "scheduleId",
      scheduleId
    )
  }

  async function handleBulkUpdatePreview() {
    clearBulkUpdatePreview()

    if (!selectedBulkUpdateSchedule) {
      setBulkUpdatePreviewError(
        "Pilih trip schedule terlebih dahulu."
      )
      return
    }

    const selectedFieldCount = [
      bulkUpdateForm.applySeatCapacity,
      bulkUpdateForm.applyAdultPrice,
      bulkUpdateForm.applyChildPrice,
      bulkUpdateForm.applyInfantPrice,
      bulkUpdateForm.applyCurrency,
      bulkUpdateForm.applySalesStatus,
      bulkUpdateForm.applyIsActive,
      bulkUpdateForm.applyNotes,
    ].filter(Boolean).length

    if (selectedFieldCount === 0) {
      setBulkUpdatePreviewError(
        "Pilih minimal satu field yang ingin di-update."
      )
      return
    }

    const dateRange =
      buildBulkDateRange(
        bulkUpdateForm.startDate,
        bulkUpdateForm.endDate
      )

    if (!dateRange.success) {
      setBulkUpdatePreviewError(
        dateRange.error
      )
      return
    }

    const numericFields = [
      {
        enabled:
          bulkUpdateForm.applySeatCapacity,
        value:
          bulkUpdateForm.seatCapacity,
        label: "Seat capacity",
        maximum: 1000,
      },
      {
        enabled:
          bulkUpdateForm.applyAdultPrice,
        value:
          bulkUpdateForm.adultPrice,
        label: "Adult price",
        maximum: 1000000000,
      },
      {
        enabled:
          bulkUpdateForm.applyChildPrice,
        value:
          bulkUpdateForm.childPrice,
        label: "Child price",
        maximum: 1000000000,
      },
      {
        enabled:
          bulkUpdateForm.applyInfantPrice,
        value:
          bulkUpdateForm.infantPrice,
        label: "Infant price",
        maximum: 1000000000,
      },
    ]

    for (const field of numericFields) {
      if (!field.enabled) {
        continue
      }

      const value = Number(field.value)

      if (
        field.value.trim() === "" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > field.maximum
      ) {
        setBulkUpdatePreviewError(
          `${field.label} harus berupa angka bulat valid antara 0 dan ${field.maximum}.`
        )
        return
      }
    }

    if (
      bulkUpdateForm.applySeatCapacity &&
      Number(
        bulkUpdateForm.seatCapacity
      ) >
        selectedBulkUpdateSchedule
          .vesselActiveCapacity
    ) {
      setBulkUpdatePreviewError(
        `Seat capacity tidak boleh melebihi alokasi kapal (${selectedBulkUpdateSchedule.vesselActiveCapacity} seats).`
      )
      return
    }

    if (
      bulkUpdateForm.applyCurrency &&
      !/^[A-Za-z]{3}$/.test(
        bulkUpdateForm.currency.trim()
      )
    ) {
      setBulkUpdatePreviewError(
        "Currency harus berisi tepat tiga huruf, misalnya IDR."
      )
      return
    }

    if (
      bulkUpdateForm.applySalesStatus &&
      ![
        "OPEN",
        "CLOSED",
        "CANCELLED",
      ].includes(
        bulkUpdateForm.salesStatus
          .trim()
          .toUpperCase()
      )
    ) {
      setBulkUpdatePreviewError(
        "Sales status harus OPEN, CLOSED, atau CANCELLED."
      )
      return
    }

    if (
      bulkUpdateForm.applyNotes &&
      bulkUpdateForm.notes.length > 1000
    ) {
      setBulkUpdatePreviewError(
        "Notes tidak boleh lebih dari 1000 karakter."
      )
      return
    }

    const operatingDays =
      new Set(
        selectedBulkUpdateSchedule
          .operatingDays
          .split(",")
          .map((day) =>
            day.trim().toUpperCase()
          )
          .filter(Boolean)
      )

    const scheduleCode =
      selectedBulkUpdateSchedule
        .scheduleCode
        .trim()
        .toUpperCase()

    const baseRows =
      dateRange.dates.map(
        (travelDate) => {
          const weekdayCode =
            getWeekdayCode(
              travelDate
            )

          return {
            travelDate,
            weekdayCode,
            inventoryCode:
              `${scheduleCode}-${travelDate.replaceAll(
                "-",
                ""
              )}`,
          }
        }
      )

    const operatingRows =
      baseRows.filter(
        (row) =>
          operatingDays.has(
            row.weekdayCode
          )
      )

    if (operatingRows.length === 0) {
      setBulkUpdatePreview(
        baseRows.map((row) => ({
          ...row,
          inventoryId: null,
          bookedSeats: 0,
          heldSeats: 0,
          status:
            "NON_OPERATING_DAY",
        }))
      )
      return
    }

    const searchParams =
      new URLSearchParams()

    for (const row of operatingRows) {
      searchParams.append(
        "inventoryCode",
        row.inventoryCode
      )
    }

    setIsBulkUpdatePreviewLoading(true)

    try {
      const response = await fetch(
        `/api/admin/trip-inventory?${searchParams.toString()}`,
        {
          cache: "no-store",
        }
      )

      const result =
        (await response.json()) as
          BulkPreflightResponse

      if (
        !response.ok ||
        result.success !== true
      ) {
        throw new Error(
          result.error ||
            "Bulk update preview could not be loaded."
        )
      }

      const existingByCode =
        new Map(
          (result.inventory ?? []).map(
            (item) => [
              item.inventoryCode
                .trim()
                .toUpperCase(),
              item,
            ]
          )
        )

      const requestedSeatCapacity =
        bulkUpdateForm.applySeatCapacity
          ? Number(
              bulkUpdateForm.seatCapacity
            )
          : null

      setBulkUpdatePreview(
        baseRows.map((row) => {
          if (
            !operatingDays.has(
              row.weekdayCode
            )
          ) {
            return {
              ...row,
              inventoryId: null,
              bookedSeats: 0,
              heldSeats: 0,
              status:
                "NON_OPERATING_DAY",
            }
          }

          const existing =
            existingByCode.get(
              row.inventoryCode
            )

          if (!existing) {
            return {
              ...row,
              inventoryId: null,
              bookedSeats: 0,
              heldSeats: 0,
              status: "MISSING",
            }
          }

          const committedSeats =
            existing.bookedSeats +
            existing.heldSeats

          if (
            requestedSeatCapacity !==
              null &&
            requestedSeatCapacity <
              committedSeats
          ) {
            return {
              ...row,
              inventoryId:
                existing.$id,
              bookedSeats:
                existing.bookedSeats,
              heldSeats:
                existing.heldSeats,
              status: "BLOCKED",
              reason:
                `Seat capacity tidak boleh lebih kecil dari ${committedSeats} booked/held seats.`,
            }
          }

          return {
            ...row,
            inventoryId: existing.$id,
            bookedSeats:
              existing.bookedSeats,
            heldSeats:
              existing.heldSeats,
            status: "UPDATE",
          }
        })
      )
    } catch (previewError) {
      setBulkUpdatePreviewError(
        previewError instanceof Error
          ? previewError.message
          : "Bulk update preview could not be loaded."
      )
    } finally {
      setIsBulkUpdatePreviewLoading(
        false
      )
    }
  }

  async function handleBulkUpdateApply() {
    setBulkUpdatePreviewError("")
    setBulkUpdateResults([])

    const rowsToUpdate =
      bulkUpdatePreview.filter(
        (row) =>
          row.status === "UPDATE" &&
          Boolean(row.inventoryId)
      )

    if (rowsToUpdate.length === 0) {
      setBulkUpdatePreviewError(
        "Tidak ada existing inventory berstatus UPDATE."
      )
      return
    }

    const confirmed = window.confirm(
      `Update ${rowsToUpdate.length} existing inventories? Only selected fields will be changed.`
    )

    if (!confirmed) {
      return
    }

    const payload: Record<
      string,
      string | number | boolean | null
    > = {}

    if (
      bulkUpdateForm.applySeatCapacity
    ) {
      payload.seatCapacity = Number(
        bulkUpdateForm.seatCapacity
      )
    }

    if (
      bulkUpdateForm.applyAdultPrice
    ) {
      payload.adultPrice = Number(
        bulkUpdateForm.adultPrice
      )
    }

    if (
      bulkUpdateForm.applyChildPrice
    ) {
      payload.childPrice = Number(
        bulkUpdateForm.childPrice
      )
    }

    if (
      bulkUpdateForm.applyInfantPrice
    ) {
      payload.infantPrice = Number(
        bulkUpdateForm.infantPrice
      )
    }

    if (
      bulkUpdateForm.applyCurrency
    ) {
      payload.currency =
        bulkUpdateForm.currency
          .trim()
          .toUpperCase()
    }

    if (
      bulkUpdateForm.applySalesStatus
    ) {
      payload.salesStatus =
        bulkUpdateForm.salesStatus
    }

    if (
      bulkUpdateForm.applyIsActive
    ) {
      payload.isActive =
        bulkUpdateForm.isActive
    }

    if (
      bulkUpdateForm.applyNotes
    ) {
      payload.notes =
        bulkUpdateForm.notes
    }

    if (
      Object.keys(payload).length === 0
    ) {
      setBulkUpdatePreviewError(
        "Pilih minimal satu field yang ingin di-update."
      )
      return
    }

    const executionResults:
      BulkUpdateExecutionRow[] = []

    const updatedInventories:
      TripInventoryRow[] = []

    setIsBulkUpdating(true)

    try {
      for (const row of rowsToUpdate) {
        if (!row.inventoryId) {
          executionResults.push({
            travelDate:
              row.travelDate,
            inventoryCode:
              row.inventoryCode,
            status: "SKIPPED",
            message:
              "Inventory ID tidak tersedia.",
          })

          continue
        }

        try {
          const response = await fetch(
            `/api/admin/trip-inventory/${row.inventoryId}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(payload),
            }
          )

          const result =
            (await response.json()) as
              ApiResponse

          if (
            !response.ok ||
            !result.inventory
          ) {
            executionResults.push({
              travelDate:
                row.travelDate,
              inventoryCode:
                row.inventoryCode,
              status: "FAILED",
              message:
                result.error ||
                "Inventory could not be updated.",
            })

            continue
          }

          updatedInventories.push(
            result.inventory
          )

          executionResults.push({
            travelDate:
              row.travelDate,
            inventoryCode:
              row.inventoryCode,
            status: "UPDATED",
          })
        } catch (rowError) {
          executionResults.push({
            travelDate:
              row.travelDate,
            inventoryCode:
              row.inventoryCode,
            status: "FAILED",
            message:
              rowError instanceof Error
                ? rowError.message
                : "Inventory could not be updated.",
          })
        }
      }

      if (
        updatedInventories.length > 0
      ) {
        const updatedById =
          new Map(
            updatedInventories.map(
              (item) => [
                item.$id,
                item,
              ]
            )
          )

        setInventory((current) =>
          sortInventory(
            current.map(
              (item) =>
                updatedById.get(
                  item.$id
                ) ?? item
            )
          )
        )
      }

      setBulkUpdateResults(
        executionResults
      )
    } finally {
      setIsBulkUpdating(false)
    }
  }

  function updateField<
    Key extends keyof InventoryForm,
  >(
    key: Key,
    value: InventoryForm[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleScheduleChange(
    scheduleId: string
  ) {
    const schedule = schedules.find(
      (item) => item.$id === scheduleId
    )

    setForm((current) => ({
      ...current,

      scheduleId,

      seatCapacity:
        schedule &&
        !current.seatCapacity
          ? String(
              schedule.vesselActiveCapacity
            )
          : current.seatCapacity,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
  }

  function startEdit(
    item: TripInventoryRow
  ) {
    setEditingId(item.$id)
    setForm(inventoryToForm(item))
    setMessage("")
    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage("")
    setError("")

    const seatCapacity = Number(
      form.seatCapacity
    )

    const adultPrice = Number(
      form.adultPrice
    )

    const childPrice = Number(
      form.childPrice
    )

    const infantPrice = Number(
      form.infantPrice
    )

    const integerValues = [
      seatCapacity,
      adultPrice,
      childPrice,
      infantPrice,
    ]

    if (
      integerValues.some(
        (value) =>
          !Number.isInteger(value) ||
          value < 0
      )
    ) {
      setError(
        "Capacity and prices must contain valid non-negative integers."
      )
      return
    }

    if (
      selectedSchedule &&
      seatCapacity >
        selectedSchedule
          .vesselActiveCapacity
    ) {
      setError(
        `Seat capacity cannot exceed ${selectedSchedule.vesselActiveCapacity} seats.`
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint = editingId
        ? `/api/admin/trip-inventory/${editingId}`
        : "/api/admin/trip-inventory"

      const response = await fetch(
        endpoint,
        {
          method: editingId
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,
            seatCapacity,
            adultPrice,
            childPrice,
            infantPrice,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.inventory
      ) {
        throw new Error(
          result.error ||
            "Trip inventory could not be saved."
        )
      }

      if (editingId) {
        setInventory((current) =>
          sortInventory(
            current.map((item) =>
              item.$id === editingId
                ? result.inventory!
                : item
            )
          )
        )

        setMessage(
          "Trip inventory updated successfully."
        )
      } else {
        setInventory((current) =>
          sortInventory([
            ...current,
            result.inventory!,
          ])
        )

        setMessage(
          "Trip inventory created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Trip inventory could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    item: TripInventoryRow
  ) {
    setUpdatingId(item.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/trip-inventory/${item.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (
        !response.ok ||
        !result.inventory
      ) {
        throw new Error(
          result.error ||
            "Inventory status could not be updated."
        )
      }

      setInventory((current) =>
        current.map((currentItem) =>
          currentItem.$id === item.$id
            ? result.inventory!
            : currentItem
        )
      )

      setMessage(
        result.inventory.isActive
          ? "Trip inventory activated successfully."
          : "Trip inventory deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Inventory status could not be updated."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Upcoming inventory
          </p>

          <p className="mt-2 text-3xl font-black">
            {upcomingInventory.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Open inventory
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {openCount}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-red-700">
            Sold out
          </p>

          <p className="mt-2 text-3xl font-black text-red-900">
            {soldOutCount}
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-cyan-700">
            Available seats
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {availableSeatTotal}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Bulk inventory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Prepare multiple daily inventories
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Pilih schedule dan rentang tanggal untuk melihat inventory mana yang dapat dibuat. Preview ini tidak membuat atau mengubah data.
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-900 lg:max-w-sm">
            <p className="font-black">
              Safe preview
            </p>

            <p className="mt-1">
              Existing inventory tidak akan ditimpa. Maksimal 90 tanggal dalam satu preview.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Trip schedule *
            </span>

            <select
              value={bulkForm.scheduleId}
              onChange={(event) =>
                handleBulkScheduleChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select schedule
              </option>

              {schedules.map(
                (schedule) => (
                  <option
                    key={schedule.$id}
                    value={schedule.$id}
                  >
                    {schedule.fromPort}
                    {" → "}
                    {schedule.toPort}
                    {" | "}
                    {schedule.departureTime}
                    {" | "}
                    {schedule.scheduleCode}
                    {!schedule.isActive
                      ? " (Inactive)"
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedBulkSchedule && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="font-black">
                {
                  selectedBulkSchedule
                    .operatorName
                }
                {" — "}
                {
                  selectedBulkSchedule
                    .vesselName
                }
              </p>

              <p className="mt-1 text-slate-600">
                {
                  selectedBulkSchedule
                    .fromPort
                }
                {" → "}
                {
                  selectedBulkSchedule
                    .toPort
                }
                {" | "}
                {
                  selectedBulkSchedule
                    .departureTime
                }
              </p>

              <p className="mt-1 text-slate-600">
                Operating days:{" "}
                {
                  selectedBulkSchedule
                    .operatingDays
                }
              </p>

              <p className="mt-1 text-slate-600">
                Vessel allocation:{" "}
                {
                  selectedBulkSchedule
                    .vesselActiveCapacity
                }{" "}
                seats
              </p>

              {!selectedBulkSchedule.isActive && (
                <p className="mt-2 font-bold text-amber-700">
                  Schedule ini inactive. Preview tetap bisa dilakukan, tetapi OPEN inventory akan ditolak server selama schedule belum aktif.
                </p>
              )}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold">
              Start date *
            </span>

            <input
              type="date"
              value={bulkForm.startDate}
              onChange={(event) =>
                updateBulkField(
                  "startDate",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              End date *
            </span>

            <input
              type="date"
              value={bulkForm.endDate}
              onChange={(event) =>
                updateBulkField(
                  "endDate",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>
        </div>

        <div className="mt-7">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
            Bulk create configuration
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Nilai berikut akan dipakai untuk setiap inventory baru yang berstatus CREATE.
          </p>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold">
                Seat capacity *
              </span>

              <input
                type="number"
                min={0}
                max={
                  selectedBulkSchedule
                    ?.vesselActiveCapacity ||
                  1000
                }
                step={1}
                value={
                  bulkForm.seatCapacity
                }
                onChange={(event) =>
                  updateBulkField(
                    "seatCapacity",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Maksimal mengikuti vessel allocation dari schedule.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-bold">
                Adult price *
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={bulkForm.adultPrice}
                onChange={(event) =>
                  updateBulkField(
                    "adultPrice",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">
                Child price *
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={bulkForm.childPrice}
                onChange={(event) =>
                  updateBulkField(
                    "childPrice",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">
                Infant price *
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={bulkForm.infantPrice}
                onChange={(event) =>
                  updateBulkField(
                    "infantPrice",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">
                Currency *
              </span>

              <input
                value={bulkForm.currency}
                onChange={(event) =>
                  updateBulkField(
                    "currency",
                    event.target.value
                      .toUpperCase()
                      .slice(0, 3)
                  )
                }
                minLength={3}
                maxLength={3}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-cyan-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold">
                Sales status *
              </span>

              <select
                value={
                  bulkForm.salesStatus
                }
                onChange={(event) =>
                  updateBulkField(
                    "salesStatus",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
              >
                <option value="OPEN">
                  Open
                </option>

                <option value="CLOSED">
                  Closed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold">
                Notes
              </span>

              <textarea
                rows={3}
                maxLength={1000}
                value={bulkForm.notes}
                onChange={(event) =>
                  updateBulkField(
                    "notes",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
              />
            </label>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={bulkForm.isActive}
                onChange={(event) =>
                  updateBulkField(
                    "isActive",
                    event.target.checked
                  )
                }
                className="h-5 w-5 rounded"
              />

              <span className="text-sm font-bold">
                New inventory is active
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              void handleBulkPreview()
            }
            disabled={isBulkPreviewLoading}
            className="rounded-full bg-cyan-700 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBulkPreviewLoading
              ? "Checking..."
              : "Preview Inventory"}
          </button>

          {bulkPreviewSummary.create > 0 && (
            <button
              type="button"
              onClick={() =>
                void handleBulkCreate()
              }
              disabled={
                isBulkCreating ||
                isBulkPreviewLoading
              }
              className="rounded-full bg-emerald-700 px-7 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBulkCreating
                ? "Creating..."
                : `Create ${bulkPreviewSummary.create} Inventories`}
            </button>
          )}

          <p className="text-xs leading-5 text-slate-500">
            Preview first. Only rows marked CREATE will be submitted.
          </p>
        </div>

        {bulkPreviewError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {bulkPreviewError}
          </div>
        )}

        {bulkPreview.length > 0 && (
          <div className="mt-7 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Dates in range
                </p>

                <p className="mt-1 text-2xl font-black">
                  {bulkPreviewSummary.total}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Will create
                </p>

                <p className="mt-1 text-2xl font-black text-emerald-900">
                  {bulkPreviewSummary.create}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Existing — skip
                </p>

                <p className="mt-1 text-2xl font-black text-amber-900">
                  {bulkPreviewSummary.exists}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Non-operating
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  {
                    bulkPreviewSummary
                      .nonOperating
                  }
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">
                        Date
                      </th>

                      <th className="px-4 py-3">
                        Day
                      </th>

                      <th className="px-4 py-3">
                        Inventory code
                      </th>

                      <th className="px-4 py-3">
                        Preview result
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {bulkPreview.map(
                      (row) => (
                        <tr
                          key={
                            row.inventoryCode
                          }
                          className="bg-white"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold">
                            {row.travelDate}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {
                              row.weekdayCode
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                            {
                              row.inventoryCode
                            }
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={
                                row.status ===
                                "CREATE"
                                  ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800"
                                  : row.status ===
                                      "EXISTS"
                                    ? "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                                    : "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700"
                              }
                            >
                              {row.status ===
                              "CREATE"
                                ? "CREATE"
                                : row.status ===
                                    "EXISTS"
                                  ? "EXISTS — SKIP"
                                  : "NON-OPERATING — SKIP"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
              <p className="font-black">
                Execution safety
              </p>

              <p className="mt-1">
                Hanya row CREATE yang dikirim ke server. Existing dan non-operating dates tidak ditimpa.
              </p>
            </div>

            {bulkCreateResults.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Created
                    </p>

                    <p className="mt-1 text-2xl font-black text-emerald-900">
                      {
                        bulkCreateResultSummary
                          .created
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Server skipped
                    </p>

                    <p className="mt-1 text-2xl font-black text-amber-900">
                      {
                        bulkCreateResultSummary
                          .skipped
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                      Failed
                    </p>

                    <p className="mt-1 text-2xl font-black text-red-900">
                      {
                        bulkCreateResultSummary
                          .failed
                      }
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                        <tr>
                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Inventory code
                          </th>

                          <th className="px-4 py-3">
                            Result
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {bulkCreateResults.map(
                          (row) => (
                            <tr
                              key={
                                row.inventoryCode
                              }
                              className="bg-white"
                            >
                              <td className="whitespace-nowrap px-4 py-3 font-bold">
                                {
                                  row.travelDate
                                }
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                                {
                                  row.inventoryCode
                                }
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={
                                    row.status ===
                                    "CREATED"
                                      ? "font-black text-emerald-700"
                                      : row.status ===
                                          "SKIPPED"
                                        ? "font-black text-amber-700"
                                        : "font-black text-red-700"
                                  }
                                >
                                  {row.status}
                                </span>

                                {row.message && (
                                  <p className="mt-1 text-xs text-slate-600">
                                    {
                                      row.message
                                    }
                                  </p>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
              Bulk update
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Bulk update existing inventory
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Pilih schedule, rentang tanggal, lalu centang hanya field yang ingin diubah. Inventory yang tidak ada akan di-skip.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-900 lg:max-w-sm">
            <p className="font-black">
              Existing inventory only
            </p>

            <p className="mt-1">
              Preview tidak mengubah data. Booked Seats dan Held Seats tidak pernah di-reset.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Trip schedule *
            </span>

            <select
              value={
                bulkUpdateForm.scheduleId
              }
              onChange={(event) =>
                handleBulkUpdateScheduleChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-600"
            >
              <option value="">
                Select schedule
              </option>

              {schedules.map(
                (schedule) => (
                  <option
                    key={schedule.$id}
                    value={schedule.$id}
                  >
                    {schedule.fromPort}
                    {" → "}
                    {schedule.toPort}
                    {" | "}
                    {schedule.departureTime}
                    {" | "}
                    {schedule.scheduleCode}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedBulkUpdateSchedule && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="font-black">
                {
                  selectedBulkUpdateSchedule
                    .operatorName
                }
                {" — "}
                {
                  selectedBulkUpdateSchedule
                    .vesselName
                }
              </p>

              <p className="mt-1 text-slate-600">
                Operating days:{" "}
                {
                  selectedBulkUpdateSchedule
                    .operatingDays
                }
              </p>

              <p className="mt-1 text-slate-600">
                Vessel allocation:{" "}
                {
                  selectedBulkUpdateSchedule
                    .vesselActiveCapacity
                }{" "}
                seats
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold">
              Start date *
            </span>

            <input
              type="date"
              value={
                bulkUpdateForm.startDate
              }
              onChange={(event) =>
                updateBulkUpdateField(
                  "startDate",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              End date *
            </span>

            <input
              type="date"
              value={
                bulkUpdateForm.endDate
              }
              onChange={(event) =>
                updateBulkUpdateField(
                  "endDate",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
            />
          </label>
        </div>

        <div className="mt-7">
          <p className="font-black">
            Fields to update
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Centang hanya data yang ingin diterapkan ke seluruh inventory dalam range.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applySeatCapacity
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applySeatCapacity",
                      event.target.checked
                    )
                  }
                />
                Seat capacity
              </span>

              <input
                type="number"
                min={0}
                step={1}
                disabled={
                  !bulkUpdateForm
                    .applySeatCapacity
                }
                value={
                  bulkUpdateForm
                    .seatCapacity
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "seatCapacity",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applyAdultPrice
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyAdultPrice",
                      event.target.checked
                    )
                  }
                />
                Adult price
              </span>

              <input
                type="number"
                min={0}
                step={1}
                disabled={
                  !bulkUpdateForm
                    .applyAdultPrice
                }
                value={
                  bulkUpdateForm.adultPrice
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "adultPrice",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applyChildPrice
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyChildPrice",
                      event.target.checked
                    )
                  }
                />
                Child price
              </span>

              <input
                type="number"
                min={0}
                step={1}
                disabled={
                  !bulkUpdateForm
                    .applyChildPrice
                }
                value={
                  bulkUpdateForm.childPrice
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "childPrice",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applyInfantPrice
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyInfantPrice",
                      event.target.checked
                    )
                  }
                />
                Infant price
              </span>

              <input
                type="number"
                min={0}
                step={1}
                disabled={
                  !bulkUpdateForm
                    .applyInfantPrice
                }
                value={
                  bulkUpdateForm
                    .infantPrice
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "infantPrice",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applyCurrency
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyCurrency",
                      event.target.checked
                    )
                  }
                />
                Currency
              </span>

              <input
                disabled={
                  !bulkUpdateForm
                    .applyCurrency
                }
                maxLength={3}
                value={
                  bulkUpdateForm.currency
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "currency",
                    event.target.value
                      .toUpperCase()
                      .slice(0, 3)
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 uppercase disabled:bg-slate-100"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applySalesStatus
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applySalesStatus",
                      event.target.checked
                    )
                  }
                />
                Sales status
              </span>

              <select
                disabled={
                  !bulkUpdateForm
                    .applySalesStatus
                }
                value={
                  bulkUpdateForm
                    .salesStatus
                }
                onChange={(event) =>
                  updateBulkUpdateField(
                    "salesStatus",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
              >
                <option value="OPEN">
                  Open
                </option>
                <option value="CLOSED">
                  Closed
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm
                      .applyIsActive
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyIsActive",
                      event.target.checked
                    )
                  }
                />
                Active status
              </span>

              <span className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={
                    !bulkUpdateForm
                      .applyIsActive
                  }
                  checked={
                    bulkUpdateForm.isActive
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "isActive",
                      event.target.checked
                    )
                  }
                />
                Set inventory active
              </span>
            </label>

            <label className="rounded-2xl border border-slate-200 p-4">
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={
                    bulkUpdateForm.applyNotes
                  }
                  onChange={(event) =>
                    updateBulkUpdateField(
                      "applyNotes",
                      event.target.checked
                    )
                  }
                />
                Notes
              </span>

              <textarea
                rows={2}
                maxLength={1000}
                disabled={
                  !bulkUpdateForm.applyNotes
                }
                value={bulkUpdateForm.notes}
                onChange={(event) =>
                  updateBulkUpdateField(
                    "notes",
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              void handleBulkUpdatePreview()
            }
            disabled={
              isBulkUpdatePreviewLoading
            }
            className="rounded-full bg-violet-700 px-7 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBulkUpdatePreviewLoading
              ? "Checking..."
              : "Preview Updates"}
          </button>

          {bulkUpdatePreviewSummary.update > 0 && (
            <button
              type="button"
              onClick={() =>
                void handleBulkUpdateApply()
              }
              disabled={
                isBulkUpdating ||
                isBulkUpdatePreviewLoading
              }
              className="rounded-full bg-emerald-700 px-7 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBulkUpdating
                ? "Updating..."
                : `Apply ${bulkUpdatePreviewSummary.update} Updates`}
            </button>
          )}

          <p className="text-xs leading-5 text-slate-500">
            Only rows marked UPDATE will be changed.
          </p>
        </div>

        {bulkUpdatePreviewError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {bulkUpdatePreviewError}
          </div>
        )}

        {bulkUpdatePreview.length > 0 && (
          <div className="mt-7 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Will update
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-900">
                  {
                    bulkUpdatePreviewSummary
                      .update
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Missing — skip
                </p>
                <p className="mt-1 text-2xl font-black text-amber-900">
                  {
                    bulkUpdatePreviewSummary
                      .missing
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Blocked
                </p>
                <p className="mt-1 text-2xl font-black text-red-900">
                  {
                    bulkUpdatePreviewSummary
                      .blocked
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Non-operating
                </p>
                <p className="mt-1 text-2xl font-black">
                  {
                    bulkUpdatePreviewSummary
                      .nonOperating
                  }
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">
                        Date
                      </th>
                      <th className="px-4 py-3">
                        Code
                      </th>
                      <th className="px-4 py-3">
                        Booked
                      </th>
                      <th className="px-4 py-3">
                        Held
                      </th>
                      <th className="px-4 py-3">
                        Result
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {bulkUpdatePreview.map(
                      (row) => (
                        <tr
                          key={
                            row.inventoryCode
                          }
                          className="bg-white"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold">
                            {row.travelDate}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                            {
                              row.inventoryCode
                            }
                          </td>

                          <td className="px-4 py-3">
                            {row.bookedSeats}
                          </td>

                          <td className="px-4 py-3">
                            {row.heldSeats}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-black">
                              {row.status ===
                              "UPDATE"
                                ? "UPDATE"
                                : row.status ===
                                    "MISSING"
                                  ? "MISSING — SKIP"
                                  : row.status ===
                                      "BLOCKED"
                                    ? "BLOCKED"
                                    : "NON-OPERATING — SKIP"}
                            </span>

                            {row.reason && (
                              <p className="mt-1 text-xs text-red-700">
                                {row.reason}
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
              <p className="font-black">
                Update safety
              </p>

              <p className="mt-1">
                Hanya existing inventory berstatus UPDATE yang diproses. Missing, blocked, dan non-operating dates tetap di-skip.
              </p>
            </div>

            {bulkUpdateResults.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Updated
                    </p>

                    <p className="mt-1 text-2xl font-black text-emerald-900">
                      {
                        bulkUpdateResultSummary
                          .updated
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Skipped
                    </p>

                    <p className="mt-1 text-2xl font-black text-amber-900">
                      {
                        bulkUpdateResultSummary
                          .skipped
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                      Failed
                    </p>

                    <p className="mt-1 text-2xl font-black text-red-900">
                      {
                        bulkUpdateResultSummary
                          .failed
                      }
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                        <tr>
                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Inventory code
                          </th>

                          <th className="px-4 py-3">
                            Result
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {bulkUpdateResults.map(
                          (row) => (
                            <tr
                              key={
                                row.inventoryCode
                              }
                              className="bg-white"
                            >
                              <td className="px-4 py-3 font-bold">
                                {
                                  row.travelDate
                                }
                              </td>

                              <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                {
                                  row.inventoryCode
                                }
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={
                                    row.status ===
                                    "UPDATED"
                                      ? "font-black text-emerald-700"
                                      : row.status ===
                                          "SKIPPED"
                                        ? "font-black text-amber-700"
                                        : "font-black text-red-700"
                                  }
                                >
                                  {row.status}
                                </span>

                                {row.message && (
                                  <p className="mt-1 text-xs text-slate-600">
                                    {
                                      row.message
                                    }
                                  </p>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit inventory"
              : "New inventory"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update daily trip inventory"
              : "Add daily trip inventory"}
          </h2>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {formWarnings.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-black">
              Periksa sebelum simpan
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {formWarnings.map((warning) => (
                <li key={warning}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Trip schedule *
            </span>

            <select
              value={form.scheduleId}
              onChange={(event) =>
                handleScheduleChange(
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select schedule
              </option>

              {schedules.map(
                (schedule) => (
                  <option
                    key={schedule.$id}
                    value={schedule.$id}
                  >
                    {schedule.fromPort}
                    {" → "}
                    {schedule.toPort}
                    {" | "}
                    {schedule.departureTime}
                    {" | "}
                    {schedule.scheduleCode}
                    {!schedule.isActive
                      ? " (Inactive)"
                      : ""}
                  </option>
                )
              )}
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Pilih jadwal dasar yang sesuai dengan vendor, rute, kapal, dan jam keberangkatan.
            </p>
          </label>

          {selectedSchedule && (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="font-black">
                {selectedSchedule.operatorName}
                {" — "}
                {selectedSchedule.vesselName}
              </p>

              <p className="mt-1 text-slate-600">
                Vessel allocation:{" "}
                {
                  selectedSchedule
                    .vesselActiveCapacity
                }{" "}
                seats
              </p>

              <p className="mt-1 text-slate-600">
                Operating days:{" "}
                {
                  selectedSchedule.operatingDays
                }
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold">
              Travel date *
            </span>

            <input
              type="date"
              value={form.travelDate}
              onChange={(event) =>
                updateField(
                  "travelDate",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Tanggal keberangkatan yang bisa dijual untuk customer.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Seat capacity *
            </span>

            <input
              type="number"
              min={0}
              max={
                selectedSchedule
                  ?.vesselActiveCapacity ||
                1000
              }
              step={1}
              value={form.seatCapacity}
              onChange={(event) =>
                updateField(
                  "seatCapacity",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Jumlah kursi yang dialokasikan vendor untuk NusaGiliBoat pada tanggal ini.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Adult price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.adultPrice}
              onChange={(event) =>
                updateField(
                  "adultPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Harga jual per penumpang dewasa. Isi angka tanpa titik atau koma.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Child price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.childPrice}
              onChange={(event) =>
                updateField(
                  "childPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Isi 0 jika vendor tidak membedakan harga anak.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Infant price *
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={form.infantPrice}
              onChange={(event) =>
                updateField(
                  "infantPrice",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Isi 0 jika bayi tidak dikenakan biaya tiket.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Currency *
            </span>

            <input
              value={form.currency}
              onChange={(event) =>
                updateField(
                  "currency",
                  event.target.value
                    .toUpperCase()
                    .slice(0, 3)
                )
              }
              required
              minLength={3}
              maxLength={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Gunakan IDR untuk penjualan lokal NusaGiliBoat.
            </p>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Sales status *
            </span>

            <select
              value={form.salesStatus}
              onChange={(event) =>
                updateField(
                  "salesStatus",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="OPEN">
                Open
              </option>

              <option value="CLOSED">
                Closed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              OPEN tampil di pencarian, CLOSED ditutup sementara, SOLD_OUT jika kursi habis.
            </p>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Notes
            </span>

            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              maxLength={1000}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded"
            />

            <span className="text-sm font-bold">
              Trip inventory is active
            </span>
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Inventory"
                  : "Add Inventory"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-full border border-slate-300 px-7 py-3 text-sm font-black transition hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Inventory directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Daily trip inventory
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search inventory..."
            className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600 md:max-w-sm"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              {
                value: "UPCOMING",
                label:
                  "Today & Upcoming",
                count:
                  upcomingInventory.length,
              },
              {
                value: "PAST",
                label:
                  "Past Inventory",
                count:
                  pastInventory.length,
              },
              {
                value: "ALL",
                label:
                  "All Inventory",
                count:
                  inventory.length,
              },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setInventoryView(
                  option.value
                )
              }
              className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                inventoryView ===
                option.value
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-cyan-600 hover:text-cyan-700"
              }`}
            >
              {option.label}
              {" ("}
              {option.count}
              {")"}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Inventory sebelum hari ini
          dipindahkan ke Past Inventory.
          Data tetap tersimpan untuk
          riwayat booking dan pembayaran.
          Perhitungan menggunakan tanggal
          Bali/WITA.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Date / Trip
                </th>

                <th className="px-4 py-2">
                  Operator / Vessel
                </th>

                <th className="px-4 py-2">
                  Seats
                </th>

                <th className="px-4 py-2">
                  Price
                </th>

                <th className="px-4 py-2">
                  Status
                </th>

                <th className="px-4 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map(
                (item) => (
                  <tr
                    key={item.$id}
                    className={getInventoryRowClass(
                      item
                    )}
                  >
                    <td className="rounded-l-2xl px-4 py-4">
                      <p className="font-black">
                        {item.travelDate}
                      </p>

                      <p className="mt-1 font-bold">
                        {item.fromPort || "-"}
                        {" → "}
                        {item.toPort || "-"}
                      </p>

                      <p className="mt-1 text-xs text-cyan-700">
                        {item.departureTime}
                        {" | "}
                        {item.inventoryCode}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold">
                        {item.operatorName ||
                          "-"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.vesselName ||
                          "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-2xl font-black text-slate-950">
                            {item.availableSeats}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getAvailabilityClass(
                              item
                            )}`}
                          >
                            {getAvailabilityLabel(item)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-500">
                          Available seats
                        </p>

                        <p className="text-xs text-slate-500">
                          Capacity{" "}
                          {item.seatCapacity}
                          {" | "}Booked{" "}
                          {item.bookedSeats}
                          {" | "}Held{" "}
                          {item.heldSeats}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-black">
                        {formatMoney(
                          item.adultPrice,
                          item.currency
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Adult fare
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            item.salesStatus
                          )}`}
                        >
                          {item.salesStatus}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            item.isActive
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>

                        {!item.isActive && (
                          <p className="text-xs text-slate-500">
                            Tidak tampil di pencarian customer.
                          </p>
                        )}

                        {item.isActive &&
                          item.salesStatus === "OPEN" &&
                          item.availableSeats <= 0 && (
                            <p className="text-xs font-bold text-red-700">
                              Perlu dicek: OPEN tetapi kursi 0.
                            </p>
                          )}
                      </div>
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(item)
                          }
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:border-cyan-500 hover:text-cyan-700"
                        >
                          Edit data
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            item.$id
                          }
                          onClick={() =>
                            toggleStatus(item)
                          }
                          className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-60 ${
                            item.isActive
                              ? "bg-slate-900 text-white hover:bg-red-700"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {updatingId ===
                          item.$id
                            ? "Updating..."
                            : item.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredInventory.length ===
            0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No trip inventory found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
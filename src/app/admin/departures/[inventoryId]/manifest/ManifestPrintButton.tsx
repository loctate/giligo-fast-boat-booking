"use client"

export default function ManifestPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
    >
      Print / Save as PDF
    </button>
  )
}

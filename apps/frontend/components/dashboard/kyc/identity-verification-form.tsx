"use client"

import React, { useRef } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { ID_DOCUMENT_TYPE_OPTIONS, type KYCIdentityVerificationInput } from '@/types/kyc'
import { kycInputClass as inputClass, kycLabelClass as labelClass } from './field-styles'

interface Props {
  value: KYCIdentityVerificationInput
  onChange: (value: KYCIdentityVerificationInput) => void
}

function FileDropField({
  label,
  hint,
  file,
  accept,
  onSelect,
}: {
  label: string
  hint: string
  file: File | null
  accept: string
  onSelect: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-content/15 bg-canvas/60 px-3.5 py-2.5">
          <span className="truncate text-sm text-content/80">{file.name}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full text-content/40 transition-colors hover:bg-red-600/10 hover:text-red-600"
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-content/20 bg-canvas/40 px-3.5 py-6 text-center transition-colors hover:border-[#0E3B2E]/40 hover:bg-canvas/70 dark:hover:border-[#7FBF9C]/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-content/40 transition-colors group-hover:text-[#0E3B2E] dark:group-hover:text-[#7FBF9C]">
            <UploadCloud className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold text-content/65">Tap to upload</span>
          <span className="text-[11px] text-content/40">{hint}</span>
        </button>
      )}
    </div>
  )
}

export default function IdentityVerificationForm({ value, onChange }: Props) {
  const set = <K extends keyof KYCIdentityVerificationInput>(key: K, val: KYCIdentityVerificationInput[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>ID document type</label>
        <select
          className={inputClass}
          value={value.document_type}
          onChange={(e) => set('document_type', e.target.value as KYCIdentityVerificationInput['document_type'])}
        >
          <option value="">Select document type</option>
          {ID_DOCUMENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Document number</label>
        <input
          className={inputClass}
          placeholder="Enter the number exactly as on the document"
          value={value.document_number}
          onChange={(e) => set('document_number', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileDropField
          label="Document photo"
          hint="Clear photo of the front of your document"
          file={value.document_image_file}
          accept="image/*"
          onSelect={(f) => set('document_image_file', f)}
        />
        <FileDropField
          label="Selfie"
          hint="A clear photo of your face"
          file={value.selfie_image_file}
          accept="image/*"
          onSelect={(f) => set('selfie_image_file', f)}
        />
      </div>

      <FileDropField
        label="Liveness video"
        hint="Short video looking directly at the camera"
        file={value.video_file}
        accept="video/*"
        onSelect={(f) => set('video_file', f)}
      />
    </div>
  )
}
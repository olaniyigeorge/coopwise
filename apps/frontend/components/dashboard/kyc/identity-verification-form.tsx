"use client"

import React, { useRef } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { ID_DOCUMENT_TYPE_OPTIONS, type KYCIdentityVerificationInput } from '@/types/kyc'

const inputClass =
  'w-full rounded-xl border border-brand-ink/15 bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelClass = 'block text-xs font-medium text-brand-ink/60 mb-1.5'

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
        <div className="flex items-center justify-between rounded-xl border border-brand-ink/15 bg-white px-3.5 py-2.5">
          <span className="text-sm text-brand-ink/80 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-brand-ink/40 hover:text-red-600 shrink-0 ml-2"
            aria-label={`Remove ${label}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-ink/20 bg-brand-paper/50 px-3.5 py-6 text-center hover:border-primary/40 transition-colors"
        >
          <UploadCloud className="w-5 h-5 text-brand-ink/40" />
          <span className="text-xs font-medium text-brand-ink/60">Tap to upload</span>
          <span className="text-[11px] text-brand-ink/35">{hint}</span>
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
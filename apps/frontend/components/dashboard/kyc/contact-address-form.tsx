"use client"

import React from 'react'
import type { KYCContactInfoInput } from '@/types/kyc'

const inputClass =
  'w-full rounded-xl border border-brand-ink/15 bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelClass = 'block text-xs font-medium text-brand-ink/60 mb-1.5'

interface Props {
  value: KYCContactInfoInput
  onChange: (value: KYCContactInfoInput) => void
}

export default function ContactAddressForm({ value, onChange }: Props) {
  const set = <K extends keyof KYCContactInfoInput>(key: K, val: KYCContactInfoInput[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Residential address</label>
        <input
          className={inputClass}
          placeholder="Street address"
          value={value.residential_address}
          onChange={(e) => set('residential_address', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            className={inputClass}
            value={value.city}
            onChange={(e) => set('city', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            className={inputClass}
            value={value.state}
            onChange={(e) => set('state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Postal code</label>
          <input
            className={inputClass}
            value={value.postal_code}
            onChange={(e) => set('postal_code', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input
            className={inputClass}
            value={value.country}
            onChange={(e) => set('country', e.target.value)}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-brand-ink/10">
        <p className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide mb-4 mt-4">
          Next of kin <span className="normal-case font-normal text-brand-ink/35">(optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              className={inputClass}
              value={value.next_of_kin_name ?? ''}
              onChange={(e) => set('next_of_kin_name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Phone number</label>
            <input
              className={inputClass}
              value={value.next_of_kin_phone ?? ''}
              onChange={(e) => set('next_of_kin_phone', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
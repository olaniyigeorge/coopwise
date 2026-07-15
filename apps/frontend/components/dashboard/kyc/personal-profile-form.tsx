"use client"

import React from 'react'
import {
  EMPLOYMENT_STATUS_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  MONTHLY_INCOME_RANGE_OPTIONS,
  INCOME_CURRENCY_OPTIONS,
  type KYCPersonalInfoInput,
} from '@/types/kyc'

const inputClass =
  'w-full rounded-xl border border-brand-ink/15 bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelClass = 'block text-xs font-medium text-brand-ink/60 mb-1.5'

interface Props {
  value: KYCPersonalInfoInput
  onChange: (value: KYCPersonalInfoInput) => void
}

export default function PersonalProfileForm({ value, onChange }: Props) {
  const set = <K extends keyof KYCPersonalInfoInput>(key: K, val: KYCPersonalInfoInput[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Legal full name</label>
        <input
          className={inputClass}
          placeholder="As it appears on your ID document"
          value={value.legal_full_name}
          onChange={(e) => set('legal_full_name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date of birth</label>
          <input
            type="date"
            className={inputClass}
            value={value.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select
            className={inputClass}
            value={value.gender ?? ''}
            onChange={(e) => set('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Nationality</label>
        <input
          className={inputClass}
          placeholder="e.g. Nigerian"
          value={value.nationality}
          onChange={(e) => set('nationality', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Employment status</label>
          <select
            className={inputClass}
            value={value.employment_status}
            onChange={(e) => set('employment_status', e.target.value as KYCPersonalInfoInput['employment_status'])}
          >
            <option value="">Select employment status</option>
            {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Occupation / business type</label>
          <input
            className={inputClass}
            placeholder="e.g. Software Engineer"
            value={value.occupation_or_business_type ?? ''}
            onChange={(e) => set('occupation_or_business_type', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Source of funds</label>
        <select
          className={inputClass}
          value={value.source_of_funds}
          onChange={(e) => set('source_of_funds', e.target.value as KYCPersonalInfoInput['source_of_funds'])}
        >
          <option value="">Select source of funds</option>
          {SOURCE_OF_FUNDS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Monthly income range</label>
          <select
            className={inputClass}
            value={value.monthly_income_range ?? ''}
            onChange={(e) => set('monthly_income_range', e.target.value)}
          >
            <option value="">Select income range</option>
            {MONTHLY_INCOME_RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Income currency</label>
          <select
            className={inputClass}
            value={value.income_currency}
            onChange={(e) => set('income_currency', e.target.value)}
          >
            {INCOME_CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
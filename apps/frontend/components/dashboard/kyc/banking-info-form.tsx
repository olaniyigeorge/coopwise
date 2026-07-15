"use client"

import React from 'react'
import type { KYCBankingInfoInput } from '@/types/kyc'

const inputClass =
  'w-full rounded-xl border border-brand-ink/15 bg-white px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/35 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
const labelClass = 'block text-xs font-medium text-brand-ink/60 mb-1.5'

interface Props {
  value: KYCBankingInfoInput
  onChange: (value: KYCBankingInfoInput) => void
}

export default function BankingInfoForm({ value, onChange }: Props) {
  const set = <K extends keyof KYCBankingInfoInput>(key: K, val: KYCBankingInfoInput[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-5">
      {/* TODO: swap for a bank-select populated from your bank-list/provider endpoint,
          then auto-resolve account_name via the provider's account-lookup call. */}
      <div>
        <label className={labelClass}>Bank name</label>
        <input
          className={inputClass}
          placeholder="e.g. Guaranty Trust Bank"
          value={value.bank_name}
          onChange={(e) => set('bank_name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Bank code</label>
          <input
            className={inputClass}
            placeholder="e.g. 058"
            value={value.bank_code}
            onChange={(e) => set('bank_code', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Account number</label>
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit account number"
            value={value.account_number}
            onChange={(e) => set('account_number', e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Account name</label>
        <input
          className={inputClass}
          placeholder="Name on the bank account"
          value={value.account_name}
          onChange={(e) => set('account_name', e.target.value)}
        />
      </div>
    </div>
  )
}
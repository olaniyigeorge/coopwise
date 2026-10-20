"use client"

import React from 'react'
import type { KYCBankingInfoInput } from '@/types/kyc'
import { kycInputClass as inputClass, kycLabelClass as labelClass } from './field-styles'

interface Props {
  value: KYCBankingInfoInput
  onChange: (value: KYCBankingInfoInput) => void
}

export default function BankingInfoForm({ value, onChange }: Props) {
  const set = <K extends keyof KYCBankingInfoInput>(key: K, val: KYCBankingInfoInput[K]) =>
    onChange({ ...value, [key]: val })

  return (
    <div className="space-y-5">
      {/* Deferred: needs a bank-list/account-lookup provider (e.g. Paystack) and its API key
          before this can become a bank-select with auto-resolved account_name. Manual entry for now. */}
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
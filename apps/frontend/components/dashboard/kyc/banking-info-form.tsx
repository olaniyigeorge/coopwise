"use client"

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import type { KYCBankingInfoInput } from '@/types/kyc'
import {
  getBanks,
  resolveBankAccount,
  type BankOption,
} from '@/services/kyc-service'
import { getApiErrorDetail } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { kycInputClass as inputClass, kycLabelClass as labelClass } from './field-styles'

interface Props {
  value: KYCBankingInfoInput
  onChange: (value: KYCBankingInfoInput) => void
}

type ResolutionState = 'idle' | 'resolving' | 'resolved' | 'failed'

function resolutionErrorMessage(err: unknown): string {
  const detail = getApiErrorDetail(err)
  const reason =
    detail && typeof detail === 'object' ? (detail as { reason?: string }).reason : undefined

  if (reason === 'resolution_failed') {
    return "We couldn't find that account at this bank. Check the 10-digit number and try again."
  }
  return 'We could not confirm this account right now. Please try again in a moment.'
}

export default function BankingInfoForm({ value, onChange }: Props) {
  const [banks, setBanks] = useState<BankOption[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [banksError, setBanksError] = useState<string | null>(null)
  const [bankPickerOpen, setBankPickerOpen] = useState(false)

  const [resolution, setResolution] = useState<ResolutionState>(
    value.account_name ? 'resolved' : 'idle'
  )
  const [resolutionError, setResolutionError] = useState<string | null>(null)

  // Keep the latest value/handler available to the async resolver without
  // making them effect dependencies (onChange writes account_name back).
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const requestId = useRef(0)
  valueRef.current = value
  onChangeRef.current = onChange

  const loadBanks = useCallback(async () => {
    setBanksLoading(true)
    setBanksError(null)
    try {
      setBanks(await getBanks())
    } catch {
      setBanksError('Could not load the bank list.')
    } finally {
      setBanksLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanks()
  }, [loadBanks])

  const resolveAccount = useCallback(() => {
    const { bank_code, account_number } = valueRef.current
    if (!bank_code || account_number.length !== 10) return

    const id = ++requestId.current
    setResolution('resolving')
    setResolutionError(null)

    resolveBankAccount(bank_code, account_number)
      .then((result) => {
        if (requestId.current !== id) return
        setResolution('resolved')
        onChangeRef.current({ ...valueRef.current, account_name: result.account_name })
      })
      .catch((err) => {
        if (requestId.current !== id) return
        setResolution('failed')
        setResolutionError(resolutionErrorMessage(err))
        if (valueRef.current.account_name) {
          onChangeRef.current({ ...valueRef.current, account_name: '' })
        }
      })
  }, [])

  // Auto-resolve once a bank and a full account number are present. Debounced
  // so we don't hit Paystack on every keystroke while the number is typed.
  useEffect(() => {
    if (!value.bank_code || value.account_number.length !== 10) {
      requestId.current += 1
      setResolution('idle')
      setResolutionError(null)
      return
    }

    setResolution('resolving')
    setResolutionError(null)
    const timer = setTimeout(resolveAccount, 450)
    return () => clearTimeout(timer)
    // Only re-resolve when the pair changes — not when account_name is filled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.bank_code, value.account_number])

  const selectedBank = banks.find((bank) => bank.code === value.bank_code)
  const bankLabel =
    selectedBank?.name ||
    value.bank_name ||
    (banksLoading ? 'Loading banks…' : 'Select your bank')

  const selectBank = (bank: BankOption) => {
    onChange({ ...value, bank_name: bank.name, bank_code: bank.code, account_name: '' })
    setResolution('idle')
    setResolutionError(null)
    setBankPickerOpen(false)
  }

  const handleAccountNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    onChange({ ...value, account_number: digits, account_name: '' })
    if (resolution !== 'idle') {
      setResolution('idle')
      setResolutionError(null)
    }
  }

  const accountNamePlaceholder =
    resolution === 'resolving'
      ? 'Confirming…'
      : resolution === 'failed'
        ? 'Not confirmed'
        : 'Fills in automatically'

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="kyc-bank">
          Bank
        </label>
        <Popover open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
          <PopoverTrigger asChild>
            <button
              id="kyc-bank"
              type="button"
              role="combobox"
              aria-expanded={bankPickerOpen}
              aria-label="Select your bank"
              disabled={banksLoading || !!banksError}
              className={cn(
                inputClass,
                'flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              <span className={cn('truncate', !selectedBank && !value.bank_name && 'text-content/30')}>
                {bankLabel}
              </span>
              {banksLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-content/30" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-content/35" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command>
              <CommandInput placeholder="Search banks…" />
              <CommandList>
                <CommandEmpty>No bank found.</CommandEmpty>
                <CommandGroup>
                  {banks.map((bank) => (
                    <CommandItem
                      key={bank.code}
                      value={`${bank.name} ${bank.code}`}
                      onSelect={() => selectBank(bank)}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          bank.code === value.bank_code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="truncate">{bank.name}</span>
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-content/35">
                        {bank.code}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {banksError && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {banksError}
            <button
              type="button"
              onClick={loadBanks}
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="kyc-account-number">
          Account number
        </label>
        <div className="relative">
          <input
            id="kyc-account-number"
            className={cn(
              inputClass,
              'pr-10 tabular-nums tracking-wide',
              resolution === 'failed' &&
                'border-red-500/40 focus:border-red-500 focus:ring-red-500/15'
            )}
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            placeholder="10-digit account number"
            value={value.account_number}
            onChange={(e) => handleAccountNumber(e.target.value)}
            aria-invalid={resolution === 'failed'}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {resolution === 'resolving' && (
              <Loader2 className="h-4 w-4 animate-spin text-content/30" />
            )}
            {resolution === 'resolved' && (
              <Check className="h-4 w-4 text-[#1F7A54] dark:text-[#7FBF9C]" />
            )}
            {resolution === 'failed' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </span>
        </div>
      </div>

      <div>
        <span className={labelClass}>Account name</span>
        <div
          id="kyc-account-name"
          aria-live="polite"
          className={cn(
            inputClass,
            'flex items-center gap-2',
            !value.account_name && 'text-content/30'
          )}
        >
          {value.account_name ? (
            <>
              <Check className="h-4 w-4 shrink-0 text-[#1F7A54] dark:text-[#7FBF9C]" />
              <span className="truncate font-medium text-content">{value.account_name}</span>
            </>
          ) : (
            <span>{accountNamePlaceholder}</span>
          )}
        </div>

        {resolution === 'resolved' && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-content/40">
            Confirmed with your bank. This name must match the legal name on your ID.
          </p>
        )}
        {resolution === 'failed' && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {resolutionError}
              <button
                type="button"
                onClick={resolveAccount}
                className="ml-1 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

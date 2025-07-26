import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { currencyUtils } from '../lib/database'

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserCurrency()
  }, [])

  const loadUserCurrency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userCurrency = await currencyUtils.getUserCurrency(user.id)
        setCurrency(userCurrency)
      }
    } catch (error) {
      console.error('Error loading user currency:', error)
      setCurrency('USD')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, customCurrency?: string) => {
    return currencyUtils.formatCurrency(amount, customCurrency || currency)
  }

  const getCurrencySymbol = (customCurrency?: string) => {
    return currencyUtils.getCurrencySymbol(customCurrency || currency)
  }

  const getAvailableCurrencies = () => {
    return currencyUtils.getAvailableCurrencies()
  }

  const updateCurrency = (newCurrency: string) => {
    setCurrency(newCurrency)
  }

  return {
    currency,
    loading,
    formatCurrency,
    getCurrencySymbol,
    getAvailableCurrencies,
    updateCurrency,
    refreshCurrency: loadUserCurrency
  }
}
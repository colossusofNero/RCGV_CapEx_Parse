// Currency Formatting Hook - Eliminates duplicate formatting logic
import { useMemo } from 'react';

export const useCurrencyFormatter = (amount: number, currency: string): string => {
  return useMemo(() => {
    const normalizedCurrency = currency.toUpperCase();
    const formattedAmount = (amount / 100).toFixed(2);

    // Currency symbol mapping
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
    };

    const symbol = currencySymbols[normalizedCurrency] || normalizedCurrency;

    // Format based on currency
    if (normalizedCurrency === 'JPY') {
      // Japanese Yen doesn't use decimal places
      return `${symbol}${Math.round(amount / 100)}`;
    }

    return `${symbol}${formattedAmount}`;
  }, [amount, currency]);
};
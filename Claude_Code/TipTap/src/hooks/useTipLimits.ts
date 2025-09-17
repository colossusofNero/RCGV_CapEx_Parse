import {useAppContext} from '@/context/AppContext';
import {useMemo} from 'react';

export const useTipLimits = () => {
  const {state} = useAppContext();
  const {transactions, settings} = state;

  const getTotalSpent = (period: 'daily' | 'weekly' | 'monthly'): number => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return transactions
      .filter(
        transaction =>
          transaction.status === 'completed' &&
          new Date(transaction.timestamp) >= startDate
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getRemainingLimit = (period: 'daily' | 'weekly' | 'monthly'): number => {
    const spent = getTotalSpent(period);
    const limit = settings[`${period}Limit`];
    return Math.max(0, limit - spent);
  };

  const canTip = (amount: number): boolean => {
    const dailyRemaining = getRemainingLimit('daily');
    const weeklyRemaining = getRemainingLimit('weekly');
    const monthlyRemaining = getRemainingLimit('monthly');

    return (
      amount <= dailyRemaining &&
      amount <= weeklyRemaining &&
      amount <= monthlyRemaining
    );
  };

  const getLimitStatus = () => {
    const dailySpent = getTotalSpent('daily');
    const weeklySpent = getTotalSpent('weekly');
    const monthlySpent = getTotalSpent('monthly');

    const dailyPercentage = (dailySpent / settings.dailyLimit) * 100;
    const weeklyPercentage = (weeklySpent / settings.weeklyLimit) * 100;
    const monthlyPercentage = (monthlySpent / settings.monthlyLimit) * 100;

    return {
      daily: {
        spent: dailySpent,
        limit: settings.dailyLimit,
        remaining: getRemainingLimit('daily'),
        percentage: dailyPercentage,
      },
      weekly: {
        spent: weeklySpent,
        limit: settings.weeklyLimit,
        remaining: getRemainingLimit('weekly'),
        percentage: weeklyPercentage,
      },
      monthly: {
        spent: monthlySpent,
        limit: settings.monthlyLimit,
        remaining: getRemainingLimit('monthly'),
        percentage: monthlyPercentage,
      },
    };
  };

  const getNextResetTime = (period: 'daily' | 'weekly' | 'monthly'): Date => {
    const now = new Date();
    let resetTime: Date;

    switch (period) {
      case 'daily':
        resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        resetTime = new Date(now);
        resetTime.setDate(now.getDate() + (7 - dayOfWeek));
        resetTime.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        resetTime = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    return resetTime;
  };

  return useMemo(
    () => ({
      getTotalSpent,
      getRemainingLimit,
      canTip,
      getLimitStatus,
      getNextResetTime,
    }),
    [transactions, settings]
  );
};
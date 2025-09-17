import { renderHook } from '@testing-library/react';
import { useTipLimits } from '@/hooks/useTipLimits';
import { AppContext } from '@/context/AppContext';
import React from 'react';

const mockContextValue = {
  state: {
    transactions: [
      {
        id: '1',
        amount: 50.00,
        timestamp: new Date().toISOString(),
        status: 'completed',
        type: 'tip',
        merchantId: 'merchant1'
      },
      {
        id: '2',
        amount: 25.00,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'completed',
        type: 'tip',
        merchantId: 'merchant2'
      },
      {
        id: '3',
        amount: 100.00,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        status: 'completed',
        type: 'tip',
        merchantId: 'merchant3'
      }
    ],
    settings: {
      dailyLimit: 200.00,
      weeklyLimit: 500.00,
      monthlyLimit: 1000.00
    }
  },
  dispatch: jest.fn()
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppContext.Provider value={mockContextValue}>
    {children}
  </AppContext.Provider>
);

describe('useTipLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTotalSpent', () => {
    it('should calculate daily spent correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const dailySpent = result.current.getTotalSpent('daily');
      expect(dailySpent).toBe(50.00); // Only today's transaction
    });

    it('should calculate weekly spent correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const weeklySpent = result.current.getTotalSpent('weekly');
      expect(weeklySpent).toBe(75.00); // Today + 2 days ago (within week)
    });

    it('should calculate monthly spent correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const monthlySpent = result.current.getTotalSpent('monthly');
      expect(monthlySpent).toBe(175.00); // All transactions within current month
    });

    it('should exclude failed transactions', () => {
      const contextWithFailedTransaction = {
        ...mockContextValue,
        state: {
          ...mockContextValue.state,
          transactions: [
            ...mockContextValue.state.transactions,
            {
              id: '4',
              amount: 300.00,
              timestamp: new Date().toISOString(),
              status: 'failed',
              type: 'tip',
              merchantId: 'merchant4'
            }
          ]
        }
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <AppContext.Provider value={contextWithFailedTransaction}>
          {children}
        </AppContext.Provider>
      );

      const { result } = renderHook(() => useTipLimits(), { wrapper: customWrapper });

      const dailySpent = result.current.getTotalSpent('daily');
      expect(dailySpent).toBe(50.00); // Failed transaction not included
    });
  });

  describe('getRemainingLimit', () => {
    it('should calculate daily remaining limit correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const dailyRemaining = result.current.getRemainingLimit('daily');
      expect(dailyRemaining).toBe(150.00); // 200 - 50
    });

    it('should calculate weekly remaining limit correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const weeklyRemaining = result.current.getRemainingLimit('weekly');
      expect(weeklyRemaining).toBe(425.00); // 500 - 75
    });

    it('should calculate monthly remaining limit correctly', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const monthlyRemaining = result.current.getRemainingLimit('monthly');
      expect(monthlyRemaining).toBe(825.00); // 1000 - 175
    });

    it('should return 0 when limit is exceeded', () => {
      const contextWithExceededLimit = {
        ...mockContextValue,
        state: {
          ...mockContextValue.state,
          transactions: [
            {
              id: '5',
              amount: 250.00,
              timestamp: new Date().toISOString(),
              status: 'completed',
              type: 'tip',
              merchantId: 'merchant5'
            }
          ],
          settings: {
            dailyLimit: 200.00,
            weeklyLimit: 500.00,
            monthlyLimit: 1000.00
          }
        }
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <AppContext.Provider value={contextWithExceededLimit}>
          {children}
        </AppContext.Provider>
      );

      const { result } = renderHook(() => useTipLimits(), { wrapper: customWrapper });

      const dailyRemaining = result.current.getRemainingLimit('daily');
      expect(dailyRemaining).toBe(0); // Limit exceeded, should be 0
    });
  });

  describe('canTip', () => {
    it('should return true when amount is within all limits', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const canTip = result.current.canTip(100.00);
      expect(canTip).toBe(true);
    });

    it('should return false when amount exceeds daily limit', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const canTip = result.current.canTip(200.00); // Exceeds daily remaining (150)
      expect(canTip).toBe(false);
    });

    it('should return false when amount exceeds weekly limit', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const canTip = result.current.canTip(450.00); // Exceeds weekly remaining (425)
      expect(canTip).toBe(false);
    });

    it('should return false when amount exceeds monthly limit', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const canTip = result.current.canTip(900.00); // Exceeds monthly remaining (825)
      expect(canTip).toBe(false);
    });

    it('should return true for exact remaining limit', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const canTip = result.current.canTip(150.00); // Exactly daily remaining
      expect(canTip).toBe(true);
    });
  });

  describe('getLimitStatus', () => {
    it('should return correct limit status for all periods', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const status = result.current.getLimitStatus();

      expect(status.daily).toEqual({
        spent: 50.00,
        limit: 200.00,
        remaining: 150.00,
        percentage: 25.00
      });

      expect(status.weekly).toEqual({
        spent: 75.00,
        limit: 500.00,
        remaining: 425.00,
        percentage: 15.00
      });

      expect(status.monthly).toEqual({
        spent: 175.00,
        limit: 1000.00,
        remaining: 825.00,
        percentage: 17.50
      });
    });
  });

  describe('getNextResetTime', () => {
    it('should return next day for daily reset', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const nextReset = result.current.getNextResetTime('daily');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      expect(nextReset).toEqual(tomorrow);
    });

    it('should return next Sunday for weekly reset', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const nextReset = result.current.getNextResetTime('weekly');
      const now = new Date();
      const dayOfWeek = now.getDay();
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - dayOfWeek));
      nextSunday.setHours(0, 0, 0, 0);

      expect(nextReset).toEqual(nextSunday);
    });

    it('should return first day of next month for monthly reset', () => {
      const { result } = renderHook(() => useTipLimits(), { wrapper });

      const nextReset = result.current.getNextResetTime('monthly');
      const now = new Date();
      const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      expect(nextReset).toEqual(firstOfNextMonth);
    });
  });

  describe('memoization', () => {
    it('should not recalculate when transactions and settings do not change', () => {
      const { result, rerender } = renderHook(() => useTipLimits(), { wrapper });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should recalculate when transactions change', () => {
      let contextValue = { ...mockContextValue };

      const DynamicWrapper = ({ children }: { children: React.ReactNode }) => (
        <AppContext.Provider value={contextValue}>
          {children}
        </AppContext.Provider>
      );

      const { result, rerender } = renderHook(() => useTipLimits(), {
        wrapper: DynamicWrapper
      });

      const firstResult = result.current;

      // Change transactions
      contextValue = {
        ...contextValue,
        state: {
          ...contextValue.state,
          transactions: [
            ...contextValue.state.transactions,
            {
              id: '6',
              amount: 30.00,
              timestamp: new Date().toISOString(),
              status: 'completed',
              type: 'tip',
              merchantId: 'merchant6'
            }
          ]
        }
      };

      rerender();
      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.getTotalSpent('daily')).toBe(80.00); // 50 + 30
    });
  });
});
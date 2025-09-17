import { TipCalculation } from '@/domain/entities/Transaction';

export interface TipCalculationOptions {
  baseAmount: number;
  tipPercentage: number;
  currency: string;
  roundingMode?: 'up' | 'down' | 'nearest';
  customTipAmount?: number;
}

export interface TipPreset {
  label: string;
  percentage: number;
  isPopular?: boolean;
}

export class TipCalculationService {
  private readonly DEFAULT_TIP_PRESETS: TipPreset[] = [
    { label: '15%', percentage: 15 },
    { label: '18%', percentage: 18, isPopular: true },
    { label: '20%', percentage: 20, isPopular: true },
    { label: '25%', percentage: 25 }
  ];

  calculateTip(options: TipCalculationOptions): TipCalculation {
    this.validateCalculationOptions(options);

    const { baseAmount, tipPercentage, currency, roundingMode = 'nearest' } = options;

    let tipAmount: number;

    if (options.customTipAmount !== undefined) {
      tipAmount = options.customTipAmount;
    } else {
      tipAmount = this.calculateTipAmount(baseAmount, tipPercentage);
    }

    tipAmount = this.roundAmount(tipAmount, roundingMode);
    const totalAmount = this.roundAmount(baseAmount + tipAmount, roundingMode);

    return {
      baseAmount,
      tipPercentage,
      tipAmount,
      totalAmount,
      currency
    };
  }

  calculateTipFromTotal(totalAmount: number, tipPercentage: number, currency: string): TipCalculation {
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    if (tipPercentage < 0) {
      throw new Error('Tip percentage cannot be negative');
    }

    const baseAmount = totalAmount / (1 + tipPercentage / 100);
    const tipAmount = totalAmount - baseAmount;

    return {
      baseAmount: this.roundAmount(baseAmount, 'nearest'),
      tipPercentage,
      tipAmount: this.roundAmount(tipAmount, 'nearest'),
      totalAmount: this.roundAmount(totalAmount, 'nearest'),
      currency
    };
  }

  getTipPresets(): TipPreset[] {
    return [...this.DEFAULT_TIP_PRESETS];
  }

  getCustomTipPresets(merchantId: string): TipPreset[] {
    // In a real implementation, this would fetch from a repository
    // For now, return default presets
    return this.getTipPresets();
  }

  calculateSplitTip(totalCalculation: TipCalculation, numberOfPeople: number): TipCalculation[] {
    if (numberOfPeople <= 0) {
      throw new Error('Number of people must be greater than 0');
    }

    if (numberOfPeople === 1) {
      return [totalCalculation];
    }

    const baseAmountPerPerson = totalCalculation.baseAmount / numberOfPeople;
    const tipAmountPerPerson = totalCalculation.tipAmount / numberOfPeople;
    const totalAmountPerPerson = totalCalculation.totalAmount / numberOfPeople;

    const splits: TipCalculation[] = [];

    for (let i = 0; i < numberOfPeople; i++) {
      const isLast = i === numberOfPeople - 1;

      // Handle rounding by giving any remainder to the last person
      const baseAmount = isLast
        ? totalCalculation.baseAmount - (baseAmountPerPerson * (numberOfPeople - 1))
        : this.roundAmount(baseAmountPerPerson, 'nearest');

      const tipAmount = isLast
        ? totalCalculation.tipAmount - (this.roundAmount(tipAmountPerPerson, 'nearest') * (numberOfPeople - 1))
        : this.roundAmount(tipAmountPerPerson, 'nearest');

      splits.push({
        baseAmount,
        tipPercentage: totalCalculation.tipPercentage,
        tipAmount,
        totalAmount: baseAmount + tipAmount,
        currency: totalCalculation.currency
      });
    }

    return splits;
  }

  validateTipAmount(amount: number, maxAmount?: number): boolean {
    if (amount < 0) return false;
    if (maxAmount && amount > maxAmount) return false;
    return true;
  }

  formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
    }
  }

  private calculateTipAmount(baseAmount: number, tipPercentage: number): number {
    return (baseAmount * tipPercentage) / 100;
  }

  private roundAmount(amount: number, mode: 'up' | 'down' | 'nearest'): number {
    const multiplier = 100; // Round to cents
    const scaled = amount * multiplier;

    switch (mode) {
      case 'up':
        return Math.ceil(scaled) / multiplier;
      case 'down':
        return Math.floor(scaled) / multiplier;
      case 'nearest':
      default:
        return Math.round(scaled) / multiplier;
    }
  }

  private validateCalculationOptions(options: TipCalculationOptions): void {
    if (options.baseAmount <= 0) {
      throw new Error('Base amount must be greater than 0');
    }

    if (options.tipPercentage < 0) {
      throw new Error('Tip percentage cannot be negative');
    }

    if (!options.currency || options.currency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter code');
    }

    if (options.customTipAmount !== undefined && options.customTipAmount < 0) {
      throw new Error('Custom tip amount cannot be negative');
    }
  }
}
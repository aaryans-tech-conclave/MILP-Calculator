/**
 * Indian Rupee (INR) denomination formatters:
 * 1 Crore (Cr) = 10,000,000 (100 Lakhs)
 * 1 Lakh (L) = 100,000
 */

export function formatINR(amount: number, showDecimals = true): string {
  if (amount === 0 || isNaN(amount)) return '₹0';
  
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${sign}₹${cr.toFixed(showDecimals ? 2 : 1)} Cr`;
  } else if (abs >= 100000) {
    const lakh = abs / 100000;
    return `${sign}₹${lakh.toFixed(showDecimals ? 2 : 1)} L`;
  } else if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(showDecimals ? 1 : 0)}k`;
  } else {
    return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
  }
}

export function formatINRDelta(delta: number): string {
  if (Math.abs(delta) < 1) return '₹0';
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${formatINR(delta)}`;
}

export function formatINRLong(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

export function formatArea(area: number): string {
  return `${Math.round(area).toLocaleString('en-IN')} sq.ft`;
}


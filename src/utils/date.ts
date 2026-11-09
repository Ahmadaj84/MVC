export function formatSAR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ر.س';
  return new Intl.NumberFormat('ar-SA').format(amount) + ' ر.س';
}

export function toHijriDate(gregorianDateStr?: string): string {
  try {
    const d = gregorianDateStr ? new Date(gregorianDateStr) : new Date();
    if (isNaN(d.getTime())) return '1447-01-01';
    // Umm al-Qura calendar, Latin digits, formatted as YYYY-MM-DD to match stored DECISION_DATE_H values.
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    const year = get('year').replace(/\D/g, '');
    return `${year}-${get('month')}-${get('day')}`;
  } catch (_e) {
    return '1447-01-01';
  }
}

export function formatGregorian(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

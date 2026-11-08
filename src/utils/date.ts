export function formatSAR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ر.س';
  return new Intl.NumberFormat('ar-SA').format(amount) + ' ر.س';
}

export function toHijriDate(gregorianDateStr?: string): string {
  try {
    const d = gregorianDateStr ? new Date(gregorianDateStr) : new Date();
    if (isNaN(d.getTime())) return '1447-01-01 هـ';
    // Use Intl DateTimeFormat with islamic-umalqura calendar
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch (_e) {
    return '1447-01-01 هـ';
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

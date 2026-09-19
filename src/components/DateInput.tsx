import React from 'react';
import { useTranslation } from 'react-i18next';

interface DateInputProps {
  value: string; // yyyy-MM-dd (internal format)
  onChange: (value: string) => void;
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-surface-300)',
  backgroundColor: 'var(--bg-main)',
  color: 'var(--text-main)',
  fontSize: '1rem',
  outline: 'none',
};

export function DateInput({ value, onChange }: DateInputProps) {
  const { i18n } = useTranslation();
  const isHr = i18n.language === 'hr';

  // Parse yyyy-MM-dd
  const parts = (value || '').split('-');
  const year  = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || 1;
  const day   = parseInt(parts[2], 10) || 1;

  const daysInMonth = new Date(year, month, 0).getDate();

  const emit = (d: number, m: number, y: number) => {
    onChange(
      `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const daySelect = (
    <select value={day} onChange={e => emit(parseInt(e.target.value, 10), month, year)} style={selectStyle}>
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
        <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
      ))}
    </select>
  );

  const monthSelect = (
    <select value={month} onChange={e => {
      const newM = parseInt(e.target.value, 10);
      const maxDay = new Date(year, newM, 0).getDate();
      emit(Math.min(day, maxDay), newM, year);
    }} style={selectStyle}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
      ))}
    </select>
  );

  const yearSelect = (
    <select value={year} onChange={e => emit(day, month, parseInt(e.target.value, 10))} style={selectStyle}>
      {years.map(y => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );

  const sep = <span style={{ color: 'var(--text-muted)' }}>/</span>;

  if (isHr) {
    // DD / MM / YYYY
    return (
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {daySelect}{sep}{monthSelect}{sep}{yearSelect}
      </div>
    );
  }

  // MM / DD / YYYY  (English)
  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      {monthSelect}{sep}{daySelect}{sep}{yearSelect}
    </div>
  );
}

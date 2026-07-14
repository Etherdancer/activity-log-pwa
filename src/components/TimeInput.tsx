import React from 'react';
import { useTranslation } from 'react-i18next';

interface TimeInputProps {
  value: string; // HH:mm (24h format)
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  // Parse current value
  const [hoursStr, minutesStr] = (value || '00:00').split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10) || 0;

  if (isNaN(hours)) hours = 0;

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newH = parseInt(e.target.value, 10);
    if (isEnglish) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      if (ampm === 'PM' && newH !== 12) newH += 12;
      if (ampm === 'AM' && newH === 12) newH = 0;
    }
    onChange(`${newH.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newM = parseInt(e.target.value, 10);
    onChange(`${hours.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`);
  };

  const handleAmPmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAmPm = e.target.value;
    let newH = hours;
    const isPm = hours >= 12;
    if (newAmPm === 'PM' && !isPm) {
      newH = (hours + 12) % 24;
    } else if (newAmPm === 'AM' && isPm) {
      newH = hours - 12;
    }
    onChange(`${newH.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-surface-300)',
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontSize: '1rem',
    outline: 'none',
  };

  if (isEnglish) {
    let displayHour = hours % 12;
    if (displayHour === 0) displayHour = 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    return (
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <select value={displayHour} onChange={handleHourChange} style={selectStyle}>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <span>:</span>
        <select value={minutes} onChange={handleMinuteChange} style={selectStyle}>
          {Array.from({ length: 60 }).map((_, i) => (
            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
          ))}
        </select>
        <select value={ampm} onChange={handleAmPmChange} style={{ ...selectStyle, marginLeft: '0.25rem' }}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    );
  }

  // 24h format
  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <select value={hours} onChange={handleHourChange} style={selectStyle}>
        {Array.from({ length: 24 }).map((_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span>:</span>
      <select value={minutes} onChange={handleMinuteChange} style={selectStyle}>
        {Array.from({ length: 60 }).map((_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
    </div>
  );
}

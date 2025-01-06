import { useState } from 'react';
import styles from './birthdateInput.module.css';

interface BirthdateInputProps {
  onChange: (date: { year: string; month: string; day: string }) => void;
}

export default function BirthdateInput({ onChange }: BirthdateInputProps) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
    onChange({ year: e.target.value, month, day });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(e.target.value);
    onChange({ year, month: e.target.value, day });
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDay(e.target.value);
    onChange({ year, month, day: e.target.value });
  };

  const years = Array.from({ length: 100 }, (_, i) =>
    (new Date().getFullYear() - i).toString(),
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0'),
  );
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, '0'),
  );

  return (
    <div className={styles.inputGroup}>
      <span className={styles.label}>생년월일</span>
      <div className={styles.selectGroup}>
        <select value={year} onChange={handleYearChange} className={styles.select}>
          <option value="">연도</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={month} onChange={handleMonthChange} className={styles.select}>
          <option value="">월</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={day} onChange={handleDayChange} className={styles.select}>
          <option value="">일</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

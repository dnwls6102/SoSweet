import styles from './selectInput.module.css';

interface SelectInputProps {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function SelectInput({
  title,
  value,
  options,
  onChange,
}: SelectInputProps) {
  return (
    <div className={styles.inputGroup}>
      <span className={styles.label}>{title}</span>
      <div className={styles.buttonGroup}>
        {options.map((option) => (
          <button
            key={option}
            className={`${styles.button} ${value === option ? styles.selected : ''}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

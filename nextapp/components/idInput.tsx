import styles from './idInput.module.css';

interface inputProps {
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheck: () => void;
}

export default function IDInput({
  title,
  value,
  onChange,
  onCheck,
}: inputProps) {
  return (
    <div className={styles.inputGroup}>
      <span className={styles.label}>{title}</span>
      <input
        className={styles.input}
        placeholder={title}
        value={value}
        onChange={onChange}
      />
      <button className={styles.button} onClick={onCheck}>
        중복확인
      </button>
    </div>
  );
}

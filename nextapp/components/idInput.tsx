import styles from './idInput.module.css';

interface inputProps {
  title: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function IDInput({ title, value, onChange }: inputProps) {
  return (
    <div className={styles.input}>
      <span className={styles.title}>{title}</span>
      <input
        className={styles.rinput}
        placeholder={title}
        value={value}
        onChange={onChange}
      />
      <button className={styles.button}>중복확인</button>
    </div>
  );
}

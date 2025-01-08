import styles from './titleInput.module.css';

interface inputProps {
  title: string;
  value: string;
  type: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TitleInput({
  title,
  value,
  type,
  onChange,
}: inputProps) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{title}</label>
      <input 
        type={type}
        className={styles.input}
        placeholder={title}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

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
    <div className={styles.input}>
      <span className={styles.title}>{title}</span>
      <input
        className={styles.rinput}
        placeholder={title}
        value={value}
        type={type}
        onChange={onChange}
      />
    </div>
  );
}
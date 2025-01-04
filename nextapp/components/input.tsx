import styles from './input.module.css';

interface inputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type: string;
}

export default function Input(props: inputProps) {
  return (
    <input
      className={styles.input}
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.onChange}
      type={props.type}
    ></input>
  );
}

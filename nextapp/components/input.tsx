import styles from './input.module.css';

interface inputProps {
  placeholder: string;
}

export default function Input(props: inputProps) {
  return (
    <input className={styles.input} placeholder={props.placeholder}></input>
  );
}

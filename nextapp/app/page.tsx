import styles from './page.module.css';
import SmallForm from '@/components/smallForm';
import Input from '@/components/input';
import Link from 'next/link';

export default function Main() {
  return (
    <div className={styles.wrapper}>
      <SmallForm>
        <p className={styles.logo}>💖소스윗</p>
        <Input placeholder="아이디"></Input>
        <div className={styles.contentwrapper}>
          <Input placeholder="비밀번호"></Input>
        </div>
        <div className={styles.inlinewrapper}>
          <Link href="/MainPage">
            <button className={styles.button}>로그인</button>
          </Link>
          <Link href="/Signin">
            <button className={styles.button}>회원가입</button>
          </Link>
        </div>
      </SmallForm>
    </div>
  );
}

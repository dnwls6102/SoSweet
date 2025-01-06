import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export default async function Main() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access');

  if (token) {
    console.log('토큰 있음');
    redirect('/MainPage');
  }

  return <LoginClient />;
export default function Main() {
  return (
    <div className={styles.wrapper}>
      <SmallForm>
        <p className={styles.logo}>💖소스윗</p>
        <div className={styles.contentwrapper}>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>아이디</label>
            <input className={styles.input} placeholder="아이디를 입력하세요" />
          </div>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>비밀번호</label>
            <input 
              className={styles.input} 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
            />
          </div>
        </div>
        <div className={styles.inlinewrapper}>
          <Link href="/Signin">
            <button className={styles.button}>회원가입</button>
          </Link>
          <Link href="/MainPage">
            <button className={styles.button}>로그인</button>
          </Link>
        </div>
      </SmallForm>
    </div>
  );
}

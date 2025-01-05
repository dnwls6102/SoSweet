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
}

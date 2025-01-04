import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export default async function Main() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access');

  if (token) {
    redirect('/MainPage');
  }

  return <LoginClient />;
}

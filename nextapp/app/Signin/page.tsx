'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MiddleForm from '@/components/middleForm';
import IDInput from '@/components/idInput';
import TitleInput from '@/components/titleInput';
import BirthdateInput from '@/components/birthdateInput';
import SelectInput from '@/components/selectInput';
import styles from './page.module.css';

export default function Signin() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [checkpwd, setCheckpwd] = useState('');
  const [birthdate, setBirthdate] = useState({ year: '', month: '', day: '' });
  const [job, setJob] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [flag, setFlag] = useState(false);

  const [toastMsg, setToastMsg] = useState(''); // 토스트 메시지

  const router = useRouter();

  useEffect(() => {
    function checkPassword() {
      if (password === '' || checkpwd === '') {
        setFlag(false);
        setToastMsg(''); // 비밀번호 입력이 하나라도 비었을 때 메시지 초기화
      } else if (password !== checkpwd) {
        setToastMsg('비밀번호가 일치하지 않습니다');
        setFlag(false);
      } else {
        setToastMsg(''); // 비밀번호가 일치하면 메시지 꺼짐
        setFlag(true);
      }
    }
    checkPassword();
  }, [password, checkpwd]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setId(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleCheckpwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckpwd(e.target.value);
  };

  const handleBirthdateChange = (date: {
    year: string;
    month: string;
    day: string;
  }) => {
    setBirthdate(date);
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJob(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleGenderChange = (value: string) => {
    setGender(value);
  };

  const handleCheckId = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/users/check`,
        {
          // const response = await fetch('http://localhost:4000/users/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.isExists) {
          console.log('이미 사용 중인 아이디입니다.');
          setToastMsg('이미 사용 중인 아이디입니다.');
        } else {
          console.log('사용 가능한 아이디입니다.');
          setToastMsg('사용 가능한 아이디입니다!');
        }
      } else {
        console.log('아이디 중복 확인에 실패했습니다.');
      }
    } catch (error) {
      console.log('서버 오류가 발생했습니다: ', error);
    }
  };

  const handleSubmit = async () => {
    if (flag === false) {
      setToastMsg('비밀번호 체크를 다시 한 번 해보세요');
    } else {
      const userData = {
        user_id: id,
        user_password: password,
        user_nickname: name,
        user_birth: birthdate,
        user_job: job,
        user_gender: gender,
      };

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/users`,
          {
            // const response = await fetch('http://localhost:4000/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          },
        );

        if (response.ok) {
          console.log('회원가입 성공');
          setToastMsg('회원가입 성공!');
          router.push('/');
        } else {
          console.error('회원가입 실패');
        }
      } catch (error) {
        console.error('서버 오류:', error);
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <MiddleForm>
        <p className={styles.title}>회원가입</p>
        <IDInput
          title="아이디"
          value={id}
          onChange={handleIdChange}
          onCheck={handleCheckId}
        />
        <TitleInput
          title="비밀번호"
          value={password}
          onChange={handlePasswordChange}
          type="password"
        />
        <TitleInput
          title="비밀번호 확인"
          value={checkpwd}
          onChange={handleCheckpwdChange}
          type="password"
        />
        <p className={`${styles.toast} ${toastMsg ? styles.visible : ''}`}>
          {toastMsg}
        </p>
        <BirthdateInput onChange={handleBirthdateChange} />
        <TitleInput
          title="닉네임"
          value={name}
          onChange={handleNameChange}
          type="text"
        />
        <TitleInput
          title="직업"
          value={job}
          onChange={handleJobChange}
          type="text"
        />
        <SelectInput
          title="성별"
          value={gender}
          options={['남성', '여성']}
          onChange={handleGenderChange}
        />
        <div className={styles.submitButtonWrapper}>
          <button className={styles.submitButton} onClick={handleSubmit}>
            회원가입
          </button>
        </div>
      </MiddleForm>
    </div>
  );
}

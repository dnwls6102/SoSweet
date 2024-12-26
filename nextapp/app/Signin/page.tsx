'use client';

import { useState } from 'react';
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

  const handleSubmit = async () => {
    const userData = {
      id,
      password,
      checkpwd,
      birthdate,
      job,
      name,
      gender,
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        // 요청이 성공했을 때의 처리
        console.log('회원가입 성공');
      } else {
        // 요청이 실패했을 때의 처리
        console.error('회원가입 실패');
      }
    } catch (error) {
      console.error('서버 오류:', error);
    }
  };

  return (
    <div className={styles.wrapper}>
      <MiddleForm>
        <p className={styles.title}>회원가입</p>
        <IDInput title="아이디" value={id} onChange={handleIdChange} />
        <TitleInput
          title="비밀번호"
          value={password}
          onChange={handlePasswordChange}
        />
        <TitleInput
          title="비밀번호 확인"
          value={checkpwd}
          onChange={handleCheckpwdChange}
        />
        <BirthdateInput onChange={handleBirthdateChange} />
        <TitleInput
          title="이름(닉네임)"
          value={name}
          onChange={handleNameChange}
        />
        <TitleInput title="직업" value={job} onChange={handleJobChange} />
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

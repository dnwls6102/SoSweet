'use client';

import styles from './page.module.css';
import Image from 'next/image';
import MiddleForm from '@/components/middleForm';
import { useState } from 'react';

// type UserInfo = {
//   name: string;
//   birthDate: string;
//   job: string;
//   rank: string;
//   score: string;
//   gender: string;
// };

// async function fetchUserInfo(): Promise<UserInfo> {
//   // 서버에서 유저 정보를 가져오는 함수
//   return {
//     name: '최유진',
//     birthDate: '1998-12-18',
//     job: '스타트업 사장',
//     rank: '브론즈',
//     score: '36전 5애프터',
//   };
// }

export default function MyPage() {
  const [userInfo, setUserInfo] = useState({
    name: '최유진',
    birthDate: '1998-12-18',
    job: '스타트업 사장',
    gender: '여성',
    rank: '브론즈',
    score: '36전 5애프터',
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileImage, setProfileImage] = useState('/MyPageLogo.svg');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setProfileImage(reader.result.toString());
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    console.log('User Info Saved:', userInfo);
    // 여기에 서버로 데이터를 전송하는 로직 추가
  };

  return (
    <div className={styles.wrapper}>
      <MiddleForm>
        <div className={styles.userInfo}>
          <h2>마이 페이지</h2>
          <div className={styles.userDetails}>
            <div>
              <label htmlFor="profileUpload">
                <Image
                  src="/MyPageLogo.svg"
                  alt="프로필 이미지"
                  width={80}
                  height={80}
                  className={styles.profileImage}
                />
              </label>
              <input
                type="file"
                id="profileUpload"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div>
              {isEditingName ? (
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={handleNameChange}
                  className={styles.inputField}
                />
              ) : (
                <h3>
                  {userInfo.name}{' '}
                  <button
                    onClick={() => setIsEditingName(true)}
                    className={styles.editButton}
                  >
                    수정
                  </button>
                </h3>
              )}
              <p>생년월일: {userInfo.birthDate}</p>
              <p>
                직업:{' '}
                <input
                  type="text"
                  value={userInfo.job}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, job: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </p>
              <p>
                성별:{' '}
                <input
                  type="text"
                  value={userInfo.gender}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </p>
              <button onClick={handleSave} className={styles.editButton}>
                저장
              </button>
            </div>
          </div>
        </div>
        <div className={styles.userRank}>
          <h2>나의 소개팅 등급</h2>
          <Image
            src="/bronze-icon.svg"
            alt="등급 이미지"
            width={150}
            height={80}
            className={styles.rankImage}
          />
          <p>
            당신의 소개팅 등급은 <strong>{userInfo.rank}</strong> 입니다
          </p>
          <p>총 소개팅 전적: {userInfo.score}</p>
        </div>
      </MiddleForm>
    </div>
  );
}
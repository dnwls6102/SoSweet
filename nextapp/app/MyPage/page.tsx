'use client';

import styles from './page.module.css';
import Image from 'next/image';
import { useState } from 'react';

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
      <div className={styles.content}>
        <div className={styles.userInfo}>
          <h2 className={styles.sectionTitle}>마이 페이지</h2>
          <div className={styles.userDetails}>
            <div>
              <label htmlFor="profileUpload">
                <Image
                  src={profileImage}
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
            <div className={styles.userInfoText}>
              {isEditingName ? (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>이름</span>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={handleNameChange}
                    className={styles.inputField}
                  />
                </div>
              ) : (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>이름</span>
                  <span className={styles.readOnlyField}>{userInfo.name}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className={styles.editButton}
                  >
                    수정
                  </button>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>생년월일</span>
                <span className={styles.readOnlyField}>
                  {userInfo.birthDate}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>직업</span>
                <input
                  type="text"
                  value={userInfo.job}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, job: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>성별</span>
                <input
                  type="text"
                  value={userInfo.gender}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className={styles.inputField}
                />
              </div>
              <button onClick={handleSave} className={styles.editButton}>
                저장
              </button>
            </div>
          </div>
        </div>
        {/* <div className={styles.userRank}>
          <h2 className={styles.sectionTitle}>나의 소개팅 등급</h2>
          <Image
            src="/bronze-icon.svg"
            alt="등급 이미지"
            width={150}
            height={80}
            className={styles.rankImage}
          />
          <p className={styles.rankText}>
            당신의 소개팅 등급은 <strong>{userInfo.rank}</strong> 입니다
          </p>
          <p className={styles.rankText}>총 소개팅 전적: {userInfo.score}</p>
        </div> */}
      </div>
    </div>
  );
}

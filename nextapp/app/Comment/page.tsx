'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import MiddleForm from '@/components/middleForm';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  user_id: string;
  iat: number;
  exp: number;
}

export default function RatingPage() {
  const [rating, setRating] = useState(0); // 선택된 별점
  const [feedback, setFeedback] = useState(''); // 텍스트 입력 값
  const router = useRouter();
  const token = Cookies.get('access');
  let ID = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    ID = decoded.user_id;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  const handleStarClick = (index: number) => {
    setRating(index + 1); // 클릭한 별까지 색칠
  };

  const handleSubmit = async () => {
    const data = {
      rating,
      feedback,
    };

    try {
      const response = await fetch('/api/submit-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('평가가 성공적으로 전송되었습니다.');
      } else {
        alert('평가 전송에 실패했습니다.');
        router.push('/Feedback');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <MiddleForm>
        <h2>상대와의 대화를 별점으로 매기면?</h2>
        <div className={styles.stars}>
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={index < rating ? styles.filledStar : styles.emptyStar}
              onClick={() => handleStarClick(index)}
            >
              ★
            </span>
          ))}
        </div>
        <h2>상대에게 한 마디 부탁드려요!</h2>
        <textarea
          className={styles.textarea}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="상대에게 하고 싶은 말을 적어주세요."
        />
        <h2>나는 이 사람과 다시</h2>
        <div className={styles.actions}>
          <button className={styles.likeButton}>만나고 싶다</button>
          <button className={styles.dislikeButton}>보기 싫다</button>
        </div>
        <button className={styles.submitButton} onClick={handleSubmit}>
          전송
        </button>
      </MiddleForm>
    </div>
  );
}

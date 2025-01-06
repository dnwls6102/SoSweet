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
  const [comment, setComment] = useState(''); // 텍스트 입력 값
  const [like, setLike] = useState(false);
  const router = useRouter();
  const token = Cookies.get('access');
  let user_id = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    user_id = decoded.user_id;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  const handleHeartClick = (index: number) => {
    setRating(index + 1); // 클릭한 별까지 색칠
  };

  const handleSubmit = async () => {
    const data = {
      user_id,
      rating,
      comment,
      like,
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
      <div className={styles.container}>
        <h2 className={styles.title}>상대와의 대화는 어떠셨나요?</h2>
        <div className={styles.hearts}>
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={index < rating ? styles.filledHeart : styles.emptyHeart}
              onClick={() => handleHeartClick(index)}
            >
              ♥
            </span>
          ))}
        </div>
        <h2 className={styles.title}>상대에게 한 마디 남겨주세요!</h2>
        <textarea
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="상대의 느낌이나 인상적이었던 점, 하고 싶은 말을 적어주세요 ♥"
        />
        <h2 className={styles.title}>다음에 또 만나고 싶으신가요?</h2>
        <div className={styles.actions}>
          <button className={styles.likeButton}>
            다시 만나고 싶어요 ♥
          </button>
          <button className={styles.dislikeButton}>
            만나고 싶지 않아요
          </button>
        </div>
        <button className={styles.submitButton}>
          평가 완료하기
        </button>
      </div>
    </div>
  );
}

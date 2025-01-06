'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import MiddleForm from '@/components/middleForm';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setPartnerFeedback } from '../../store/feedbackSlice';

interface UserPayload {
  user_id: string;
  iat: number;
  exp: number;
}

interface Comments {
  [user_id: string]: {
    rating: number;
    like: boolean;
    comment: string;
  };
}

export default function RatingPage() {
  const [rating, setRating] = useState(0); // 선택된 별점
  const [comment, setComment] = useState(''); // 텍스트 입력 값
  const [like, setLike] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const router = useRouter();
  const socket = useSelector((state: RootState) => state.socket.socket);
  const room = useSelector((state: RootState) => state.socket.room);
  const dispatch = useDispatch();

  const token = Cookies.get('access');
  let user_id = '';
  if (token) {
    const decoded = jwtDecode<UserPayload>(token);
    user_id = decoded.user_id;
  } else {
    alert('유효하지 않은 접근입니다.');
    router.replace('/');
  }

  useEffect(() => {
    if (!socket) return;

    socket.on('receiveFeedback', (feedbacks: Comments) => {
      console.log('전체 피드백 데이터 수신:', feedbacks);
      // 상대방의 피드백 찾기
      const partnerFeedback = Object.entries(feedbacks).find(
        ([id, _]) => id !== user_id,
      );

      if (partnerFeedback) {
        const [_, feedback] = partnerFeedback;
        // boolean으로 변환하여 저장
        const partnerData = {
          rating: feedback.rating,
          comment: feedback.comment,
          like: feedback.like,
        };
        console.log('상대방의 피드백:', partnerData);
        dispatch(setPartnerFeedback(partnerData));
      }

      router.push('/Feedback');
    });

    return () => {
      socket.off('receiveFeedback');
    };
  }, [socket, router, dispatch, user_id]);

  const handleStarClick = (index: number) => {
    setRating(index + 1); // 클릭한 별까지 색칠
  };

  const handleSubmit = async () => {
    if (!socket || !room) {
      console.error('소켓 또는 방 정보가 없습니다.');
      return;
    }

    const data = {
      user_id,
      rating,
      comment,
      like,
      room,
    };

    console.log('피드백 제출:', data);
    socket.emit('submitFeedback', data);
    setWaiting(true);
  };

  if (waiting) {
    return <div>상대방 응답 대기중...</div>;
  }

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
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="상대에게 하고 싶은 말을 적어주세요."
        />
        <h2>나는 이 사람과 다시</h2>
        <div className={styles.actions}>
          <button className={styles.likeButton} onClick={() => setLike(true)}>
            만나고 싶다
          </button>
          <button
            className={styles.dislikeButton}
            onClick={() => setLike(false)}
          >
            보기 싫다
          </button>
        </div>
        <button className={styles.submitButton} onClick={handleSubmit}>
          전송
        </button>
      </MiddleForm>
    </div>
  );
}

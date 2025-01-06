'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setPartnerFeedback } from '../../store/feedbackSlice';
import { setIsAIChat } from '../../store/aiFlagSlice';
import { setGPTFeedback } from '../../store/GPTfeedbackSlice';

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
        ([id]) => id !== user_id,
      );
      console.log('상대방의 피드백: ', partnerFeedback);

      if (partnerFeedback) {
        const [, feedback] = partnerFeedback;
        // boolean으로 변환하여 저장
        const partnerData = {
          rating: feedback.rating,
          comment: feedback.comment,
          like: feedback.like,
        };
        console.log('상대방의 피드백:', partnerData);
        dispatch(setPartnerFeedback(partnerData));
        dispatch(setIsAIChat(false));
      }
      //소켓 연결 해제
      socket.off('receiveFeedback');
      socket.disconnect();
      router.push('/Feedback');
    });

    return () => {
      socket.off('receiveFeedback');
    };
  }, [socket, router, dispatch, user_id]);

  const handleHeartClick = (index: number) => {
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
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/analysis`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ room_id: room }),
          credentials: 'include',
        },
      );
      if (response.ok) {
        const data = await response.json();
        dispatch(setGPTFeedback(data.analysis));
        console.log('대화 분석 결과:', data);
      }
    } catch (error) {
      console.error('대화 분석 요청 실패:', error);
    }
  };

  if (waiting) {
    return <div>상대방 응답 대기중...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h2 className={styles.title}>상대와의 대화는 어떠셨나요?</h2>
        <div className={styles.hearts}>
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={
                index < rating ? styles.filledHeart : styles.emptyHeart
              }
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
          <button className={styles.likeButton} onClick={() => setLike(true)}>
            다시 만나고 싶어요 ♥
          </button>
          <button
            className={styles.dislikeButton}
            onClick={() => setLike(false)}
          >
            만나고 싶지 않아요
          </button>
        </div>
        <button className={styles.submitButton} onClick={handleSubmit}>
          평가 완료하기
        </button>
      </div>
    </div>
  );
}

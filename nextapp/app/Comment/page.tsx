'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  setPartnerFeedback,
  setSummary,
  setConclusion,
} from '../../store/feedbackSlice';
import { setIsAIChat } from '../../store/aiFlagSlice';

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
  const [user_id, setUserID] = useState('');
  const router = useRouter();
  const socket = useSelector((state: RootState) => state.socket.socket);
  const room = useSelector((state: RootState) => state.socket.room);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const token = Cookies.get('access');
    if (token) {
      const decoded = jwtDecode<UserPayload>(token);
      setUserID(decoded.user_id);
    } else {
      alert('유효하지 않은 접근입니다.');
      router.replace('/');
    }

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

    // 뒤로가기 이벤트 발생 시 메인 페이지로 이동
    window.addEventListener('popstate', () => {
      router.push('/MainPage');
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
      room_id: room,
    };

    console.log('피드백 제출:', data);
    setWaiting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/human/dialog/analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user_id,
          }),
          credentials: 'include',
        },
      );
      if (response.ok) {
        const result = await response.json();
        console.log('대화 분석 받음');
        const data = JSON.parse(result);
        console.log(data.analysis);
        console.log(data.conclusion);
        dispatch(setSummary(data.analysis)); //서버에서 어떻게 줄 건지 확인
        dispatch(setConclusion(data.conclusion));
      } else {
        console.error('서버에서 분석을 반환하지 않음');
      }
      socket.emit('submitFeedback', data);
    } catch (error) {
      console.error('분석 반환 요청 실패:', error);
    }
  };

  if (waiting) {
    return (
      <div className={styles.loading}>
        <p>상대방의 응답을 기다리고 있어요</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.logo}>💖소스윗</div>
        <div className={styles.section}>
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
        </div>
        <h2 className={styles.title}>상대에게 한 마디 남겨주세요!</h2>
        <div className={styles.section}>
          <textarea
            className={styles.textarea}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="상대의 느낌이나 인상적이었던 점, 하고 싶은 말을 적어주세요 ♥"
          />
        </div>
        <h2 className={styles.title}>다음에 또 만나고 싶으신가요?</h2>
        <div className={styles.actions}>
          <button className={styles.likeButton} onClick={() => setLike(true)}>
            💕 <br /> 다시 만나고 싶어요
          </button>
          <button
            className={styles.dislikeButton}
            onClick={() => setLike(false)}
          >
            💔 <br /> 만나고 싶지 않아요
          </button>
        </div>
        <button className={styles.submitButton} onClick={handleSubmit}>
          평가 완료하기
        </button>
      </div>
    </div>
  );
}

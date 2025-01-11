'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './page.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function FeedbackAI() {
  const summary = useSelector((state: RootState) => state.GPTfeedback.summary);
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>상대의 한줄 평</h1>
        <div className={styles.content}>
          <div className={styles.imageSection}>
            <Image
              src="/john.webp"
              alt="AI 이미지"
              width={400}
              height={400}
              className={styles.aiImage}
            />
          </div>
          <div className={styles.feedbackSection}>
            <p className={styles.feedbackText}>{summary}</p>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.moreButton}`}
                onClick={() => {
                  router.push('/SetAI');
                }}
              >
                한번 더 하기!
              </button>
              <button
                className={`${styles.button} ${styles.mainButton}`}
                onClick={() => router.push('/MainPage')}
              >
                메인 화면으로
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import styles from './videobox.module.css';

interface VideoProps {
  keys: string;
  value: number;
  videoref: React.RefObject<HTMLVideoElement | null>;
  autoplay?: boolean;
  muted?: boolean;
  playsinline?: boolean;
}

export default function Videobox({ videoref, keys, value, autoplay = false, muted = false, playsinline = false }: VideoProps) {
  return (
    <div className={styles.videobox}>
      <span className={styles.label}>
        {keys}: {value}%
      </span>
      <video ref={videoref} autoPlay={autoplay} muted={muted} playsInline={playsinline}></video>
    </div>
  );
}

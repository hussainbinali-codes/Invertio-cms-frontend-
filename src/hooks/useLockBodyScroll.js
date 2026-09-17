import { useEffect } from 'react';

const getLockCount = () => parseInt(document.body.getAttribute('data-scroll-locks') || '0', 10);
const setLockCount = (cnt) => {
  const count = Math.max(0, cnt);
  if (count > 0) {
    document.body.setAttribute('data-scroll-locks', String(count));
    document.body.style.overflow = 'hidden';
  } else {
    document.body.removeAttribute('data-scroll-locks');
    document.body.style.overflow = '';
  }
};

export const useLockBodyScroll = (lock) => {
  useEffect(() => {
    if (!lock) return;

    setLockCount(getLockCount() + 1);

    return () => {
      setLockCount(getLockCount() - 1);
    };
  }, [lock]);
};


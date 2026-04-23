'use client';

import { useEffect } from 'react';

function hasVisibleModal(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const modals = document.querySelectorAll<HTMLElement>('.MuiModal-root');
  return Array.from(modals).some((modal) => {
    if (modal.classList.contains('MuiModal-hidden')) {
      return false;
    }
    return modal.getAttribute('aria-hidden') !== 'true';
  });
}

export function ModalScrollLockGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const body = document.body;

    let locked = false;
    let lockedScrollY = 0;
    let prevBodyPosition = '';
    let prevBodyTop = '';
    let prevBodyLeft = '';
    let prevBodyRight = '';
    let prevBodyWidth = '';
    let prevBodyOverflow = '';
    let prevHtmlOverflow = '';

    const lockScroll = () => {
      if (locked) {
        return;
      }

      locked = true;
      lockedScrollY = window.scrollY;
      prevBodyPosition = body.style.position;
      prevBodyTop = body.style.top;
      prevBodyLeft = body.style.left;
      prevBodyRight = body.style.right;
      prevBodyWidth = body.style.width;
      prevBodyOverflow = body.style.overflow;
      prevHtmlOverflow = html.style.overflow;

      body.style.position = 'fixed';
      body.style.top = `-${lockedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    };

    const unlockScroll = () => {
      if (!locked) {
        return;
      }

      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, lockedScrollY);
      locked = false;
    };

    const syncScrollLock = () => {
      if (hasVisibleModal()) {
        lockScroll();
      } else {
        unlockScroll();
      }
    };

    const observer = new MutationObserver(syncScrollLock);
    observer.observe(body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden'],
    });

    syncScrollLock();
    window.addEventListener('focus', syncScrollLock);
    window.addEventListener('resize', syncScrollLock);

    return () => {
      observer.disconnect();
      window.removeEventListener('focus', syncScrollLock);
      window.removeEventListener('resize', syncScrollLock);
      unlockScroll();
    };
  }, []);

  return null;
}

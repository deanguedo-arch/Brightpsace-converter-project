import * as React from 'react';

const { useCallback, useRef, useState } = React;

export function useAppError({ autoDismissMs = 10000 } = {}) {
  const [appError, setAppError] = useState(null); // { type, message, details? }
  const dismissTimerRef = useRef(null);

  const dismissError = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    setAppError(null);
  }, []);

  const handleError = useCallback(
    (type, message, details = null) => {
      const error = { type, message, details };
      setAppError(error);
      console.error(`[${String(type).toUpperCase()}]`, message, details || '');

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => setAppError(null), autoDismissMs);
    },
    [autoDismissMs],
  );

  return { appError, handleError, dismissError };
}


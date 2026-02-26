import * as React from 'react';

const { useCallback, useEffect, useMemo, useState } = React;

export function usePreviewState() {
  const [previewModule, setPreviewModule] = useState(null);
  const [enablePreviewScripts, setEnablePreviewScripts] = useState(true);
  const [previewFrameNonce, setPreviewFrameNonce] = useState(0);

  const previewIdentity = previewModule?.id || previewModule?.title || '';
  useEffect(() => {
    if (!previewIdentity) return;
    setEnablePreviewScripts(true);
    setPreviewFrameNonce((n) => n + 1);
  }, [previewIdentity]);

  const openPreview = useCallback((item) => setPreviewModule(item), []);
  const closePreview = useCallback(() => setPreviewModule(null), []);

  const resetPreview = useCallback(() => {
    setPreviewFrameNonce((n) => n + 1);
  }, []);

  const togglePreviewScripts = useCallback(() => {
    setEnablePreviewScripts((v) => !v);
    setPreviewFrameNonce((n) => n + 1);
  }, []);

  const sandbox = enablePreviewScripts
    ? null
    : 'allow-same-origin allow-forms';

  const iframeKey = useMemo(
    () =>
      `${previewModule?.id || previewModule?.title || 'preview'}-${previewFrameNonce}-${
        enablePreviewScripts ? 'scripts' : 'noscripts'
      }`,
    [previewModule, previewFrameNonce, enablePreviewScripts],
  );

  return {
    previewModule,
    enablePreviewScripts,
    openPreview,
    closePreview,
    resetPreview,
    togglePreviewScripts,
    sandbox,
    iframeKey,
  };
}

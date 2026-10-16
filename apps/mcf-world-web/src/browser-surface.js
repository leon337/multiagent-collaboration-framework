import { normalizeHttpUrl } from './world-domain.js';

export function createBrowserSurface({
  surface,
  frame,
  urlLabel,
  openExternalButton,
  returnButton,
  onOpen,
  onClose,
}) {
  let currentUrl = null;

  function open(value) {
    currentUrl = normalizeHttpUrl(value);
    frame.src = currentUrl;
    urlLabel.textContent = currentUrl;
    surface.hidden = false;
    onOpen?.(currentUrl);
    return currentUrl;
  }

  function close() {
    currentUrl = null;
    frame.removeAttribute('src');
    urlLabel.textContent = 'Local';
    surface.hidden = true;
    onClose?.();
  }

  function openExternal() {
    if (!currentUrl) {
      return;
    }

    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  }

  openExternalButton.addEventListener('click', openExternal);
  returnButton.addEventListener('click', close);

  return {
    open,
    close,
    getCurrentUrl() {
      return currentUrl;
    },
  };
}

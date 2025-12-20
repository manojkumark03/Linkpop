'use client';

import * as React from 'react';

type Options = {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInput?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.getAttribute('role') === 'textbox') return true;

  return false;
}

export function useHotkey(
  hotkey: string,
  callback: (event: KeyboardEvent) => void,
  options?: Options,
) {
  const { enabled = true, preventDefault = true, ignoreInput = true } = options ?? {};

  React.useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      if (ignoreInput && isEditableTarget(event.target)) return;

      const matches =
        hotkey === '?'
          ? event.key === '?' || (event.key === '/' && event.shiftKey)
          : event.key === hotkey;

      if (!matches) return;

      if (preventDefault) event.preventDefault();
      callback(event);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, enabled, hotkey, ignoreInput, preventDefault]);
}

import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled
 * 
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': () => console.log('Search'),
 *   'esc': () => closeDialog(),
 * }, true);
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled || !shortcuts) return;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build key combination string
      const parts = [];
      if (ctrl) parts.push('ctrl');
      if (shift) parts.push('shift');
      if (alt) parts.push('alt');
      parts.push(key);

      const combination = parts.join('+');
      const handler = shortcuts[combination];

      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common shortcut combinations
export const SHORTCUTS = {
  SEARCH: 'ctrl+k',
  ESCAPE: 'esc',
  REFRESH: 'ctrl+r',
  NEW: 'ctrl+n',
  SAVE: 'ctrl+s',
  DELETE: 'delete',
  CLOSE: 'esc',
};










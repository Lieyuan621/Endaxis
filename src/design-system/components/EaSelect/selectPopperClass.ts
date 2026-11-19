import type { EaControlSize } from '../types';

export function getEaSelectPopperClass(size: EaControlSize, customClass = '') {
  return ['ea-floating-surface', 'ea-select-popper', `ea-select-popper--${size}`, customClass]
    .filter(Boolean)
    .join(' ');
}

/**
 * Is the HUD in its phone layout?
 *
 * The breakpoint lives in one place so the CSS and the components that have to
 * change *structure* -- not just size -- agree about when it applies. Reading
 * `window.innerWidth` once in a `useState` initialiser, which is what this
 * replaces, silently disagrees with the stylesheet the moment the window is
 * resized or the device rotated.
 */

import { useEffect, useState } from 'react';

export const COMPACT_QUERY = '(max-width: 860px)';

export function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia(COMPACT_QUERY).matches
  );

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia(COMPACT_QUERY);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}

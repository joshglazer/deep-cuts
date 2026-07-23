import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// Reports false during SSR and the client's first render (before hydration),
// then true once mounted in the browser — useful for content that can only
// be computed client-side (e.g. the visitor's timezone) without triggering a
// server/client hydration mismatch.
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

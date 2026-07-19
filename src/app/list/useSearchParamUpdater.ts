"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Navigates with one query param changed. Passing null drops the key, which
 * is how each control clears itself back to its default — that keeps the
 * canonical URL clean (/list rather than /list?sort=recently-played) so the
 * default view has a single address.
 */
export function useSearchParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function setSearchParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };
}

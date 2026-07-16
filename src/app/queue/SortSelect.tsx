"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Selector } from "@/design/atoms/Selector";
import { ALBUM_SORT_OPTIONS, DEFAULT_ALBUM_SORT, type AlbumSort } from "./sortAlbums";

export function SortSelect({ sort }: { sort: AlbumSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === DEFAULT_ALBUM_SORT) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Selector
      label="Sort by"
      size="sm"
      value={sort}
      onChange={handleChange}
      options={ALBUM_SORT_OPTIONS}
    />
  );
}

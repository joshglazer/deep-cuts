"use client";

import { Selector } from "@/design/atoms/Selector";
import { ALBUM_SORT_OPTIONS, DEFAULT_ALBUM_SORT, type AlbumSort } from "./sortAlbums";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

interface SortSelectProps {
  sort: AlbumSort;
  options?: { value: AlbumSort; label: string }[];
}

export function SortSelect({
  sort,
  options = ALBUM_SORT_OPTIONS,
}: Readonly<SortSelectProps>) {
  const setSearchParam = useSearchParamUpdater();

  return (
    <Selector
      label="Sort by"
      isLabelHidden
      size="sm"
      value={sort}
      onChange={(value) =>
        setSearchParam("sort", value === DEFAULT_ALBUM_SORT ? null : value)
      }
      options={options}
    />
  );
}

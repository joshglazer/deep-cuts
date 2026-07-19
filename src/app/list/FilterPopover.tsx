"use client";

import type { ReactNode } from "react";
import { LuListFilter } from "react-icons/lu";
import { CompletedToggle } from "./CompletedToggle";
import { SortSelect } from "./SortSelect";
import { ViewToggle } from "./ViewToggle";
import type { AlbumSort } from "./sortAlbums";
import { Divider } from "@/design/atoms/Divider";
import { Heading } from "@/design/atoms/Heading";
import { Icon } from "@/design/atoms/Icon";
import { IconButton } from "@/design/atoms/IconButton";
import { Popover } from "@/design/atoms/Popover";
import { HStack, StackItem, VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";

interface FilterRowProps {
  label: string;
  children: ReactNode;
}

// The label sits outside the control, in a fixed-width column, so the
// controls line up with each other across rows.
function FilterRow({ label, children }: Readonly<FilterRowProps>) {
  return (
    <HStack gap="sm" vAlign="center">
      <Text type="label" as="label" textWrap="nowrap" className="w-20 shrink-0">
        {label}
      </Text>
      {children}
    </HStack>
  );
}

interface FilterPopoverProps {
  view?: "flat" | "artist";
  sort: AlbumSort;
  sortOptions?: { value: AlbumSort; label: string }[];
  showCompleted: boolean;
  hasCompletedAlbums: boolean;
}

export function FilterPopover({
  view,
  sort,
  sortOptions,
  showCompleted,
  hasCompletedAlbums,
}: Readonly<FilterPopoverProps>) {
  return (
    <Popover
      placement="below"
      alignment="end"
      label="Filter list"
      width={288}
      content={
        <VStack gap="md">
          <Heading level={4}>Filter & sort</Heading>
          <Divider />
          {view && (
            <FilterRow label="Group by">
              <ViewToggle view={view} />
            </FilterRow>
          )}
          {(view === undefined || view === "flat") && (
            <FilterRow label="Sort by">
              <StackItem size="fill">
                <SortSelect sort={sort} options={sortOptions} />
              </StackItem>
            </FilterRow>
          )}
          {hasCompletedAlbums && <CompletedToggle showCompleted={showCompleted} />}
        </VStack>
      }
    >
      <IconButton
        icon={<Icon icon={LuListFilter} size="sm" />}
        label="Filter"
        tooltip="Filter"
        variant="secondary"
        size="sm"
      />
    </Popover>
  );
}

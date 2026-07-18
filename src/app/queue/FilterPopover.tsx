"use client";

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

export function FilterPopover({
  view,
  sort,
  sortOptions,
  showCompleted,
  hasCompletedAlbums,
}: {
  view?: "flat" | "artist";
  sort: AlbumSort;
  sortOptions?: { value: AlbumSort; label: string }[];
  showCompleted: boolean;
  hasCompletedAlbums: boolean;
}) {
  return (
    <Popover
      placement="below"
      alignment="end"
      label="Filter queue"
      width={288}
      content={
        <VStack gap="md">
          <Heading level={4}>Filter & sort</Heading>
          <Divider />
          {view && (
            <HStack gap="sm" vAlign="center">
              <Text type="label" as="label" textWrap="nowrap" className="w-20 shrink-0">
                Group by
              </Text>
              <ViewToggle view={view} />
            </HStack>
          )}
          {(view === undefined || view === "flat") && (
            <HStack gap="sm" vAlign="center">
              <Text type="label" as="label" textWrap="nowrap" className="w-20 shrink-0">
                Sort by
              </Text>
              <StackItem size="fill">
                <SortSelect sort={sort} options={sortOptions} />
              </StackItem>
            </HStack>
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

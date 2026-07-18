import type { ReactNode } from "react";
import { Heading } from "../atoms/Heading";
import { HStack } from "../atoms/Stack";
import { PageBreadcrumbs, type Crumb } from "./PageBreadcrumbs";

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Crumb[];
  titleActions?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  breadcrumbs,
  titleActions,
  actions,
}: Readonly<PageHeaderProps>) {
  return (
    <>
      {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} className="mb-4" />}
      <HStack gap="md" vAlign="center" justify="between" className="mb-8">
        <HStack gap="sm" vAlign="center">
          <Heading level={1}>{title}</Heading>
          {titleActions}
        </HStack>
        {actions}
      </HStack>
    </>
  );
}

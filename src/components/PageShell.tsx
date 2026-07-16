import type { ReactNode } from "react";
import { Header } from "./Header";
import { PageHeader } from "@/design/molecules/PageHeader";
import type { Crumb } from "@/design/molecules/PageBreadcrumbs";

export function PageShell({
  title,
  breadcrumbs,
  titleActions,
  actions,
  children,
}: {
  title: string;
  breadcrumbs?: Crumb[];
  titleActions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <PageHeader
          title={title}
          breadcrumbs={breadcrumbs}
          titleActions={titleActions}
          actions={actions}
        />
        {children}
      </div>
    </div>
  );
}

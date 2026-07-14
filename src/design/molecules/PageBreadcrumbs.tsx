import { Breadcrumbs, BreadcrumbItem } from "../atoms/Breadcrumbs";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageBreadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <Breadcrumbs className={className}>
      {items.map((item, index) => (
        <BreadcrumbItem
          key={item.href ?? item.label}
          href={item.href}
          isCurrent={index === items.length - 1}
        >
          {item.label}
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
}

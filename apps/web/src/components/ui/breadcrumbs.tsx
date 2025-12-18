import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
} from '@acme/ui';

export type BreadcrumbItemData = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItemData[];
  className?: string;
}) {
  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <BreadcrumbItem key={`${item.label}-${idx}`}>
              {item.href && !isLast ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
              {!isLast ? <BreadcrumbSeparator /> : null}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

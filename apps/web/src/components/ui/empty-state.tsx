import * as React from 'react';
import { Button, Card, CardContent, cn } from '@acme/ui';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {action ? (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

import * as React from 'react';

import { cn } from '../lib/utils';
import { Label } from './label';

export interface FormFieldRenderProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export interface FormFieldProps {
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: (props: FormFieldRenderProps) => React.ReactNode;
}

export function FormField({
  name,
  label,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  const reactId = React.useId();
  const id = `${name}-${reactId}`;
  const descriptionId = `${id}-description`;
  const messageId = `${id}-message`;

  const describedBy =
    [description ? descriptionId : null, error ? messageId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label htmlFor={id} className={cn(error ? 'text-destructive' : undefined)}>
          {label}
        </Label>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {description ? (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={messageId} className="text-destructive text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

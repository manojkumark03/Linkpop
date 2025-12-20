import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@acme/ui';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('matches snapshots for variants', () => {
    const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const;

    for (const variant of variants) {
      const { container, unmount } = render(<Button variant={variant}>Button</Button>);
      expect(container.firstChild).toMatchSnapshot(variant);
      unmount();
    }
  });
});

# @acme/ui

Shared, shadcn-style primitives for the workspace.

## Usage

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetTrigger,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
  useToast,
} from '@acme/ui';
```

## Toasts

The UI package exports a Radix-based toast implementation:

- `toast({...})` to trigger a toast
- `useToast()` to access the toast list
- `Toaster` component to render toasts

In Next.js, mount `<Toaster />` once near the root (see `apps/web/src/app/providers.tsx`).

## Theming

Components are styled with Tailwind + CSS variables (tokens). The tokens live in
`apps/web/src/app/globals.css` and are mapped in `apps/web/tailwind.config.ts`.

This keeps components themeable and dark-mode friendly.

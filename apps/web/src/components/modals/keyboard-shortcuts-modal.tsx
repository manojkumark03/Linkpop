'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@acme/ui';

import { useHotkey } from '@/hooks/use-hotkey';

export function KeyboardShortcutsModal() {
  const [open, setOpen] = React.useState(false);

  useHotkey('?', () => setOpen(true));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Quick actions available across the app.</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Open this dialog</span>
            <kbd className="bg-muted rounded-md border px-2 py-1 text-xs">?</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Close dialogs</span>
            <kbd className="bg-muted rounded-md border px-2 py-1 text-xs">Esc</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

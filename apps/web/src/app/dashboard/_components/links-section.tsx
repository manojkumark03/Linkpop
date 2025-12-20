'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  toast,
} from '@acme/ui';
import {
  Link2,
  Plus,
  Copy,
  Edit3,
  Trash2,
  BarChart3,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

import type { EditorShortLink } from './profile-editor';
import { createShortLinkAction, updateShortLinkAction, deleteShortLinkAction } from '../actions';

interface LinksSectionProps {
  shortLinks: EditorShortLink[];
  isPro: boolean;
  profileSlug: string;
}

export function LinksSection({ shortLinks, isPro, profileSlug }: LinksSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<EditorShortLink | null>(null);

  // Form states
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setSlug('');
    setTargetUrl('');
    setTitle('');
    setIsActive(true);
  }

  function openEditDialog(link: EditorShortLink) {
    setEditingLink(link);
    setSlug(link.slug);
    setTargetUrl(link.targetUrl);
    setTitle(link.title || '');
    setIsActive(link.isActive);
    setEditOpen(true);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditingLink(null);
    resetForm();
  }

  function handleCreateShortLink() {
    if (!slug.trim() || !targetUrl.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      toast({
        title: 'Invalid URL',
        description: 'URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await createShortLinkAction({
        slug: slug.trim(),
        targetUrl: targetUrl.trim(),
        title: title.trim() || null,
      });

      if (!result.ok) {
        toast({
          title: 'Could not create short link',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Short link created',
        description: 'Your short link has been created successfully',
      });

      resetForm();
      setCreateOpen(false);
      router.refresh();
    });
  }

  function handleUpdateShortLink() {
    if (!editingLink || !slug.trim() || !targetUrl.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      toast({
        title: 'Invalid URL',
        description: 'URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await updateShortLinkAction(editingLink.id, {
        slug: slug.trim(),
        targetUrl: targetUrl.trim(),
        title: title.trim() || null,
        isActive,
      });

      if (!result.ok) {
        toast({
          title: 'Could not update short link',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Short link updated',
        description: 'Your short link has been updated successfully',
      });

      closeEditDialog();
      router.refresh();
    });
  }

  function handleDeleteShortLink(linkId: string) {
    if (!confirm('Are you sure you want to delete this short link?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteShortLinkAction(linkId);

      if (!result.ok) {
        toast({
          title: 'Could not delete short link',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Short link deleted',
        description: 'The short link has been deleted',
      });

      router.refresh();
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The URL has been copied to your clipboard',
    });
  }

  const shortUrl = (slug: string) => `${window.location.origin}/s/${slug}`;

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Links - URL Shortener
          </CardTitle>
          <CardDescription>
            Create branded short links that redirect to any URL. PRO feature only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="text-muted-foreground mb-4">
              Upgrade to PRO to access the URL shortener and create branded short links.
            </div>
            <Button asChild>
              <a href="/pricing">Upgrade to PRO</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Links - URL Shortener
            </CardTitle>
            <CardDescription>
              Create and manage branded short links that redirect to URLs
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Create Short Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shortLinks.length === 0 ? (
          <div className="py-8 text-center">
            <Link2 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No short links yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first short link to start tracking clicks
            </p>
            <Button onClick={() => setCreateOpen(true)} disabled={isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Create Short Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shortLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="truncate font-medium">{link.title || link.slug}</h4>
                    <Badge variant={link.isActive ? 'default' : 'secondary'}>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="font-mono">{shortUrl(link.slug)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(shortUrl(link.slug))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-muted-foreground truncate text-sm">→ {link.targetUrl}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(shortUrl(link.slug))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(shortUrl(link.slug), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(link)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteShortLink(link.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/dashboard/analytics?tab=links`}>
                      <BarChart3 className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Short Link</DialogTitle>
            <DialogDescription>
              Create a branded short link that redirects to your target URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-link"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                This will be: {shortUrl(slug || 'your-slug')}
              </p>
            </div>
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Link"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShortLink} disabled={isPending}>
              Create Short Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Short Link</DialogTitle>
            <DialogDescription>Update your short link settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-link"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                This will be: {shortUrl(slug || 'your-slug')}
              </p>
            </div>
            <div>
              <Label htmlFor="edit-title">Title (optional)</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Link"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="edit-targetUrl">Target URL</Label>
              <Input
                id="edit-targetUrl"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isPending}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShortLink} disabled={isPending}>
              Update Short Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

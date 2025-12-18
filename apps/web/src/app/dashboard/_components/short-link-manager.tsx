'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
  Switch,
} from '@acme/ui';
import { Link2, Plus, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { createShortLinkAction, updateShortLinkAction, deleteShortLinkAction } from '../actions';

type ShortLink = {
  id: string;
  slug: string;
  targetUrl: string;
  title?: string | null;
  isActive: boolean;
  createdAt: string;
};

type ShortLinkManagerProps = {
  user: {
    id: string;
    subscriptionTier: 'FREE' | 'PRO';
  };
  initialShortLinks: ShortLink[];
};

export function ShortLinkManager({ user, initialShortLinks }: ShortLinkManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shortLinks, setShortLinks] = useState<ShortLink[]>(initialShortLinks);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);

  // Form state
  const [slug, setSlug] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // FREE user - show upgrade prompt
  if (user.subscriptionTier !== 'PRO') {
    return (
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Link2 className="text-primary h-8 w-8" />
            <div className="flex-1">
              <h3 className="font-semibold">URL Shortener</h3>
              <p className="text-muted-foreground text-sm">
                Create branded short links with redirect tracking and analytics
              </p>
            </div>
            <Button asChild>
              <Link href="/pricing">Upgrade to PRO</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function resetForm() {
    setSlug('');
    setTargetUrl('');
    setTitle('');
    setIsActive(true);
  }

  function openCreateModal() {
    resetForm();
    setEditingLink(null);
    setCreateOpen(true);
  }

  function openEditModal(shortLink: ShortLink) {
    setEditingLink(shortLink);
    setSlug(shortLink.slug);
    setTargetUrl(shortLink.targetUrl);
    setTitle(shortLink.title || '');
    setIsActive(shortLink.isActive);
    setCreateOpen(true);
  }

  async function handleSubmit() {
    if (!slug.trim() || !targetUrl.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in slug and target URL',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = editingLink
        ? await updateShortLinkAction(editingLink.id, {
            slug: slug.trim(),
            targetUrl: targetUrl.trim(),
            title: title.trim() || undefined,
            isActive,
          })
        : await createShortLinkAction({
            slug: slug.trim(),
            targetUrl: targetUrl.trim(),
            title: title.trim() || undefined,
          });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to save short link');
      }

      const updatedLink = result.shortLink!;
      setShortLinks((prev) => {
        if (editingLink) {
          return prev.map((l) => (l.id === editingLink.id ? updatedLink : l));
        } else {
          return [...prev, updatedLink];
        }
      });

      setCreateOpen(false);
      resetForm();
      setEditingLink(null);

      toast({
        title: editingLink ? 'Short link updated' : 'Short link created',
        description: 'Your short link has been saved successfully.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save short link',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(shortLinkId: string) {
    if (
      !confirm('Are you sure you want to delete this short link? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const result = await deleteShortLinkAction(shortLinkId);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete short link');
      }

      setShortLinks((prev) => prev.filter((l) => l.id !== shortLinkId));

      toast({
        title: 'Short link deleted',
        description: 'Your short link has been deleted.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete short link',
        variant: 'destructive',
      });
    }
  }

  async function handleToggleActive(shortLinkId: string, active: boolean) {
    try {
      const result = await updateShortLinkAction(shortLinkId, { isActive: active });
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update short link');
      }

      const updatedLink = result.shortLink!;
      setShortLinks((prev) => prev.map((l) => (l.id === shortLinkId ? updatedLink : l)));

      toast({
        title: active ? 'Short link activated' : 'Short link deactivated',
        description: `Your short link is now ${active ? 'active' : 'inactive'}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update short link',
        variant: 'destructive',
      });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard',
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🔗 URL Shortener</CardTitle>
              <CardDescription>Create branded short links with analytics</CardDescription>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Short Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {shortLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-3">
                <Link2 className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">No short links yet</h3>
              <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                Create your first short link to start tracking clicks and redirects
              </p>
              <Button size="lg" className="mt-6" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Short Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shortLinks.map((shortLink) => (
                <div
                  key={shortLink.id}
                  className="border-border bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{shortLink.title || shortLink.slug}</h4>
                      <span className="text-muted-foreground text-xs">
                        linkforest.com/s/{shortLink.slug}
                      </span>
                      {!shortLink.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-sm">
                      {shortLink.targetUrl}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Created {new Date(shortLink.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`https://linkforest.com/s/${shortLink.slug}`)}
                      title="Copy short link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(shortLink.id, !shortLink.isActive)}
                      title={shortLink.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {shortLink.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(shortLink)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(shortLink.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Short Link' : 'Create New Short Link'}</DialogTitle>
            <DialogDescription>
              Create a branded short link that redirects to your target URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2 text-sm">linkforest.com/s/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="my-link"
                    maxLength={50}
                    className="flex-1"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome link"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                type="url"
              />
            </div>

            {editingLink && (
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Active</Label>
                <span className="text-muted-foreground text-sm">(Inactive links return 404)</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingLink ? 'Update Link' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

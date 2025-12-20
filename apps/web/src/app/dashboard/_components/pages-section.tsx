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
  FileText,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff,
  Blocks,
} from 'lucide-react';

import type { EditorPage } from './profile-editor';
import { BlockEditor } from './block-editor';
import type { Block } from '@/types/blocks';
import {
  createPageAction,
  updatePageAction,
  deletePageAction,
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  getBlocksForPage,
} from '../actions';

interface PagesSectionProps {
  pages: EditorPage[];
  profileId: string;
}

export function PagesSection({ pages, profileId }: PagesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<EditorPage | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Block editor state
  const [blocks, setBlocks] = useState<Block[]>([]);

  function resetForm() {
    setTitle('');
    setSlug('');
    setIcon('');
    setIsPublished(true);
  }

  function openEditDialog(page: EditorPage) {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setIcon(page.icon || '');
    setIsPublished(page.isPublished);
    setEditOpen(true);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditingPage(null);
    resetForm();
  }

  async function openBlockEditor(page: EditorPage) {
    setEditingPage(page);

    try {
      const result = await getBlocksForPage(page.id);
      if (result.ok) {
        setBlocks(result.blocks);
      } else {
        setBlocks([]);
        toast({
          title: 'Error loading blocks',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setBlocks([]);
      toast({
        title: 'Error loading blocks',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }

    setBlockEditorOpen(true);
  }

  function closeBlockEditor() {
    setBlockEditorOpen(false);
    setEditingPage(null);
    setBlocks([]);
  }

  function handleCreatePage() {
    if (!title.trim() || !slug.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await createPageAction({
        profileId,
        title: title.trim(),
        slug: slug.trim(),
        icon: icon.trim() || null,
        isPublished,
      });

      if (!result.ok) {
        toast({
          title: 'Could not create page',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Page created',
        description: 'Your page has been created successfully',
      });

      resetForm();
      setCreateOpen(false);
      router.refresh();
    });
  }

  function handleUpdatePage() {
    if (!editingPage || !title.trim() || !slug.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await updatePageAction(editingPage.id, {
        title: title.trim(),
        slug: slug.trim(),
        icon: icon.trim() || null,
        isPublished,
      });

      if (!result.ok) {
        toast({
          title: 'Could not update page',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Page updated',
        description: 'Your page has been updated successfully',
      });

      closeEditDialog();
      router.refresh();
    });
  }

  function handleDeletePage(pageId: string, pageTitle: string) {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deletePageAction(pageId);

      if (!result.ok) {
        toast({
          title: 'Could not delete page',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Page deleted',
        description: 'The page has been deleted',
      });

      router.refresh();
    });
  }

  function handleTogglePublish(pageId: string, currentStatus: boolean, pageTitle: string) {
    startTransition(async () => {
      const result = await updatePageAction(pageId, {
        isPublished: !currentStatus,
      });

      if (!result.ok) {
        toast({
          title: 'Could not update page',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `Page ${!currentStatus ? 'published' : 'unpublished'}`,
        description: `"${pageTitle}" is now ${!currentStatus ? 'published' : 'unpublished'}`,
      });

      router.refresh();
    });
  }

  async function handleBlockEditorSave(updatedBlocks: Block[]) {
    if (!editingPage) return;

    try {
      // Save each block
      for (const block of updatedBlocks) {
        if (block.id.startsWith('temp-')) {
          // Create new block
          await createBlockAction({
            pageId: editingPage.id,
            type: block.type,
            order: block.order,
            content: block.content,
          });
        } else {
          // Update existing block
          await updateBlockAction(block.id, {
            order: block.order,
            content: block.content,
          });
        }
      }

      toast({
        title: 'Blocks saved',
        description: 'Your block changes have been saved',
      });

      closeBlockEditor();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error saving blocks',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const pageUrl = (slug: string) => `${window.location.origin}/[profile]/${slug}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pages - Block Builder
            </CardTitle>
            <CardDescription>
              Create rich content pages with multiple block types (markdown, buttons, copy text,
              expand)
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No pages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first page to start building rich content with blocks
            </p>
            <Button onClick={() => setCreateOpen(true)} disabled={isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Create Page
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="truncate font-medium">{page.title}</h4>
                    <Badge variant={page.isPublished ? 'default' : 'secondary'}>
                      {page.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    {page.icon && <span className="text-lg">{page.icon}</span>}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="font-mono">/{page.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openBlockEditor(page)}>
                    <Blocks className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(page.id, page.isPublished, page.title)}
                  >
                    {page.isPublished ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(page)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePage(page.id, page.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/dashboard/analytics?tab=pages`}>
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
            <DialogTitle>Create Page</DialogTitle>
            <DialogDescription>Create a new page with block-based content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Page"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-page"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                This will be: /{slug || 'your-slug'}
              </p>
            </div>
            <div>
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📝"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                Use an emoji or icon to represent your page
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={isPending}
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={isPending}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Update your page settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Page"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-page"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                This will be: /{slug || 'your-slug'}
              </p>
            </div>
            <div>
              <Label htmlFor="edit-icon">Icon (optional)</Label>
              <Input
                id="edit-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📝"
                disabled={isPending}
              />
              <p className="text-muted-foreground mt-1 text-sm">
                Use an emoji or icon to represent your page
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={isPending}
              />
              <Label htmlFor="edit-isPublished">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePage} disabled={isPending}>
              Update Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Editor Dialog */}
      <Dialog open={blockEditorOpen} onOpenChange={setBlockEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page Blocks</DialogTitle>
            <DialogDescription>Add and arrange blocks to build your page content</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {editingPage && <BlockEditor blocks={blocks} onBlocksChange={setBlocks} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBlockEditor}>
              Cancel
            </Button>
            <Button onClick={() => handleBlockEditorSave(blocks)} disabled={isPending}>
              Save Blocks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

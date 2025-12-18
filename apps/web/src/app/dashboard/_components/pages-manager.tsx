'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Textarea,
  toast,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@acme/ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  order: number;
};

export function PagesManager({
  profileId,
  initialPages,
}: {
  profileId: string;
  initialPages: Page[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pages, setPages] = useState<Page[]>(initialPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !editingPage) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, editingPage]);

  function resetForm() {
    setTitle('');
    setSlug('');
    setContent('');
    setIsPublished(true);
  }

  function openCreateModal() {
    resetForm();
    setEditingPage(null);
    setCreateOpen(true);
  }

  function openEditModal(page: Page) {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setIsPublished(page.isPublished);
    setEditOpen(true);
  }

  async function handleSubmit() {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await fetch(`/api/profiles/${profileId}/pages`, {
        method: editingPage ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingPage && { pageId: editingPage.id }),
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          content: content.trim(),
          isPublished,
        }),
      }).then((r) => r.json());

      if (!result.ok) {
        throw new Error(result.error || 'Failed to save page');
      }

      const updatedPage = result.page;
      setPages((prev) => {
        if (editingPage) {
          return prev.map((p) => (p.id === editingPage.id ? updatedPage : p));
        } else {
          return [...prev, updatedPage];
        }
      });

      setCreateOpen(false);
      setEditOpen(false);
      resetForm();
      setEditingPage(null);

      toast({
        title: editingPage ? 'Page updated' : 'Page created',
        description: 'Your page has been saved successfully.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save page',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(pageId: string) {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await fetch(`/api/profiles/${profileId}/pages/${pageId}`, {
        method: 'DELETE',
      }).then((r) => r.json());

      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete page');
      }

      setPages((prev) => prev.filter((p) => p.id !== pageId));

      toast({
        title: 'Page deleted',
        description: 'Your page has been deleted.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete page',
        variant: 'destructive',
      });
    }
  }

  async function handleTogglePublish(pageId: string, published: boolean) {
    try {
      const result = await fetch(`/api/profiles/${profileId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: published }),
      }).then((r) => r.json());

      if (!result.ok) {
        throw new Error(result.error || 'Failed to update page');
      }

      const updatedPage = result.page;
      setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));

      toast({
        title: published ? 'Page published' : 'Page unpublished',
        description: `Your page is now ${published ? 'live' : 'draft'}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update page',
        variant: 'destructive',
      });
    }
  }

  const sampleMarkdown = `# My Page

Welcome to my page!

## Features
- Feature 1
- Feature 2

[Link to something](https://example.com)

\`\`\`javascript
console.log('Hello World!');
\`\`\`
`;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📄 Pages</CardTitle>
              <CardDescription>Create markdown pages for your profile</CardDescription>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="bg-primary/10 mb-4 rounded-full p-3">
                <Plus className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">No pages yet</h3>
              <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                Create your first page to share more about yourself
              </p>
              <Button size="lg" className="mt-6" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Page
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="border-border bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{page.title}</h4>
                      <span className="text-muted-foreground text-xs">/{page.slug}</span>
                      {!page.isPublished && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {page.content.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(page.id, !page.isPublished)}
                      title={page.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {page.isPublished ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
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

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a markdown page that visitors can access from your profile.
            </DialogDescription>
          </DialogHeader>
          <PageForm
            title={title}
            setTitle={setTitle}
            slug={slug}
            setSlug={setSlug}
            content={content}
            setContent={setContent}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setCreateOpen(false)}
            sampleContent={sampleMarkdown}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Make changes to your page content.</DialogDescription>
          </DialogHeader>
          <PageForm
            title={title}
            setTitle={setTitle}
            slug={slug}
            setSlug={setSlug}
            content={content}
            setContent={setContent}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setEditOpen(false)}
            isEditing
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PageForm({
  title,
  setTitle,
  slug,
  setSlug,
  content,
  setContent,
  isPublished,
  setIsPublished,
  previewMode,
  setPreviewMode,
  onSubmit,
  submitting,
  onCancel,
  sampleContent,
  isEditing = false,
}: {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
  previewMode: boolean;
  setPreviewMode: (value: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel: () => void;
  sampleContent?: string;
  isEditing?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="About Me"
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="about-me"
            maxLength={64}
          />
          <p className="text-muted-foreground text-xs">URL: /{slug || 'your-slug'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Content (Markdown)</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!previewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={previewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode(true)}
            >
              Preview
            </Button>
          </div>
        </div>

        {previewMode ? (
          <div className="prose prose-sm dark:prose-invert min-h-[400px] max-w-none rounded-lg border p-6">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <div className="text-muted-foreground italic">Start writing to see preview...</div>
            )}
          </div>
        ) : (
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={sampleContent || '# Your page title\n\nWrite your content here...'}
            rows={20}
            className="font-mono text-sm"
          />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
        <Label htmlFor="published">Published</Label>
        {!isPublished && (
          <span className="text-muted-foreground text-sm">(Only you can see this page)</span>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : isEditing ? (
            'Update Page'
          ) : (
            'Create Page'
          )}
        </Button>
      </div>
    </div>
  );
}

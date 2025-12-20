'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import {
  CheckCircle2,
  MoreHorizontal,
  Link as LinkIcon,
  Plus,
  Link2,
  Copy,
  FileText,
  Settings,
  Trash2,
  RefreshCw,
  Edit3,
} from 'lucide-react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
  cn,
} from '@acme/ui';

import {
  ProfilePreview,
  type PreviewLink,
  type PreviewProfile,
} from '@/components/profile-preview';
import { PagesManager } from './pages-manager';
import type { Page as PageType } from '@/types/pages';
import { slugify } from '@/lib/slugs';
import type { ThemeSettings } from '@/lib/theme-settings';

import {
  archiveLinkAction,
  checkProfileSlugAvailabilityAction,
  createLinkAction,
  createProfileAction,
  duplicateProfileAction,
  exportProfileAction,
  reorderLinksAction,
  updateLinkAction,
  updateProfileAction,
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  reorderBlocksAction,
  getBlocksForLink,
} from '../actions';
import type { Block } from '@/types/blocks';

import { IconPicker } from './icon-picker';
import { LinksDndList } from './links-dnd-list';
import { CustomScriptsEditor } from './custom-scripts-editor';
import { ShortLinkManager } from './short-link-manager';
import { BlockEditor } from './block-editor';

export type EditorProfile = {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  status: 'ACTIVE' | 'DISABLED';
  themeSettings: ThemeSettings;
  customHeadScript?: string | null;
  customBodyScript?: string | null;
};

export type EditorLink = {
  id: string;
  profileId: string;
  slug: string;
  title: string;
  url: string;
  linkType: 'URL' | 'COPY_FIELD' | 'BLOCK';
  position: number;
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  metadata: Prisma.JsonValue;
};

export type EditorPage = PageType;

export type EditorShortLink = {
  id: string;
  slug: string;
  targetUrl: string;
  title?: string | null;
  isActive: boolean;
  createdAt: string;
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidCopyFieldValue(value: string) {
  return value.trim().length > 0;
}

function downloadTextFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getLinkMetadata(link: Pick<EditorLink, 'metadata'>): Prisma.JsonObject {
  if (!link.metadata || typeof link.metadata !== 'object' || Array.isArray(link.metadata)) {
    return {};
  }

  return link.metadata as Prisma.JsonObject;
}

export function ProfileEditor({
  user,
  profiles,
  profile,
  links,
  pages = [],
  shortLinks = [],
}: {
  user: { id: string; email: string; name: string | null; subscriptionTier: 'FREE' | 'PRO' };
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string | null;
    image?: string | null;
    status: 'ACTIVE' | 'DISABLED';
  }>;
  profile: EditorProfile;
  links: EditorLink[];
  pages?: EditorPage[];
  shortLinks?: EditorShortLink[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profileState, setProfileState] = useState(profile);
  const [linksState, setLinksState] = useState<EditorLink[]>(links);

  const [switchingProfile, setSwitchingProfile] = useState(false);

  // Link creation state
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkUrlTouched, setNewLinkUrlTouched] = useState(false);
  const [newLinkType, setNewLinkType] = useState<'URL' | 'COPY_FIELD'>('URL');
  const [addingLink, setAddingLink] = useState(false);

  // Block-based link state
  const [linkMode, setLinkMode] = useState<'simple' | 'blocks'>('simple');
  const [newBlockLinkTitle, setNewBlockLinkTitle] = useState('');
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [blockEditorBlocks, setBlockEditorBlocks] = useState<Block[]>([]);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Dialog states
  const [actionsOpen, setActionsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Profile creation state
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Profile duplication state
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateSlug, setDuplicateSlug] = useState('');
  const [duplicateSubmitting, setDuplicateSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  const isPublished = profileState.status === 'ACTIVE';
  const profilesUsedText = `${profiles.length}/5 profiles used`;
  const atProfileLimit = profiles.length >= 5;

  const newUrlValid =
    newLinkType === 'URL'
      ? isValidHttpUrl(newLinkUrl.trim())
      : isValidCopyFieldValue(newLinkUrl.trim());

  const previewProfile: PreviewProfile = useMemo(
    () => ({
      slug: profileState.slug,
      displayName: profileState.displayName,
      bio: profileState.bio,
      image: profileState.image,
      themeSettings: profileState.themeSettings,
    }),
    [profileState],
  );

  const previewLinks: PreviewLink[] = useMemo(
    () =>
      linksState.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        linkType: l.linkType,
        status: l.status,
        metadata: l.metadata,
      })),
    [linksState],
  );

  const previewPages = useMemo(
    () =>
      pages
        .filter((p) => p.isPublished)
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          icon: p.icon,
        })),
    [pages],
  );

  function updateProfileDraft(patch: Partial<EditorProfile>) {
    setProfileState((prev) => ({ ...prev, ...patch }));
  }

  function saveProfile(patch: Partial<EditorProfile>) {
    const optimistic = { ...profileState, ...patch };
    setProfileState(optimistic);

    startTransition(async () => {
      const result = await updateProfileAction(profile.id, {
        slug: optimistic.slug,
        displayName: optimistic.displayName,
        bio: optimistic.bio,
        image: optimistic.image,
        status: optimistic.status,
        themeSettings: optimistic.themeSettings,
      });

      if (!result.ok) {
        toast({
          title: 'Could not save profile',
          description: result.error,
          variant: 'destructive',
        });
        router.refresh();
      }
    });
  }

  async function handleCreateLink() {
    const title = newLinkTitle.trim();
    const url = newLinkUrl.trim();

    if (!title) return;

    // Validate based on link type
    if (newLinkType === 'URL' && !isValidHttpUrl(url)) {
      setNewLinkUrlTouched(true);
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
        variant: 'destructive',
      });
      return;
    }

    if (newLinkType === 'COPY_FIELD' && !isValidCopyFieldValue(url)) {
      setNewLinkUrlTouched(true);
      toast({
        title: 'Invalid text',
        description: 'Please enter text to copy',
        variant: 'destructive',
      });
      return;
    }

    setAddingLink(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticLink: EditorLink = {
      id: tempId,
      profileId: profile.id,
      slug: 'temp',
      title,
      url,
      linkType: newLinkType,
      position: linksState.length,
      status: 'ACTIVE',
      metadata: {},
    };

    setLinksState((prev) => [...prev, optimisticLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkUrlTouched(false);
    setNewLinkType('URL');

    const result = await createLinkAction({
      profileId: profile.id,
      title,
      url,
      linkType: newLinkType,
      status: 'ACTIVE',
      metadata: {},
    });

    if (!result.ok) {
      setLinksState((prev) => prev.filter((l) => l.id !== tempId));
      toast({ title: 'Could not add link', description: result.error, variant: 'destructive' });
      setAddingLink(false);
      return;
    }

    setLinksState((prev) => prev.map((l) => (l.id === tempId ? result.link : l)));
    setAddingLink(false);
    toast({ title: 'Link added', description: 'Your link has been saved.' });
    router.refresh();
  }

  function handleUpdateLink(linkId: string, patch: Partial<EditorLink>) {
    // Validate based on link type
    if (typeof patch.url === 'string' && patch.url) {
      const linkType = patch.linkType || linksState.find((l) => l.id === linkId)?.linkType || 'URL';
      if (linkType === 'URL' && !isValidHttpUrl(patch.url.trim())) {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid URL (e.g., https://instagram.com/yourname)',
          variant: 'destructive',
        });
        return;
      }
      if (linkType === 'COPY_FIELD' && !isValidCopyFieldValue(patch.url.trim())) {
        toast({
          title: 'Invalid text',
          description: 'Please enter text to copy',
          variant: 'destructive',
        });
        return;
      }
    }

    setLinksState((prev) => prev.map((l) => (l.id === linkId ? { ...l, ...patch } : l)));

    startTransition(async () => {
      const result = await updateLinkAction(linkId, {
        title: patch.title,
        url: patch.url,
        linkType: patch.linkType,
        status: patch.status,
        metadata: patch.metadata,
      });

      if (!result.ok) {
        toast({ title: 'Could not save link', description: result.error, variant: 'destructive' });
        router.refresh();
      }
    });
  }

  function handleArchiveLink(linkId: string) {
    const existing = linksState.find((l) => l.id === linkId);
    setLinksState((prev) => prev.filter((l) => l.id !== linkId));

    startTransition(async () => {
      const result = await archiveLinkAction(linkId);
      if (!result.ok) {
        toast({
          title: 'Could not delete link',
          description: result.error,
          variant: 'destructive',
        });
        if (existing)
          setLinksState((prev) => [...prev, existing].sort((a, b) => a.position - b.position));
        return;
      }

      toast({ title: 'Link deleted' });
      router.refresh();
    });
  }

  function handleReorder(orderedIds: string[]) {
    startTransition(async () => {
      const result = await reorderLinksAction({
        profileId: profile.id,
        orderedLinkIds: orderedIds,
      });
      if (!result.ok) {
        toast({
          title: 'Could not reorder links',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  }

  function handleSwitchProfile(nextProfileId: string) {
    if (nextProfileId === profile.id) return;
    const next = profiles.find((p) => p.id === nextProfileId);

    setSwitchingProfile(true);
    toast({
      title: 'Switched profile',
      description: `Switched to ${next?.displayName || next?.slug || 'profile'}`,
    });

    window.location.href = `/dashboard?profile=${nextProfileId}`;
  }

  async function handleExport(format: 'links-csv' | 'full-json') {
    setExporting(true);
    try {
      const result = await exportProfileAction(profile.id, format);
      if (!result.ok) {
        toast({ title: 'Export failed', description: result.error, variant: 'destructive' });
        return;
      }

      downloadTextFile(result.content, result.mimeType, result.filename);
      toast({ title: 'Export started', description: 'Your download should begin immediately.' });
      setExportOpen(false);
    } finally {
      setExporting(false);
    }
  }

  async function submitCreateProfile() {
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const result = await createProfileAction({
        slug: createSlug.trim(),
        displayName: createName.trim() || undefined,
      });

      if (!result.ok) {
        const message = result.error || 'Could not create profile';
        setCreateError(message);
        toast({ title: 'Create profile failed', description: message, variant: 'destructive' });
        return;
      }

      toast({
        title: 'Profile created',
        description: `Profile created! You're now editing ${result.profile.displayName || result.profile.slug}.`,
      });

      setCreateOpen(false);
      window.location.href = `/dashboard?profile=${result.profile.id}`;
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function submitDuplicateProfile() {
    setDuplicateSubmitting(true);
    setDuplicateError(null);

    try {
      const result = await duplicateProfileAction(profile.id, {
        slug: duplicateSlug.trim(),
        displayName: duplicateName.trim() || undefined,
      });

      if (!result.ok) {
        const message = result.error || 'Could not duplicate profile';
        setDuplicateError(message);
        toast({ title: 'Duplicate failed', description: message, variant: 'destructive' });
        return;
      }

      toast({
        title: 'Profile duplicated',
        description: `Created a copy called ${result.profile.displayName || result.profile.slug}.`,
      });

      setDuplicateOpen(false);
      window.location.href = `/dashboard?profile=${result.profile.id}`;
    } finally {
      setDuplicateSubmitting(false);
    }
  }

  useEffect(() => {
    if (!createOpen) return;
    const fallbackName = user.name || user.email || 'My Profile';
    setCreateName('');
    setCreateSlug(slugify(fallbackName));
    setCreateError(null);
  }, [createOpen, user.email, user.name]);

  useEffect(() => {
    if (!duplicateOpen) return;
    const baseName = profileState.displayName || profileState.slug;
    setDuplicateName(`${baseName} Copy`);
    setDuplicateSlug(`${profileState.slug}-copy`);
    setDuplicateError(null);
  }, [duplicateOpen, profileState.displayName, profileState.slug]);

  // Block-based link handlers
  async function handleCreateBlockLink() {
    const title = newBlockLinkTitle.trim();
    if (!title) return;

    setAddingLink(true);
    try {
      const result = await createLinkAction({
        profileId: profile.id,
        title,
        url: `/${title.toLowerCase().replace(/\s+/g, '-')}`, // placeholder URL
        linkType: 'BLOCK',
      });

      if (!result.ok) {
        toast({
          title: 'Could not create block-based link',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      setLinksState((prev) => [...prev, result.link]);
      setNewBlockLinkTitle('');

      // Open the block editor for the new link
      setTimeout(() => {
        openBlockEditor(result.link.id);
      }, 100);

      toast({
        title: 'Block-based link created',
        description: 'Start adding blocks to build your content',
      });
    } catch (error) {
      toast({
        title: 'Error creating link',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAddingLink(false);
    }
  }

  async function openBlockEditor(linkId: string) {
    setEditingLinkId(linkId);

    try {
      const result = await getBlocksForLink(linkId);
      if (result.ok) {
        setBlockEditorBlocks(result.blocks);
      } else {
        setBlockEditorBlocks([]);
        toast({
          title: 'Error loading blocks',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setBlockEditorBlocks([]);
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
    setEditingLinkId(null);
    setBlockEditorBlocks([]);
  }

  async function handleBlockEditorSave(blocks: Block[]) {
    if (!editingLinkId) return;

    try {
      // Save each block
      for (const block of blocks) {
        if (block.id.startsWith('temp-')) {
          // Create new block
          await createBlockAction({
            linkId: editingLinkId,
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Dialog: actions */}
      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile actions</DialogTitle>
            <DialogDescription>Duplicate this profile or export your data.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={() => setDuplicateOpen(true)}>
              Duplicate This Profile
            </Button>
            <Button type="button" variant="outline" onClick={() => setExportOpen(true)}>
              Export Profile Data
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>Profiles are limited to 5 per account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {createError && <p className="text-destructive text-sm">{createError}</p>}

            <div className="space-y-1">
              <Label htmlFor="create-name">Profile name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="My new profile"
                disabled={createSubmitting}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="create-slug">Username</Label>
              <Input
                id="create-slug"
                value={createSlug}
                onChange={(e) => setCreateSlug(slugify(e.target.value))}
                placeholder="my-profile"
                disabled={createSubmitting}
              />
              <p className="text-muted-foreground text-xs">Public URL: /{createSlug}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitCreateProfile()}
              disabled={!createName.trim() || !createSlug.trim() || createSubmitting}
            >
              {createSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Creating…
                </span>
              ) : (
                'Create profile'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: duplicate */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate {profileState.displayName || profileState.slug}</DialogTitle>
            <DialogDescription>
              Duplicates links and design settings (not analytics).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {duplicateError && <p className="text-destructive text-sm">{duplicateError}</p>}

            <div className="space-y-1">
              <Label htmlFor="dup-name">New profile name</Label>
              <Input
                id="dup-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="My profile copy"
                disabled={duplicateSubmitting}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dup-slug">New username</Label>
              <Input
                id="dup-slug"
                value={duplicateSlug}
                onChange={(e) => setDuplicateSlug(slugify(e.target.value))}
                placeholder="my-profile-copy"
                disabled={duplicateSubmitting}
              />
              <p className="text-muted-foreground text-xs">Public URL: /{duplicateSlug}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDuplicateOpen(false)}
              disabled={duplicateSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitDuplicateProfile()}
              disabled={!duplicateName.trim() || !duplicateSlug.trim() || duplicateSubmitting}
            >
              {duplicateSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Duplicating…
                </span>
              ) : (
                'Duplicate profile'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: export */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export options</DialogTitle>
            <DialogDescription>Download your data immediately.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exporting}
              onClick={() => void handleExport('links-csv')}
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Exporting…
                </span>
              ) : (
                'Export links only (CSV)'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={exporting}
              onClick={() => void handleExport('full-json')}
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Exporting…
                </span>
              ) : (
                'Export full profile (JSON)'
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Tabs interface */}
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="links">
              <Link2 className="mr-2 h-4 w-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="mr-2 h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Link Management</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create and manage your links with the new block-based editor
                </p>
              </div>

              {/* Link Type Toggle */}
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                <Button
                  type="button"
                  variant={linkMode === 'simple' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLinkMode('simple')}
                  className="h-8"
                >
                  Simple
                </Button>
                <Button
                  type="button"
                  variant={linkMode === 'blocks' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLinkMode('blocks')}
                  className="h-8"
                >
                  Blocks
                </Button>
              </div>
            </div>

            {linkMode === 'simple' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Manage Simple Links & Copy Fields
                  </CardTitle>
                  <CardDescription>
                    Add regular links, copy fields, edit, and reorder
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1">
                      <Label htmlFor="newTitle">Title</Label>
                      <Input
                        ref={titleInputRef}
                        id="newTitle"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder={newLinkType === 'COPY_FIELD' ? 'Bitcoin Wallet' : 'Instagram'}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="newUrl">
                        {newLinkType === 'COPY_FIELD' ? 'Text to Copy' : 'URL'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="newUrl"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          onBlur={() => setNewLinkUrlTouched(true)}
                          placeholder={
                            newLinkType === 'COPY_FIELD'
                              ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
                              : 'https://instagram.com/yourname'
                          }
                          className={cn(newLinkUrlTouched && !newUrlValid && 'border-destructive')}
                        />
                        {newLinkUrl.trim() && newUrlValid ? (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600 dark:text-green-400" />
                        ) : null}
                      </div>
                      {newLinkUrlTouched && newLinkUrl.trim() && !newUrlValid ? (
                        <p className="text-destructive text-xs">
                          {newLinkType === 'COPY_FIELD'
                            ? 'Please enter text to copy'
                            : 'Please enter a valid URL (e.g., https://instagram.com/yourname)'}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newLinkType === 'URL' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewLinkType('URL')}
                        className="whitespace-nowrap"
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Link
                      </Button>
                      <Button
                        type="button"
                        variant={newLinkType === 'COPY_FIELD' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setNewLinkType('COPY_FIELD');
                          setNewLinkUrl('');
                          setNewLinkUrlTouched(false);
                        }}
                        className="whitespace-nowrap"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleCreateLink()}
                      disabled={
                        !newLinkTitle.trim() || !newLinkUrl.trim() || !newUrlValid || addingLink
                      }
                    >
                      {addingLink ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="text-current" /> Adding…
                        </span>
                      ) : newLinkType === 'COPY_FIELD' ? (
                        'Add Copy Field'
                      ) : (
                        'Add Link'
                      )}
                    </Button>
                  </div>

                  {linksState.filter((l) => l.linkType !== 'BLOCK').length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                      <div className="bg-primary/10 mb-4 rounded-full p-3">
                        <LinkIcon className="text-primary h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold">No links yet</h3>
                      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
                        Start building your Linkforest by adding your first link
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="mt-6"
                        onClick={() => titleInputRef.current?.focus()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Link
                      </Button>
                    </div>
                  ) : (
                    <LinksDndList
                      links={linksState.filter((l) => l.linkType !== 'BLOCK')}
                      onLinksChange={(updated) => {
                        const blockLinks = linksState.filter((l) => l.linkType === 'BLOCK');
                        setLinksState([...updated, ...blockLinks]);
                      }}
                      onReorder={(orderedIds) => {
                        const nonBlockIds = orderedIds;
                        const blockLinks = linksState.filter((l) => l.linkType === 'BLOCK');
                        const allOrderedIds = [...nonBlockIds, ...blockLinks.map((l) => l.id)];
                        handleReorder(allOrderedIds);
                      }}
                      renderLink={(link, { dragHandle, isDragging }) => {
                        const md = getLinkMetadata(link);

                        return (
                          <div
                            className={cn(
                              'border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5',
                              isDragging && 'ring-ring ring-2',
                            )}
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                              <div className="pt-0.5">{dragHandle}</div>

                              <div className="grid flex-1 gap-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <Label htmlFor={`title-${link.id}`}>Title</Label>
                                    <Input
                                      id={`title-${link.id}`}
                                      value={link.title}
                                      onChange={(e) =>
                                        setLinksState((prev) =>
                                          prev.map((l) =>
                                            l.id === link.id ? { ...l, title: e.target.value } : l,
                                          ),
                                        )
                                      }
                                      onBlur={() =>
                                        handleUpdateLink(link.id, { title: link.title })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`url-${link.id}`}>
                                      {link.linkType === 'COPY_FIELD' ? 'Text to Copy' : 'URL'}
                                    </Label>
                                    <Input
                                      id={`url-${link.id}`}
                                      value={link.url}
                                      onChange={(e) =>
                                        setLinksState((prev) =>
                                          prev.map((l) =>
                                            l.id === link.id ? { ...l, url: e.target.value } : l,
                                          ),
                                        )
                                      }
                                      onBlur={() => handleUpdateLink(link.id, { url: link.url })}
                                      placeholder={
                                        link.linkType === 'COPY_FIELD'
                                          ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
                                          : 'https://instagram.com/yourname'
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                  <div className="space-y-1">
                                    <Label htmlFor={`linkType-${link.id}`}>Type</Label>
                                    <select
                                      id={`linkType-${link.id}`}
                                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                      value={link.linkType}
                                      onChange={(e) => {
                                        const newType = e.target.value as 'URL' | 'COPY_FIELD';
                                        setLinksState((prev) =>
                                          prev.map((l) =>
                                            l.id === link.id ? { ...l, linkType: newType } : l,
                                          ),
                                        );
                                        handleUpdateLink(link.id, { linkType: newType });
                                      }}
                                    >
                                      <option value="URL">Link</option>
                                      <option value="COPY_FIELD">Copy Field</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`status-${link.id}`}>Status</Label>
                                    <select
                                      id={`status-${link.id}`}
                                      className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                      value={link.status}
                                      onChange={(e) => {
                                        const newStatus = e.target.value as
                                          | 'ACTIVE'
                                          | 'HIDDEN'
                                          | 'ARCHIVED';
                                        setLinksState((prev) =>
                                          prev.map((l) =>
                                            l.id === link.id ? { ...l, status: newStatus } : l,
                                          ),
                                        );
                                        handleUpdateLink(link.id, { status: newStatus });
                                      }}
                                    >
                                      <option value="ACTIVE">Active</option>
                                      <option value="HIDDEN">Hidden</option>
                                      <option value="ARCHIVED">Archived</option>
                                    </select>
                                  </div>
                                  <IconPicker
                                    id={`icon-${link.id}`}
                                    value={typeof md.icon === 'string' ? md.icon : undefined}
                                    onChange={(value) => {
                                      const next: Prisma.JsonObject = { ...md };
                                      if (value) {
                                        next.icon = value;
                                      } else {
                                        delete next.icon;
                                      }
                                      handleUpdateLink(link.id, { metadata: next });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end lg:pt-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchiveLink(link.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <span className="sr-only">Delete</span>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Block-Based Links
                  </CardTitle>
                  <CardDescription>
                    Create rich, interactive links with customizable blocks. Perfect for landing
                    pages, product showcases, and detailed descriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Block-based link management */}
                  <div className="space-y-4">
                    {/* Create new block-based link */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="New block-based link title"
                        value={newBlockLinkTitle}
                        onChange={(e) => setNewBlockLinkTitle(e.target.value)}
                      />
                      <Button onClick={handleCreateBlockLink} disabled={!newBlockLinkTitle.trim()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Block Link
                      </Button>
                    </div>

                    {/* Block-based links list */}
                    <div className="space-y-2">
                      {linksState.filter((l) => l.linkType === 'BLOCK').length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                          <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-sm">No block-based links yet</p>
                          <p className="text-xs">
                            Create your first block-based link to get started
                          </p>
                        </div>
                      ) : (
                        linksState
                          .filter((l) => l.linkType === 'BLOCK')
                          .map((link) => (
                            <div
                              key={link.id}
                              className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{link.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    Block-based link • {link.status}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openBlockEditor(link.id)}
                                  >
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit Blocks
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleArchiveLink(link.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <PagesManager profileId={profile.id} initialPages={pages} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>Basic information and theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="displayName">Profile name</Label>
                    <Input
                      id="displayName"
                      value={profileState.displayName ?? ''}
                      onChange={(e) => updateProfileDraft({ displayName: e.target.value })}
                      onBlur={() => saveProfile({ displayName: profileState.displayName })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="slug">Username / slug</Label>
                    <Input
                      id="slug"
                      value={profileState.slug}
                      onChange={(e) => updateProfileDraft({ slug: slugify(e.target.value) })}
                      onBlur={() => saveProfile({ slug: profileState.slug })}
                    />
                    <div className="text-muted-foreground text-xs">
                      Public URL: /{profileState.slug}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    className="border-input bg-background min-h-[96px] w-full rounded-md border px-3 py-2 text-sm"
                    value={profileState.bio ?? ''}
                    onChange={(e) => updateProfileDraft({ bio: e.target.value })}
                    onBlur={() => saveProfile({ bio: profileState.bio })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                  <Input
                    id="avatarUrl"
                    value={profileState.image ?? ''}
                    onChange={(e) => updateProfileDraft({ image: e.target.value })}
                    onBlur={() =>
                      saveProfile({
                        image: profileState.image?.trim() ? profileState.image.trim() : null,
                      })
                    }
                    placeholder="Paste image URL (ImgBB, Imgur, etc.)"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">Published</div>
                    <div className="text-muted-foreground text-xs">
                      Turn off to hide your profile temporarily.
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isPublished ? 'text-green-600' : 'text-muted-foreground',
                      )}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={(checked) => {
                        toast({
                          title: checked ? 'Profile published' : 'Profile set to draft',
                          description: checked
                            ? 'Your profile is now live.'
                            : 'Your profile is hidden (visitors will see a 404).',
                        });
                        saveProfile({ status: checked ? 'ACTIVE' : 'DISABLED' });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRO Features Section */}
            <div className="space-y-6">
              {/* Custom Scripts Editor */}
              <CustomScriptsEditor
                profileId={profile.id}
                user={user}
                initialScripts={{
                  customHeadScript: profileState.customHeadScript,
                  customBodyScript: profileState.customBodyScript,
                }}
              />

              {/* Short Link Manager */}
              <ShortLinkManager user={user} profileId={profile.id} initialShortLinks={shortLinks} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Profile Actions
                </CardTitle>
                <CardDescription>Duplicate, export, or create new profiles</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground text-sm">{profilesUsedText}</div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setActionsOpen(true)}>
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    Actions
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    disabled={atProfileLimit}
                  >
                    + Create New Profile
                  </Button>
                </div>
              </CardContent>
              {atProfileLimit ? (
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm">Maximum 5 profiles reached</p>
                </CardContent>
              ) : null}
            </Card>
          </TabsContent>
        </Tabs>

        {isPending ? (
          <div className="text-muted-foreground text-sm" aria-live="polite">
            Saving changes…
          </div>
        ) : null}
      </div>

      {/* Live Preview */}
      <div className="border-border bg-card rounded-lg border">
        <div className="border-border border-b p-3">
          <div className="text-sm font-medium">Live preview</div>
          <div className="text-muted-foreground text-xs">What your visitors see</div>
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <ProfilePreview
            profile={previewProfile}
            links={previewLinks}
            pages={previewPages}
            showQr
            className="min-h-0"
          />
        </div>
      </div>

      {/* Block Editor Modal */}
      <Dialog open={blockEditorOpen} onOpenChange={(open) => !open && closeBlockEditor()}>
        <DialogContent className="h-[90vh] max-w-[1400px] p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Block Editor
              </DialogTitle>
              <DialogDescription>
                Create and customize blocks for your link. Click on blocks in the list to edit them.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {editingLinkId && (
                <BlockEditor
                  blocks={blockEditorBlocks}
                  onBlocksChange={setBlockEditorBlocks}
                  className="h-full"
                />
              )}
            </div>

            <DialogFooter className="gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={closeBlockEditor}>
                Cancel
              </Button>
              <Button onClick={() => handleBlockEditorSave(blockEditorBlocks)}>Save Blocks</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

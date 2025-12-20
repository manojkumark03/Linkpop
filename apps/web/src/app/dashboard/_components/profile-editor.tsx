'use client';

import { useState, useTransition, useEffect } from 'react';
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
  toast,
} from '@acme/ui';
import {
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  Settings,
  FileText,
  Link2,
} from 'lucide-react';

import { slugify } from '@/lib/slugs';
import type { ThemeSettings } from '@/lib/theme-settings';
import { requireAuth } from '@/lib/auth-helpers';

import { LinksSection } from './links-section';
import { PagesSection } from './pages-section';
import { SettingsSection } from './settings-section';
import {
  updateProfileAction,
  createProfileAction,
  duplicateProfileAction,
  exportProfileAction,
} from '../actions';

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

export type EditorPage = {
  id: string;
  profileId: string;
  title: string;
  slug: string;
  content: string;
  icon: string | null;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type EditorShortLink = {
  id: string;
  slug: string;
  targetUrl: string;
  title?: string | null;
  isActive: boolean;
  createdAt: string;
};

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

export function ProfileEditor({
  user,
  profiles,
  profile,
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
  pages?: EditorPage[];
  shortLinks?: EditorShortLink[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profileState, setProfileState] = useState(profile);

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

  function handleSwitchProfile(nextProfileId: string) {
    if (nextProfileId === profile.id) return;
    const next = profiles.find((p) => p.id === nextProfileId);

    window.location.href = `/dashboard?profile=${nextProfileId}`;
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

  return (
    <div className="space-y-6">
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
            <DialogTitle>Export {profileState.displayName || profileState.slug}</DialogTitle>
            <DialogDescription>Choose the data format you want to export.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleExport('links-csv')}
              disabled={exporting}
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Exporting…
                </span>
              ) : (
                'Export links as CSV'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleExport('full-json')}
              disabled={exporting}
            >
              {exporting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-current" /> Exporting…
                </span>
              ) : (
                'Export full profile as JSON'
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile selector and header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Profile Management
          </CardTitle>
          <CardDescription>Select and manage your profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={profile.id} onValueChange={handleSwitchProfile}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName || p.slug}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {profilesUsedText} • {isPublished ? 'Published' : 'Disabled'}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActionsOpen(true)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={isPublished ? 'outline' : 'default'}
                size="sm"
                onClick={() => saveProfile({ status: isPublished ? 'DISABLED' : 'ACTIVE' })}
                disabled={isPending}
              >
                {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {atProfileLimit ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You've reached the 5 profile limit. Upgrade your plan to add more profiles.
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateOpen(true)}
            disabled={atProfileLimit || createSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Profile
          </Button>
        </CardContent>
      </Card>

      {/* Main content with tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="links" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="links" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="links" className="mt-0">
                <LinksSection
                  shortLinks={shortLinks}
                  isPro={user.subscriptionTier === 'PRO'}
                  profileSlug={profileState.slug}
                />
              </TabsContent>

              <TabsContent value="pages" className="mt-0">
                <PagesSection pages={pages} profileId={profile.id} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsSection
                  user={{ id: user.id, subscriptionTier: user.subscriptionTier }}
                  profile={profileState}
                  profiles={profiles}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

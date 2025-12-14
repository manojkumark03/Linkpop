'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@acme/ui';

import { useProfileStore } from '@/lib/store/profile-store';
import { updateProfileAction, updateLinkAction } from '../actions';
import { updateProfileSchema } from '@/lib/validations/profiles';

import { ProfileFormSection } from './profile-form-section';
import { ThemeFormSection } from './theme-form-section';
import { LinksFormSection } from './links-form-section';
import { ProfilePreview } from '@/components/profile-preview';
import type { UpdateProfileInput } from '@/lib/validations/profiles';
import type { PreviewLink, PreviewProfile } from '@/components/profile-preview';

export function ProfileEditor({
  user,
  profiles,
  initialProfile,
  initialLinks,
}: {
  user: { id: string; email: string; name: string | null };
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string | null;
    status: 'ACTIVE' | 'DISABLED';
  }>;
  initialProfile: {
    id: string;
    slug: string;
    displayName: string | null;
    bio: string | null;
    image: string | null;
    status: 'ACTIVE' | 'DISABLED';
    themeSettings: any;
  };
  initialLinks: Array<{
    id: string;
    profileId: string;
    slug: string;
    title: string;
    url: string;
    position: number;
    status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
    metadata: Record<string, any>;
  }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    profile,
    links,
    setProfile,
    setLinks,
    updateProfile,
    hasUnsavedChanges,
    setUnsavedChanges,
  } = useProfileStore();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(
      // We'll import and use the actual schema
      updateProfileSchema
    ),
    defaultValues: {
      slug: initialProfile.slug,
      displayName: initialProfile.displayName || '',
      bio: initialProfile.bio || '',
      image: initialProfile.image || '',
      status: initialProfile.status,
      themeSettings: initialProfile.themeSettings,
    },
  });

  // Initialize store
  useEffect(() => {
    setProfile(initialProfile);
    setLinks(initialLinks);
  }, [initialProfile, initialLinks, setProfile, setLinks]);

  const watchThemeSettings = watch('themeSettings');
  const watchDisplayName = watch('displayName');
  const watchSlug = watch('slug');

  const previewProfile: PreviewProfile = {
    slug: watchSlug || initialProfile.slug,
    displayName: watchDisplayName || initialProfile.displayName,
    bio: watch('bio') || initialProfile.bio,
    image: watch('image') || initialProfile.image,
    themeSettings: {
      ...initialProfile.themeSettings,
      ...watchThemeSettings,
    },
  };

  const previewLinks: PreviewLink[] = links.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    status: link.status,
    metadata: link.metadata,
  }));

  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      const result = await updateProfileAction(initialProfile.id, data);
      if (!result.ok) {
        router.refresh();
        return;
      }
      setUnsavedChanges(false);
    });
  };

  const handleProfileSelect = (profileId: string) => {
    router.push(`/dashboard?profile=${profileId}`);
    router.refresh();
  };

  const handleCreateProfile = async () => {
    const base = slugifyLocal(user.name || user.email || 'profile');
    const slug = window.prompt('New profile slug', base);
    if (!slug) return;

    // This would need to be implemented in actions
    // const result = await createProfileAction({ slug, displayName: 'New Profile' });
    // if (result.ok) {
    //   router.push(`/dashboard?profile=${result.profile.id}`);
    //   router.refresh();
    // }
  };

  const handleDuplicateProfile = async () => {
    // This would need to be implemented in actions
    // const result = await duplicateProfileAction(initialProfile.id);
    // if (result.ok) {
    //   router.push(`/dashboard?profile=${result.profile.id}`);
    //   router.refresh();
    // }
  };

  const handleExportProfile = async () => {
    // This would need to be implemented in actions
    // const result = await exportProfileAction(initialProfile.id);
    // if (result.ok) {
    //   const blob = new Blob([result.json], { type: 'application/json' });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = result.filename;
    //   document.body.appendChild(a);
    //   a.click();
    //   a.remove();
    //   URL.revokeObjectURL(url);
    // }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Profile</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCreateProfile}>
                  New profile
                </Button>
                <Button type="button" variant="outline" onClick={handleDuplicateProfile}>
                  Duplicate
                </Button>
                <Button type="button" variant="outline" onClick={handleExportProfile}>
                  Export
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="profileSelect">Profile</Label>
                <select
                  id="profileSelect"
                  className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                  value={initialProfile.id}
                  onChange={(e) => handleProfileSelect(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.slug} {p.status === 'DISABLED' ? '(disabled)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {hasUnsavedChanges && (
                <div className="text-xs text-muted-foreground">
                  You have unsaved changes
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Profile Form Section */}
        <ProfileFormSection
          control={control}
          errors={errors}
          onProfileChange={updateProfile}
        />

        {/* Theme Form Section */}
        <ThemeFormSection
          control={control}
          errors={errors}
        />

        {/* Links Form Section */}
        <LinksFormSection />

        {/* Save Status */}
        {isPending ? (
          <div className="text-muted-foreground text-sm" aria-live="polite">
            Saving…
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
            showQr
            className="min-h-0"
          />
        </div>
      </div>
    </form>
  );
}

function slugifyLocal(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
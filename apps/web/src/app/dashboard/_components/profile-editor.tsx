'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '@acme/ui';

import {
  ProfilePreview,
  type PreviewLink,
  type PreviewProfile,
} from '@/components/profile-preview';
import type { ThemeSettings } from '@/lib/theme-settings';

import {
  archiveLinkAction,
  createLinkAction,
  createProfileAction,
  duplicateProfileAction,
  exportProfileAction,
  reorderLinksAction,
  updateLinkAction,
  updateProfileAction,
} from '../actions';

import { AvatarUploader } from './avatar-uploader';
import { IconPicker } from './icon-picker';
import { LinksDndList } from './links-dnd-list';

export type EditorProfile = {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  status: 'ACTIVE' | 'DISABLED';
  themeSettings: ThemeSettings;
};

export type EditorLink = {
  id: string;
  profileId: string;
  slug: string;
  title: string;
  url: string;
  position: number;
  status: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
  metadata: Prisma.JsonValue;
};

function getLinkMetadata(link: Pick<EditorLink, 'metadata'>): Record<string, any> {
  if (!link.metadata || typeof link.metadata !== 'object') return {};
  return link.metadata as Record<string, any>;
}

function toLocalDatetimeValue(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function toISOStringOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function ProfileEditor({
  user,
  profiles,
  profile,
  links,
}: {
  user: { id: string; email: string; name: string | null };
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string | null;
    status: 'ACTIVE' | 'DISABLED';
  }>;
  profile: EditorProfile;
  links: EditorLink[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profileState, setProfileState] = useState(profile);
  const [linksState, setLinksState] = useState<EditorLink[]>(links);

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

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
        status: l.status,
        metadata: l.metadata,
      })),
    [linksState],
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
        router.refresh();
      }
    });
  }

  async function handleCreateLink() {
    const title = newLinkTitle.trim();
    const url = newLinkUrl.trim();

    if (!title || !url) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticLink: EditorLink = {
      id: tempId,
      profileId: profile.id,
      slug: 'temp',
      title,
      url,
      position: linksState.length,
      status: 'ACTIVE',
      metadata: {},
    };

    setLinksState((prev) => [...prev, optimisticLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');

    const result = await createLinkAction({
      profileId: profile.id,
      title,
      url,
      status: 'ACTIVE',
      metadata: {},
    });

    if (!result.ok) {
      setLinksState((prev) => prev.filter((l) => l.id !== tempId));
      return;
    }

    setLinksState((prev) => prev.map((l) => (l.id === tempId ? (result.link as any) : l)));
    router.refresh();
  }

  function handleUpdateLink(linkId: string, patch: Partial<EditorLink>) {
    setLinksState((prev) => prev.map((l) => (l.id === linkId ? { ...l, ...patch } : l)));

    startTransition(async () => {
      await updateLinkAction(linkId, {
        title: patch.title,
        url: patch.url,
        status: patch.status,
        metadata: patch.metadata,
      });
    });
  }

  function handleArchiveLink(linkId: string) {
    const existing = linksState.find((l) => l.id === linkId);
    setLinksState((prev) => prev.filter((l) => l.id !== linkId));

    startTransition(async () => {
      const result = await archiveLinkAction(linkId);
      if (!result.ok) {
        if (existing)
          setLinksState((prev) => [...prev, existing].sort((a, b) => a.position - b.position));
        return;
      }
      router.refresh();
    });
  }

  function handleReorder(orderedIds: string[]) {
    startTransition(async () => {
      await reorderLinksAction({ profileId: profile.id, orderedLinkIds: orderedIds });
    });
  }

  async function handleDuplicateProfile() {
    const result = await duplicateProfileAction(profile.id);
    if (!result.ok) return;

    router.push(`/dashboard?profile=${result.profile.id}`);
    router.refresh();
  }

  async function handleExportProfile() {
    const result = await exportProfileAction(profile.id);
    if (!result.ok) return;

    const blob = new Blob([result.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCreateProfile() {
    const base = slugifyLocal(user.name || user.email || 'profile');
    const slug = window.prompt('New profile slug', base);
    if (!slug) return;

    const result = await createProfileAction({ slug, displayName: 'New Profile' });
    if (!result.ok) return;

    router.push(`/dashboard?profile=${result.profile.id}`);
    router.refresh();
  }

  const isDisabled = profileState.status === 'DISABLED';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
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
                  value={profile.id}
                  onChange={(e) => {
                    router.push(`/dashboard?profile=${e.target.value}`);
                    router.refresh();
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.slug} {p.status === 'DISABLED' ? '(disabled)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!isDisabled}
                  onChange={(e) =>
                    saveProfile({ status: e.target.checked ? 'ACTIVE' : 'DISABLED' })
                  }
                />
                <span>Profile active</span>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={profileState.displayName ?? ''}
                  onChange={(e) => updateProfileDraft({ displayName: e.target.value })}
                  onBlur={() => saveProfile({ displayName: profileState.displayName })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={profileState.slug}
                  onChange={(e) => updateProfileDraft({ slug: e.target.value })}
                  onBlur={() => saveProfile({ slug: profileState.slug })}
                />
                <div className="text-muted-foreground text-xs">
                  Public URL: /{profileState.slug}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="border-input bg-background min-h-[96px] w-full rounded-md border px-3 py-2 text-sm"
                value={profileState.bio ?? ''}
                onChange={(e) => updateProfileDraft({ bio: e.target.value })}
                onBlur={() => saveProfile({ bio: profileState.bio })}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-sm">Avatar shown on your public page</div>
              <AvatarUploader
                onUploaded={async (url) => {
                  saveProfile({ image: url });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="bg">Background</Label>
                <Input
                  id="bg"
                  type="color"
                  value={profileState.themeSettings.backgroundColor || '#0b1220'}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        backgroundColor: e.target.value,
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="textColor">Text</Label>
                <Input
                  id="textColor"
                  type="color"
                  value={profileState.themeSettings.textColor || '#ffffff'}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        textColor: e.target.value,
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="buttonColor">Button</Label>
                <Input
                  id="buttonColor"
                  type="color"
                  value={profileState.themeSettings.buttonColor || '#ffffff'}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        buttonColor: e.target.value,
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="buttonTextColor">Button text</Label>
                <Input
                  id="buttonTextColor"
                  type="color"
                  value={profileState.themeSettings.buttonTextColor || '#0b1220'}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        buttonTextColor: e.target.value,
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="radius">Button radius</Label>
                <Input
                  id="radius"
                  type="number"
                  min={0}
                  max={24}
                  value={profileState.themeSettings.buttonRadius ?? 12}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        buttonRadius: Number(e.target.value),
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="font">Font</Label>
                <select
                  id="font"
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  value={profileState.themeSettings.fontFamily || ''}
                  onChange={(e) =>
                    updateProfileDraft({
                      themeSettings: {
                        ...profileState.themeSettings,
                        fontFamily: e.target.value || undefined,
                      },
                    })
                  }
                  onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
                >
                  <option value="">Default</option>
                  <option value="ui-sans-serif, system-ui">System</option>
                  <option value="Inter, ui-sans-serif">Inter</option>
                  <option value="ui-serif, Georgia">Serif</option>
                  <option value="ui-monospace, SFMono-Regular">Mono</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="customCss">Custom CSS</Label>
              <textarea
                id="customCss"
                className="border-input bg-background min-h-[120px] w-full rounded-md border px-3 py-2 font-mono text-xs"
                value={profileState.themeSettings.customCss ?? ''}
                onChange={(e) =>
                  updateProfileDraft({
                    themeSettings: { ...profileState.themeSettings, customCss: e.target.value },
                  })
                }
                onBlur={() => saveProfile({ themeSettings: profileState.themeSettings })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="newTitle">Title</Label>
                <Input
                  id="newTitle"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newUrl">URL</Label>
                <Input
                  id="newUrl"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleCreateLink()}
                disabled={!newLinkTitle || !newLinkUrl}
              >
                Add
              </Button>
            </div>

            {linksState.length === 0 ? (
              <div className="text-muted-foreground text-sm">No links yet.</div>
            ) : (
              <LinksDndList
                links={linksState}
                onLinksChange={setLinksState}
                onReorder={(orderedIds) => handleReorder(orderedIds)}
                renderLink={(link, { dragHandle, isDragging }) => {
                  const md = getLinkMetadata(link);
                  const schedule = md.schedule as
                    | { startsAt?: string; endsAt?: string }
                    | undefined;

                  return (
                    <div
                      className={cn(
                        'border-border bg-card rounded-lg border p-3',
                        isDragging && 'ring-ring ring-2',
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="pt-1">{dragHandle}</div>

                        <div className="grid flex-1 gap-3 sm:grid-cols-2">
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
                              onBlur={() => handleUpdateLink(link.id, { title: link.title })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`url-${link.id}`}>URL</Label>
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
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor={`display-${link.id}`}>Display</Label>
                              <select
                                id={`display-${link.id}`}
                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                value={md.display || 'button'}
                                onChange={(e) => {
                                  const next = {
                                    ...md,
                                    display: e.target.value,
                                  };
                                  handleUpdateLink(link.id, { metadata: next as any });
                                }}
                              >
                                <option value="button">Button</option>
                                <option value="icon">Icon</option>
                              </select>
                            </div>
                            <IconPicker
                              id={`icon-${link.id}`}
                              value={md.icon}
                              onChange={(value) => {
                                const next = { ...md } as Record<string, any>;
                                if (value) {
                                  next.icon = value;
                                } else {
                                  delete next.icon;
                                }
                                handleUpdateLink(link.id, { metadata: next as any });
                              }}
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor={`startsAt-${link.id}`}>Starts</Label>
                              <Input
                                id={`startsAt-${link.id}`}
                                type="datetime-local"
                                value={toLocalDatetimeValue(schedule?.startsAt)}
                                onChange={(e) => {
                                  const iso = toISOStringOrUndefined(e.target.value);
                                  const nextSchedule = { ...(schedule ?? {}) } as Record<
                                    string,
                                    any
                                  >;

                                  if (iso) {
                                    nextSchedule.startsAt = iso;
                                  } else {
                                    delete nextSchedule.startsAt;
                                  }

                                  const next = { ...md } as Record<string, any>;
                                  if (!nextSchedule.startsAt && !nextSchedule.endsAt) {
                                    delete next.schedule;
                                  } else {
                                    next.schedule = nextSchedule;
                                  }

                                  handleUpdateLink(link.id, { metadata: next as any });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`endsAt-${link.id}`}>Ends</Label>
                              <Input
                                id={`endsAt-${link.id}`}
                                type="datetime-local"
                                value={toLocalDatetimeValue(schedule?.endsAt)}
                                onChange={(e) => {
                                  const iso = toISOStringOrUndefined(e.target.value);
                                  const nextSchedule = { ...(schedule ?? {}) } as Record<
                                    string,
                                    any
                                  >;

                                  if (iso) {
                                    nextSchedule.endsAt = iso;
                                  } else {
                                    delete nextSchedule.endsAt;
                                  }

                                  const next = { ...md } as Record<string, any>;
                                  if (!nextSchedule.startsAt && !nextSchedule.endsAt) {
                                    delete next.schedule;
                                  } else {
                                    next.schedule = nextSchedule;
                                  }

                                  handleUpdateLink(link.id, { metadata: next as any });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={link.status === 'ACTIVE'}
                              onChange={(e) =>
                                handleUpdateLink(link.id, {
                                  status: e.target.checked ? 'ACTIVE' : 'HIDDEN',
                                })
                              }
                            />
                            <span>Enabled</span>
                          </label>

                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleArchiveLink(link.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            )}

            <div className="text-muted-foreground text-xs">
              Tip: drag the handle to reorder links. Hidden links won’t show on your public page.
            </div>
          </CardContent>
        </Card>

        {isPending ? (
          <div className="text-muted-foreground text-sm" aria-live="polite">
            Saving…
          </div>
        ) : null}
      </div>

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
    </div>
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

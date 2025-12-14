'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@acme/ui';
import { Plus } from 'lucide-react';

import { useProfileStore } from '@/lib/store/profile-store';
import { SocialIconPresets } from '@/components/social-icon-presets';
import { LinksDndList } from './links-dnd-list';
import { createLinkAction, archiveLinkAction, updateLinkAction, reorderLinksAction } from '../actions';

export function LinksFormSection() {
  const { profile, links, addLink, updateLink, removeLink, reorderLinks } = useProfileStore();
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  if (!profile) return null;

  const handleCreateLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    setIsAddingLink(true);
    try {
      const tempId = `temp-${Date.now()}`;
      const optimisticLink = {
        id: tempId,
        profileId: profile.id,
        slug: 'temp',
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim(),
        position: links.length,
        status: 'ACTIVE' as const,
        metadata: {},
      };

      // Add optimistic update
      addLink(optimisticLink);
      setNewLinkTitle('');
      setNewLinkUrl('');

      // Create actual link
      const result = await createLinkAction({
        profileId: profile.id,
        title: optimisticLink.title,
        url: optimisticLink.url,
        status: 'ACTIVE',
        metadata: {},
      });

      if (!result.ok) {
        // Rollback optimistic update
        removeLink(tempId);
      } else {
        // Replace temp link with real link
        updateLink(tempId, result.link);
      }
    } catch (error) {
      console.error('Failed to create link:', error);
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleUpdateLink = async (linkId: string, patch: any) => {
    // Optimistic update
    updateLink(linkId, patch);

    try {
      await updateLinkAction(linkId, {
        title: patch.title,
        url: patch.url,
        status: patch.status,
        metadata: patch.metadata,
      });
    } catch (error) {
      console.error('Failed to update link:', error);
      // In a real app, you might want to rollback the optimistic update here
    }
  };

  const handleArchiveLink = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    // Optimistic update
    removeLink(linkId);

    try {
      await archiveLinkAction(linkId);
    } catch (error) {
      console.error('Failed to archive link:', error);
      // Rollback optimistic update
      // In a real implementation, you'd need to restore the link
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic update
    reorderLinks(orderedIds);

    try {
      await reorderLinksAction({ profileId: profile.id, orderedLinkIds: orderedIds });
    } catch (error) {
      console.error('Failed to reorder links:', error);
      // Rollback optimistic update
    }
  };

  const handleSelectPreset = async (preset: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticLink = {
      id: tempId,
      profileId: profile.id,
      slug: 'temp',
      title: preset.name,
      url: preset.url,
      position: links.length,
      status: 'ACTIVE' as const,
      metadata: {
        display: 'button',
        icon: preset.icon.displayName?.toLowerCase().replace(/\s+/g, '') || preset.name.toLowerCase(),
      },
    };

    // Add optimistic update
    addLink(optimisticLink);

    try {
      const result = await createLinkAction({
        profileId: profile.id,
        title: optimisticLink.title,
        url: optimisticLink.url,
        status: 'ACTIVE',
        metadata: optimisticLink.metadata,
      });

      if (!result.ok) {
        removeLink(tempId);
      } else {
        updateLink(tempId, result.link);
      }
    } catch (error) {
      console.error('Failed to create preset link:', error);
      removeLink(tempId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Link */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Add New Link</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="newTitle">Title</Label>
            <Input
              id="newTitle"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Link title"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newUrl">URL</Label>
            <Input
              id="newUrl"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleCreateLink()}
            disabled={!newLinkTitle || !newLinkUrl || isAddingLink}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Add</Label>
        <SocialIconPresets onSelectPreset={handleSelectPreset} />
      </div>

      {/* Links List */}
      {links.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          No links yet. Add your first link above or use a preset!
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Links</Label>
            <div className="text-muted-foreground text-xs">
              {links.filter(l => l.status === 'ACTIVE').length} active
            </div>
          </div>

          <LinksDndList
            links={links}
            onLinksChange={(newLinks) => {
              // This would be called by the dnd component
              // We handle updates directly in the component
            }}
            onReorder={handleReorder}
            renderLink={(link, { dragHandle, isDragging }) => {
              const metadata = link.metadata || {};
              const schedule = metadata.schedule as
                | { startsAt?: string; endsAt?: string }
                | undefined;

              return (
                <div
                  className={`border-border bg-card rounded-lg border p-3 transition-all ${
                    isDragging ? 'ring-ring ring-2 opacity-75' : ''
                  } ${link.status === 'HIDDEN' ? 'opacity-60' : ''}`}
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
                            handleUpdateLink(link.id, { title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`url-${link.id}`}>URL</Label>
                        <Input
                          id={`url-${link.id}`}
                          value={link.url}
                          onChange={(e) =>
                            handleUpdateLink(link.id, { url: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`display-${link.id}`}>Display</Label>
                        <select
                          id={`display-${link.id}`}
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                          value={metadata.display || 'button'}
                          onChange={(e) => {
                            const next = { ...metadata, display: e.target.value };
                            handleUpdateLink(link.id, { metadata: next });
                          }}
                        >
                          <option value="button">Button</option>
                          <option value="icon">Icon</option>
                        </select>
                      </div>

                      {metadata.display !== 'icon' && (
                        <div className="space-y-1">
                          <Label htmlFor={`icon-${link.id}`}>Icon</Label>
                          <Input
                            id={`icon-${link.id}`}
                            value={metadata.icon || ''}
                            onChange={(e) => {
                              const next = { ...metadata } as Record<string, any>;
                              if (e.target.value) {
                                next.icon = e.target.value;
                              } else {
                                delete next.icon;
                              }
                              handleUpdateLink(link.id, { metadata: next });
                            }}
                            placeholder="Optional icon name"
                          />
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
                        <div className="space-y-1">
                          <Label htmlFor={`startsAt-${link.id}`}>Starts</Label>
                          <Input
                            id={`startsAt-${link.id}`}
                            type="datetime-local"
                            value={toLocalDatetimeValue(schedule?.startsAt)}
                            onChange={(e) => {
                              const iso = toISOStringOrUndefined(e.target.value);
                              const nextSchedule = { ...(schedule ?? {}) } as Record<string, any>;

                              if (iso) {
                                nextSchedule.startsAt = iso;
                              } else {
                                delete nextSchedule.startsAt;
                              }

                              const next = { ...metadata } as Record<string, any>;
                              if (!nextSchedule.startsAt && !nextSchedule.endsAt) {
                                delete next.schedule;
                              } else {
                                next.schedule = nextSchedule;
                              }

                              handleUpdateLink(link.id, { metadata: next });
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
                              const nextSchedule = { ...(schedule ?? {}) } as Record<string, any>;

                              if (iso) {
                                nextSchedule.endsAt = iso;
                              } else {
                                delete nextSchedule.endsAt;
                              }

                              const next = { ...metadata } as Record<string, any>;
                              if (!nextSchedule.startsAt && !nextSchedule.endsAt) {
                                delete next.schedule;
                              } else {
                                next.schedule = nextSchedule;
                              }

                              handleUpdateLink(link.id, { metadata: next });
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

                      {schedule && (
                        <div className="text-xs text-muted-foreground">
                          {schedule.startsAt && (
                            <div>Starts: {formatDate(schedule.startsAt)}</div>
                          )}
                          {schedule.endsAt && (
                            <div>Ends: {formatDate(schedule.endsAt)}</div>
                          )}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
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

          <div className="text-muted-foreground text-xs">
            Tip: drag the handle to reorder links. Hidden links won't show on your public page.
            Schedule links to show only during specific time periods.
          </div>
        </div>
      )}
    </div>
  );
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
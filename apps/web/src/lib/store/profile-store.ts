'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ThemeSettings, GradientStop } from '@/lib/theme-settings';

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
  metadata: Record<string, any>;
};

type ProfileStore = {
  // State
  profile: EditorProfile | null;
  links: EditorLink[];
  isLoading: boolean;
  hasUnsavedChanges: boolean;

  // Profile actions
  setProfile: (profile: EditorProfile) => void;
  updateProfile: (patch: Partial<EditorProfile>) => void;
  resetProfile: () => void;

  // Link actions
  setLinks: (links: EditorLink[]) => void;
  addLink: (link: EditorLink) => void;
  updateLink: (id: string, patch: Partial<EditorLink>) => void;
  removeLink: (id: string) => void;
  reorderLinks: (orderedIds: string[]) => void;

  // Theme actions
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  addGradientStop: (stop: GradientStop) => void;
  updateGradientStop: (index: number, stop: Partial<GradientStop>) => void;
  removeGradientStop: (index: number) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setUnsavedChanges: (unsaved: boolean) => void;
};

export const useProfileStore = create<ProfileStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      profile: null,
      links: [],
      isLoading: false,
      hasUnsavedChanges: false,

      // Profile actions
      setProfile: (profile) =>
        set(
          {
            profile,
            hasUnsavedChanges: false,
          },
          false,
          'setProfile',
        ),

      updateProfile: (patch) =>
        set(
          (state) => ({
            profile: state.profile ? { ...state.profile, ...patch } : null,
            hasUnsavedChanges: true,
          }),
          false,
          'updateProfile',
        ),

      resetProfile: () =>
        set(
          {
            profile: null,
            hasUnsavedChanges: false,
          },
          false,
          'resetProfile',
        ),

      // Link actions
      setLinks: (links) =>
        set(
          {
            links,
          },
          false,
          'setLinks',
        ),

      addLink: (link) =>
        set(
          (state) => ({
            links: [...state.links, link],
            hasUnsavedChanges: true,
          }),
          false,
          'addLink',
        ),

      updateLink: (id, patch) =>
        set(
          (state) => ({
            links: state.links.map((link) =>
              link.id === id ? { ...link, ...patch } : link,
            ),
            hasUnsavedChanges: true,
          }),
          false,
          'updateLink',
        ),

      removeLink: (id) =>
        set(
          (state) => ({
            links: state.links.filter((link) => link.id !== id),
            hasUnsavedChanges: true,
          }),
          false,
          'removeLink',
        ),

      reorderLinks: (orderedIds) =>
        set(
          (state) => {
            const reorderedLinks = orderedIds
              .map((id, index) => {
                const link = state.links.find((l) => l.id === id);
                return link ? { ...link, position: index } : null;
              })
              .filter(Boolean) as EditorLink[];

            return {
              links: reorderedLinks,
              hasUnsavedChanges: true,
            };
          },
          false,
          'reorderLinks',
        ),

      // Theme actions
      updateThemeSettings: (settings) =>
        set(
          (state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  themeSettings: {
                    ...state.profile.themeSettings,
                    ...settings,
                  },
                }
              : null,
            hasUnsavedChanges: true,
          }),
          false,
          'updateThemeSettings',
        ),

      addGradientStop: (stop) =>
        set(
          (state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  themeSettings: {
                    ...state.profile.themeSettings,
                    gradientStops: [
                      ...(state.profile.themeSettings.gradientStops || []),
                      stop,
                    ].sort((a, b) => a.position - b.position),
                  },
                }
              : null,
            hasUnsavedChanges: true,
          }),
          false,
          'addGradientStop',
        ),

      updateGradientStop: (index, stop) =>
        set(
          (state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  themeSettings: {
                    ...state.profile.themeSettings,
                    gradientStops: (state.profile.themeSettings.gradientStops || []).map(
                      (existing, i) => (i === index ? { ...existing, ...stop } : existing),
                    ),
                  },
                }
              : null,
            hasUnsavedChanges: true,
          }),
          false,
          'updateGradientStop',
        ),

      removeGradientStop: (index) =>
        set(
          (state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  themeSettings: {
                    ...state.profile.themeSettings,
                    gradientStops: (state.profile.themeSettings.gradientStops || []).filter(
                      (_, i) => i !== index,
                    ),
                  },
                }
              : null,
            hasUnsavedChanges: true,
          }),
          false,
          'removeGradientStop',
        ),

      // Utility actions
      setLoading: (loading) =>
        set(
          {
            isLoading: loading,
          },
          false,
          'setLoading',
        ),

      setUnsavedChanges: (unsaved) =>
        set(
          {
            hasUnsavedChanges: unsaved,
          },
          false,
          'setUnsavedChanges',
        ),
    }),
    {
      name: 'profile-store',
    },
  ),
);
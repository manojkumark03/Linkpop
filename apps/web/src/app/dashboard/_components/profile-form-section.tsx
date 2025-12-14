'use client';

import { Controller } from 'react-hook-form';
import { Button, Input, Label } from '@acme/ui';
import { Switch } from '@/components/ui/switch';

import { ImageUrlInput } from '@/components/image-url-input';
import { useProfileStore } from '@/lib/store/profile-store';

interface ProfileFormSectionProps {
  control: any;
  errors: any;
  onProfileChange: (patch: any) => void;
}

export function ProfileFormSection({
  control,
  errors,
  onProfileChange,
}: ProfileFormSectionProps) {
  const { profile, updateProfile } = useProfileStore();

  if (!profile) return null;

  return (
    <div className="space-y-4">
      {/* Basic Profile Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Controller
            name="displayName"
            control={control}
            render={({ field }) => (
              <>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateProfile({ displayName: e.target.value });
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    onProfileChange({ displayName: e.target.value });
                  }}
                />
              </>
            )}
          />
        </div>
        <div className="space-y-1">
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateProfile({ slug: e.target.value });
                  }}
                  onBlur={(e) => {
                    field.onBlur();
                    onProfileChange({ slug: e.target.value });
                  }}
                />
                <div className="text-muted-foreground text-xs">
                  Public URL: /{field.value}
                </div>
              </>
            )}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="border-input bg-background min-h-[96px] w-full rounded-md border px-3 py-2 text-sm"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  updateProfile({ bio: e.target.value });
                }}
                onBlur={(e) => {
                  field.onBlur();
                  onProfileChange({ bio: e.target.value });
                }}
              />
            </>
          )}
        />
      </div>

      <Controller
        name="image"
        control={control}
        render={({ field }) => (
          <>
            <ImageUrlInput
              label="Avatar"
              value={field.value || ''}
              onChange={(url) => {
                field.onChange(url || null);
                updateProfile({ image: url || null });
              }}
              onBlur={() => {
                field.onBlur();
                onProfileChange({ image: profile.image });
              }}
              placeholder="https://example.com/avatar.jpg"
              showPreview={true}
              previewSize="small"
              currentImageUrl={profile.image || undefined}
              allowEmpty={true}
              showServiceInstructions={true}
            />
          </>
        )}
      />

      {/* Profile Status */}
      <div className="flex items-center gap-2">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value === 'ACTIVE'}
              onCheckedChange={(checked) => {
                const status = checked ? 'ACTIVE' : 'DISABLED';
                field.onChange(status);
                updateProfile({ status });
                onProfileChange({ status });
              }}
            />
          )}
        />
        <Label className="text-sm">Profile active</Label>
      </div>
    </div>
  );
}
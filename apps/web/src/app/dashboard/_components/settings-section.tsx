'use client';

import { useState, useTransition } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  toast,
} from '@acme/ui';
import {
  Settings,
  Palette,
  Trash2,
  Download,
  Upload,
  Code,
  Eye,
  EyeOff,
  User,
  FileText,
} from 'lucide-react';

import type { EditorProfile } from './profile-editor';
import { IconPicker } from './icon-picker';
import { CustomScriptsEditor } from './custom-scripts-editor';
import { updateProfileAction, deleteProfileAction } from '../actions';
import type { ThemeSettings } from '@/lib/theme-settings';

interface SettingsSectionProps {
  profile: EditorProfile;
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string | null;
    image?: string | null;
    status: 'ACTIVE' | 'DISABLED';
  }>;
}

export function SettingsSection({ profile, profiles }: SettingsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scriptsOpen, setScriptsOpen] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [image, setImage] = useState(profile.image || '');
  const [status, setStatus] = useState<'ACTIVE' | 'DISABLED'>(profile.status);

  const isPublished = status === 'ACTIVE';
  const profilesUsedText = `${profiles.length}/5 profiles used`;

  function saveProfile(patch: Partial<EditorProfile>) {
    startTransition(async () => {
      const result = await updateProfileAction(profile.id, {
        slug: profile.slug,
        displayName: patch.displayName,
        bio: patch.bio,
        image: patch.image,
        status: patch.status,
        themeSettings: patch.themeSettings,
      });

      if (!result.ok) {
        toast({
          title: 'Could not save profile',
          description: result.error,
          variant: 'destructive',
        });
        router.refresh();
      } else {
        toast({
          title: 'Profile saved',
          description: 'Your changes have been saved',
        });
      }
    });
  }

  function handleSaveBasicInfo() {
    saveProfile({
      displayName,
      bio,
      image,
      status,
    });
  }

  function handleToggleStatus() {
    const newStatus = isPublished ? 'DISABLED' : 'ACTIVE';
    setStatus(newStatus);
    saveProfile({
      status: newStatus,
    });
  }

  function handleDeleteProfile() {
    startTransition(async () => {
      const result = await deleteProfileAction(profile.id);

      if (!result.ok) {
        toast({
          title: 'Could not delete profile',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Profile deleted',
        description: 'Your profile has been deleted',
      });

      // Redirect to dashboard or another profile
      const otherProfile = profiles.find((p) => p.id !== profile.id);
      if (otherProfile) {
        window.location.href = `/dashboard?profile=${otherProfile.id}`;
      } else {
        window.location.href = '/dashboard';
      }
    });
  }

  function handleExport(format: 'links-csv' | 'full-json') {
    startTransition(async () => {
      try {
        const result = await fetch(`/api/profiles/${profile.id}/export?format=${format}`);
        if (!result.ok) {
          throw new Error('Export failed');
        }

        const blob = await result.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profile-${profile.slug}.${format === 'links-csv' ? 'csv' : 'json'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast({
          title: 'Export started',
          description: 'Your download should begin immediately.',
        });
        setExportOpen(false);
      } catch (error) {
        toast({
          title: 'Export failed',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Basic information about your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
              disabled={isPending}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="image">Profile Image URL</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/your-image.jpg"
              disabled={isPending}
            />
          </div>
          <div className="flex items-center justify-between pt-4">
            <div>
              <Label htmlFor="status">Profile Status</Label>
              <p className="text-muted-foreground text-sm">
                {isPublished ? 'Profile is visible to visitors' : 'Profile is hidden from visitors'}
              </p>
            </div>
            <Switch
              id="status"
              checked={isPublished}
              onCheckedChange={handleToggleStatus}
              disabled={isPending}
            />
          </div>
          <Button onClick={handleSaveBasicInfo} disabled={isPending}>
            Save Profile Information
          </Button>
        </CardContent>
      </Card>

      {/* Theme Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customization
          </CardTitle>
          <CardDescription>Customize the appearance of your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href={`/dashboard/profiles/${profile.id}/design`}>Open Theme Designer</a>
          </Button>
        </CardContent>
      </Card>

      {/* Custom Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Custom Scripts
          </CardTitle>
          <CardDescription>Add custom JavaScript and CSS to your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setScriptsOpen(true)} variant="outline">
            <Code className="mr-2 h-4 w-4" />
            Edit Custom Scripts
          </Button>
        </CardContent>
      </Card>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Profile Management
          </CardTitle>
          <CardDescription>Manage your profile data and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">{profilesUsedText}</div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setExportOpen(true)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={() => setDeleteOpen(true)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Profile Data</DialogTitle>
            <DialogDescription>Choose the format for your export</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => handleExport('links-csv')}
              variant="outline"
              className="w-full justify-start"
              disabled={isPending}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export Links as CSV
            </Button>
            <Button
              onClick={() => handleExport('full-json')}
              variant="outline"
              className="w-full justify-start"
              disabled={isPending}
            >
              <Code className="mr-2 h-4 w-4" />
              Export Full Profile as JSON
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your profile and all
              associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
              <p className="text-destructive text-sm font-medium">Warning: This will delete:</p>
              <ul className="text-destructive mt-2 list-inside list-disc text-sm">
                <li>Profile information and settings</li>
                <li>All links and their analytics</li>
                <li>All pages and their content</li>
                <li>All short links and their analytics</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="confirmDelete">
                Type <strong>{profile.slug}</strong> to confirm deletion:
              </Label>
              <Input id="confirmDelete" placeholder={profile.slug} disabled={isPending} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfile} disabled={isPending}>
              Delete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Scripts Dialog */}
      <Dialog open={scriptsOpen} onOpenChange={setScriptsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custom Scripts</DialogTitle>
            <DialogDescription>Add custom JavaScript and CSS to your profile</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CustomScriptsEditor
              profile={profile}
              onSave={() => {
                toast({
                  title: 'Scripts saved',
                  description: 'Your custom scripts have been saved',
                });
                setScriptsOpen(false);
                router.refresh();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

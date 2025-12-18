'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@acme/ui';

export function ShareProfileCard({ slug }: { slug: string }) {
  const getProfileUrl = () => {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}/${slug}`;
  };

  const profileUrl = getProfileUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Copied!',
      description: 'Profile link copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔗 Share Your Profile</CardTitle>
        <CardDescription>Copy your profile link or download QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Profile URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={profileUrl}
                className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <Button onClick={handleCopyLink} className="shrink-0">
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

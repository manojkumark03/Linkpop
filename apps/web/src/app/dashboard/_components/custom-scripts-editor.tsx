'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  toast,
} from '@acme/ui';
import { Code, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { updateCustomScriptsAction } from '../actions';

type CustomScriptsEditorProps = {
  profileId: string;
  user: {
    id: string;
    subscriptionTier: 'FREE' | 'PRO';
  };
  initialScripts?: {
    customHeadScript?: string | null;
    customBodyScript?: string | null;
  };
  onSaved?: () => void;
};

export function CustomScriptsEditor({
  profileId,
  user,
  initialScripts,
  onSaved,
}: CustomScriptsEditorProps) {
  const router = useRouter();
  const [customHeadScript, setCustomHeadScript] = useState(initialScripts?.customHeadScript || '');
  const [customBodyScript, setCustomBodyScript] = useState(initialScripts?.customBodyScript || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      const result = await updateCustomScriptsAction(profileId, {
        customHeadScript: customHeadScript.trim() || undefined,
        customBodyScript: customBodyScript.trim() || undefined,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to save custom scripts');
      }

      toast({
        title: 'Scripts saved',
        description: 'Your custom scripts have been updated successfully.',
      });

      onSaved?.();
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save scripts',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  // FREE user - show upgrade prompt
  if (user.subscriptionTier !== 'PRO') {
    return (
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Code className="text-primary h-8 w-8" />
            <div className="flex-1">
              <h3 className="font-semibold">Custom JavaScript</h3>
              <p className="text-muted-foreground text-sm">
                Add tracking pixels, analytics, and custom scripts to your profile
              </p>
            </div>
            <Button asChild>
              <Link href="/pricing">Upgrade to PRO</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Custom Scripts
          <Badge variant="secondary">PRO</Badge>
        </CardTitle>
        <CardDescription>
          Add tracking pixels, analytics, or custom JavaScript to your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Head Scripts */}
        <div>
          <Label htmlFor="headScript">
            Head Scripts
            <span className="text-muted-foreground ml-2">(Loaded in &lt;head&gt;)</span>
          </Label>
          <Textarea
            id="headScript"
            value={customHeadScript}
            onChange={(e) => setCustomHeadScript(e.target.value)}
            rows={6}
            placeholder={`<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>`}
            className="font-mono text-sm"
          />
          <p className="text-muted-foreground mt-2 text-xs">
            Common uses: Google Analytics, Meta Pixel, CSS overrides
          </p>
        </div>

        {/* Body Scripts */}
        <div>
          <Label htmlFor="bodyScript">
            Body Scripts
            <span className="text-muted-foreground ml-2">(Loaded before &lt;/body&gt;)</span>
          </Label>
          <Textarea
            id="bodyScript"
            value={customBodyScript}
            onChange={(e) => setCustomBodyScript(e.target.value)}
            rows={6}
            placeholder={`<!-- Hotjar Tracking Code -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`}
            className="font-mono text-sm"
          />
          <p className="text-muted-foreground mt-2 text-xs">
            Common uses: Hotjar, session recording, chat widgets
          </p>
        </div>

        {/* Warning */}
        <div className="border-destructive bg-destructive/10 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-4 w-4" />
            <h4 className="text-destructive font-medium">Security Warning</h4>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Only add scripts from trusted sources. Malicious code can compromise your profile.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Scripts'}
        </Button>
      </CardContent>
    </Card>
  );
}

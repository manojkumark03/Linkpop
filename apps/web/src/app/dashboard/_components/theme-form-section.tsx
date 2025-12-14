'use client';

import { Controller } from 'react-hook-form';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@acme/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProfileStore } from '@/lib/store/profile-store';
import { GradientBuilder } from '@/components/gradient-builder';
import { ButtonStyleSelector } from '@/components/button-style-selector';
import { GoogleFontPicker } from '@/components/google-font-picker';
import { BackgroundUploader } from '@/components/background-uploader';
import { ImageUrlInput } from '@/components/image-url-input';

interface ThemeFormSectionProps {
  control: any;
  errors: any;
}

export function ThemeFormSection({ control, errors }: ThemeFormSectionProps) {
  const { profile, updateThemeSettings } = useProfileStore();

  if (!profile) return null;

  const theme = profile.themeSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-4">
            {/* Background Style */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Background Style</Label>
              <Controller
                name="themeSettings.backgroundStyle"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'solid'}
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateThemeSettings({ backgroundStyle: value as any });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Background Image</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Solid Color */}
            {theme.backgroundStyle === 'solid' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Controller
                    name="themeSettings.backgroundColor"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Label htmlFor="bgColor">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bgColor"
                            type="color"
                            value={field.value || '#0b1220'}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              updateThemeSettings({ backgroundColor: e.target.value });
                            }}
                            className="h-10 w-20 p-1"
                          />
                          <Input
                            value={field.value || '#0b1220'}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              updateThemeSettings({ backgroundColor: e.target.value });
                            }}
                            className="flex-1"
                          />
                        </div>
                      </>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Controller
                    name="themeSettings.backgroundOverlayOpacity"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Label htmlFor="overlayOpacity">
                          Overlay Opacity: {Math.round((field.value || 0.5) * 100)}%
                        </Label>
                        <Input
                          id="overlayOpacity"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={field.value || 0.5}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            updateThemeSettings({ backgroundOverlayOpacity: Number(e.target.value) });
                          }}
                        />
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Gradient */}
            {theme.backgroundStyle === 'gradient' && (
              <Controller
                name="themeSettings"
                control={control}
                render={({ field }) => (
                  <GradientBuilder
                    stops={theme.gradientStops || [
                      { color: '#0b1220', position: 0 },
                      { color: '#1e293b', position: 100 },
                    ]}
                    angle={theme.gradientAngle || 45}
                    onStopsChange={(stops) => {
                      updateThemeSettings({ gradientStops: stops });
                      field.onChange({ ...theme, gradientStops: stops });
                    }}
                    onAngleChange={(angle) => {
                      updateThemeSettings({ gradientAngle: angle });
                      field.onChange({ ...theme, gradientAngle: angle });
                    }}
                  />
                )}
              />
            )}

            {/* Background Image */}
            {theme.backgroundStyle === 'image' && (
              <div className="space-y-4">
                <BackgroundUploader
                  currentImageUrl={theme.backgroundImageUrl}
                  onImageUpload={(url) => {
                    updateThemeSettings({ backgroundImageUrl: url });
                  }}
                />
                
                <Controller
                  name="themeSettings.backgroundOverlayOpacity"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Label htmlFor="overlayOpacity">
                        Overlay Opacity: {Math.round((field.value || 0.5) * 100)}%
                      </Label>
                      <Input
                        id="overlayOpacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={field.value || 0.5}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          updateThemeSettings({ backgroundOverlayOpacity: Number(e.target.value) });
                        }}
                      />
                    </>
                  )}
                />
              </div>
            )}

            {/* Fallback: Image URL input for legacy support */}
            {(!theme.backgroundStyle || theme.backgroundStyle === 'solid') && (
              <Controller
                name="themeSettings.backgroundImageUrl"
                control={control}
                render={({ field }) => (
                  <ImageUrlInput
                    label="Background Image URL (Optional)"
                    value={field.value || ''}
                    onChange={(url) => {
                      field.onChange(url || undefined);
                      updateThemeSettings({ 
                        backgroundImageUrl: url || undefined,
                        backgroundStyle: url ? 'image' : theme.backgroundStyle
                      });
                    }}
                    placeholder="https://example.com/background.jpg"
                    showPreview={false}
                    currentImageUrl={theme.backgroundImageUrl || undefined}
                    allowEmpty={true}
                    showServiceInstructions={false}
                  />
                )}
              />
            )}
          </TabsContent>

          <TabsContent value="buttons" className="space-y-4">
            <Controller
              name="themeSettings"
              control={control}
              render={({ field }) => (
                <ButtonStyleSelector
                  variant={theme.buttonVariant || 'solid'}
                  radius={theme.buttonRadius || 12}
                  shadow={theme.buttonShadow !== false}
                  onVariantChange={(variant) => {
                    updateThemeSettings({ buttonVariant: variant });
                    field.onChange({ ...theme, buttonVariant: variant });
                  }}
                  onRadiusChange={(radius) => {
                    updateThemeSettings({ buttonRadius: radius });
                    field.onChange({ ...theme, buttonRadius: radius });
                  }}
                  onShadowChange={(shadow) => {
                    updateThemeSettings({ buttonShadow: shadow });
                    field.onChange({ ...theme, buttonShadow: shadow });
                  }}
                />
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Controller
                  name="themeSettings.buttonColor"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Label htmlFor="buttonColor">Button Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buttonColor"
                          type="color"
                          value={field.value || '#ffffff'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ buttonColor: e.target.value });
                          }}
                          className="h-10 w-20 p-1"
                        />
                        <Input
                          value={field.value || '#ffffff'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ buttonColor: e.target.value });
                          }}
                          className="flex-1"
                        />
                      </div>
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Controller
                  name="themeSettings.buttonTextColor"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Label htmlFor="buttonTextColor">Button Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="buttonTextColor"
                          type="color"
                          value={field.value || '#0b1220'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ buttonTextColor: e.target.value });
                          }}
                          className="h-10 w-20 p-1"
                        />
                        <Input
                          value={field.value || '#0b1220'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ buttonTextColor: e.target.value });
                          }}
                          className="flex-1"
                        />
                      </div>
                    </>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <Controller
              name="themeSettings.fontFamily"
              control={control}
              render={({ field }) => (
                <GoogleFontPicker
                  currentFont={field.value}
                  onFontChange={(font) => {
                    field.onChange(font);
                    updateThemeSettings({ fontFamily: font });
                  }}
                />
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Controller
                  name="themeSettings.textColor"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={field.value || '#ffffff'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ textColor: e.target.value });
                          }}
                          className="h-10 w-20 p-1"
                        />
                        <Input
                          value={field.value || '#ffffff'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateThemeSettings({ textColor: e.target.value });
                          }}
                          className="flex-1"
                        />
                      </div>
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Controller
                  name="themeSettings.textTransform"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Label htmlFor="textTransform">Text Transform</Label>
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(value) => {
                          field.onChange(value);
                          updateThemeSettings({ textTransform: value as any });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="uppercase">Uppercase</SelectItem>
                          <SelectItem value="lowercase">Lowercase</SelectItem>
                          <SelectItem value="capitalize">Capitalize</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-1">
              <Controller
                name="themeSettings.customCss"
                control={control}
                render={({ field }) => (
                  <>
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <textarea
                      id="customCss"
                      className="border-input bg-background min-h-[120px] w-full rounded-md border px-3 py-2 font-mono text-xs"
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        updateThemeSettings({ customCss: e.target.value });
                      }}
                      placeholder="/* Add custom CSS here */"
                    />
                    <div className="text-muted-foreground text-xs">
                      Add custom CSS to further customize your profile appearance.
                    </div>
                  </>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
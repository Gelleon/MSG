'use client';

import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export function PreferenceSettings() {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {tCommon('language')}
        </CardTitle>
        <CardDescription>
          {t('languageDesc')}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 hover:bg-muted/20 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{tCommon('language')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('selectLanguage') || 'Select interface language'}
              </p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </CardContent>
    </Card>
  );
}

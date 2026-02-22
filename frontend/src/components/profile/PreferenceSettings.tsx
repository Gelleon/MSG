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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 hover:bg-muted/20 transition-colors profile-card-content">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-sm sm:text-base font-medium block">{tCommon('language')}</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('selectLanguage') || 'Select interface language'}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 profile-switch-container">
              <LanguageSwitcher />
            </div>
          </div>
        </CardContent>
    </Card>
  );
}

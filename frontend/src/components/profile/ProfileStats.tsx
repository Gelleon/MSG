import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Activity, CheckSquare, Clock } from 'lucide-react';

export function ProfileStats() {
  const t = useTranslations('Profile');

  const stats = [
    { label: t('tasksCompleted'), value: 124, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t('hoursLogged'), value: 1250, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('productivity'), value: '98%', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <Card className="h-full border-none shadow-md bg-background/50 backdrop-blur-sm profile-dashboard__card profile-dashboard__card--glass profile-dashboard__card--hoverable">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BarChart className="w-5 h-5 text-primary" />
          {t('statistics')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center p-4 rounded-lg bg-card/50 border border-border/50 profile-stats__card transition-all hover:bg-card">
              <div className={`p-3 rounded-full mb-3 ${stat.bg} ${stat.color} z-10`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-foreground z-10">{stat.value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-center z-10">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

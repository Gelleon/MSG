import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Code, Briefcase } from 'lucide-react';

export function ProfileSkills() {
  const t = useTranslations('Profile');

  const skills = [
    { name: 'TypeScript', type: 'tech' },
    { name: 'React', type: 'tech' },
    { name: 'Next.js', type: 'tech' },
    { name: 'NestJS', type: 'tech' },
    { name: 'Tailwind CSS', type: 'tech' },
    { name: 'Project Management', type: 'soft' },
    { name: 'Agile', type: 'soft' },
    { name: 'Leadership', type: 'soft' },
    { name: 'Communication', type: 'soft' },
  ];

  return (
    <Card className="h-full border-none shadow-md bg-background/50 backdrop-blur-sm profile-dashboard__card profile-dashboard__card--glass profile-dashboard__card--hoverable">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          {t('skills')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge 
              key={index} 
              variant={skill.type === 'tech' ? 'secondary' : 'outline'}
              className={`text-sm px-3 py-1 cursor-default profile-dashboard__skill-tag ${
                skill.type === 'tech' ? 'bg-primary/10 text-primary' : 'border-primary/20'
              }`}
            >
              {skill.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

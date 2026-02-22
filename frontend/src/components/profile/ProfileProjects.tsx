import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderGit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ProfileProjects() {
  const t = useTranslations('Profile');

  const projects = [
    { 
      id: 1, 
      name: 'Corporate Redesign', 
      status: 'active', 
      progress: 75,
      role: 'Lead Developer',
      dueDate: '2024-03-01'
    },
    { 
      id: 2, 
      name: 'API Migration', 
      status: 'completed', 
      progress: 100,
      role: 'Backend Engineer',
      dueDate: '2023-12-15'
    },
    { 
      id: 3, 
      name: 'Mobile App Support', 
      status: 'pending', 
      progress: 30,
      role: 'Contributor',
      dueDate: '2024-04-10'
    },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full border-none shadow-md bg-background/50 backdrop-blur-sm profile-dashboard__card profile-dashboard__card--glass profile-dashboard__card--hoverable">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-primary" />
          {t('projects')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="group p-4 rounded-lg border border-border/40 transition-all profile-dashboard__project-card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{project.name}</h4>
                <p className="text-xs text-muted-foreground">{project.role}</p>
              </div>
              <Badge variant="outline" className="text-xs flex items-center gap-1 border-none bg-muted/50">
                {getStatusIcon(project.status)}
                <span className="capitalize">{project.status}</span>
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('progress')}</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" indicatorClassName={getStatusColor(project.status)} />
            </div>
            
            <div className="mt-3 flex justify-end">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Due {project.dueDate}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

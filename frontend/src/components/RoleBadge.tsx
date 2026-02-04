import React from 'react';
import { ShieldCheck, User, UserCog, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type UserRole = 'ADMIN' | 'MANAGER' | 'CLIENT';

interface RoleBadgeProps {
  role: string;
  className?: string;
  isCurrent?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className, isCurrent }) => {
  const t = useTranslations('Roles');
  
  const normalizedRole = role.toUpperCase() as UserRole;

  const config = {
    ADMIN: {
      icon: ShieldCheck,
      label: t('admin'),
      description: t('adminDesc'),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    MANAGER: {
      icon: UserCog,
      label: t('manager'),
      description: t('managerDesc'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    CLIENT: {
      icon: User,
      label: t('client'),
      description: t('clientDesc'),
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
  };

  const currentConfig = config[normalizedRole] || config.CLIENT;
  const Icon = currentConfig.icon;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-1.5 rounded-lg border transition-all duration-200',
        'hover:bg-accent/50',
        currentConfig.borderColor,
        currentConfig.bgColor,
        isCurrent && 'ring-2 ring-primary/20 ring-offset-1',
        className
      )}
    >
      <div className={cn(
        'flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm transition-transform group-hover:scale-110',
        currentConfig.color
      )}>
        <Icon size={14} />
      </div>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={cn('font-semibold text-xs sm:text-sm truncate', currentConfig.color)}>
          {currentConfig.label}
        </span>
        {isCurrent && <Check size={12} className="text-primary shrink-0" />}
      </div>
    </div>
  );
};

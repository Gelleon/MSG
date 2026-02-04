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
        'group flex items-center gap-3 p-2 rounded-lg border transition-all duration-200',
        'hover:bg-[#F5F5F5] hover:shadow-md',
        currentConfig.borderColor,
        currentConfig.bgColor,
        isCurrent && 'ring-2 ring-[#1890FF] ring-offset-1',
        className
      )}
    >
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm transition-transform group-hover:scale-110',
        currentConfig.color
      )}>
        <Icon size={20} />
      </div>
      
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold text-sm sm:text-base', currentConfig.color)}>
            {currentConfig.label}
          </span>
          {isCurrent && <Check size={14} className="text-[#1890FF]" />}
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
          {currentConfig.description}
        </span>
      </div>
    </div>
  );
};

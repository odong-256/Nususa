import React from 'react';
import { UserStatus, ElectionStatus } from '../types';

interface StatusBadgeProps {
  status: UserStatus | ElectionStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5'
  }[size];

  const getStyle = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/20';
      case 'pending':
      case 'scheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/20';
      case 'rejected':
      case 'closed':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/20';
      case 'suspended':
      case 'archived':
        return 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-600/10';
      case 'draft':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-600/20';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDotColor = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'open':
        return 'bg-emerald-500';
      case 'pending':
      case 'scheduled':
        return 'bg-amber-500';
      case 'rejected':
      case 'closed':
        return 'bg-rose-500';
      case 'suspended':
      case 'archived':
        return 'bg-slate-400';
      case 'draft':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatText = (txt: string) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${getStyle()} transition-all`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      <span className="whitespace-nowrap">{formatText(status)}</span>
    </span>
  );
};

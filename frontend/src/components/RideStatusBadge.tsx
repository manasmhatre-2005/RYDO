import React from 'react';
import { RideStatusType } from '../types';

interface RideStatusBadgeProps {
  status: RideStatusType | string;
}

export const RideStatusBadge: React.FC<RideStatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SEARCHING':
      case 'REQUESTED':
        return {
          label: 'Matching Driver',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
          dot: 'bg-amber-400',
        };
      case 'ACCEPTED':
        return {
          label: 'Driver Assigned',
          classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'ARRIVED':
        return {
          label: 'Driver Arrived',
          classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-bounce',
          dot: 'bg-purple-400',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Trip in Progress',
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-ping',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400',
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

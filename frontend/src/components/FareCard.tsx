import React from 'react';
import { FareTierEstimate } from '../types';
import { Users, Clock, Zap, ShieldCheck } from 'lucide-react';

interface FareCardProps {
  tier: FareTierEstimate;
  isSelected: boolean;
  onSelect: () => void;
}

export const FareCard: React.FC<FareCardProps> = ({ tier, isSelected, onSelect }) => {
  const getTierIcon = (vtype: string) => {
    switch (vtype) {
      case 'COMFORT':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-sm">
            CF
          </div>
        );
      case 'XL':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-black text-sm">
            XL
          </div>
        );
      case 'PREMIUM':
        return (
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-black text-sm">
            VIP
          </div>
        );
      case 'GO':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm">
            GO
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
        isSelected
          ? 'bg-dark-800/90 border-brand-500 ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/10 scale-[1.01]'
          : 'bg-dark-900/60 hover:bg-dark-800/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center space-x-3.5">
        {getTierIcon(tier.vehicle_type)}
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100 text-sm sm:text-base">{tier.name}</h4>
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <Users className="w-3 h-3" />
              <span>{tier.capacity}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">{tier.description}</p>
          <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-brand-400" />
              <span>{tier.eta_minutes} min away</span>
            </span>
            <span>•</span>
            <span>{tier.distance_km} km</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg sm:text-xl font-extrabold text-white">
          ${tier.estimated_fare.toFixed(2)}
        </div>
        <div className="text-[10px] text-slate-400">Estimated fare</div>
      </div>
    </div>
  );
};

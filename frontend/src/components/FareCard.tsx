import React from 'react';
import { FareTierEstimate } from '../types';
import { Users, Clock } from 'lucide-react';

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
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-xs">
            CF
          </div>
        );
      case 'XL':
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black text-xs">
            XL
          </div>
        );
      case 'PREMIUM':
        return (
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black text-xs">
            VIP
          </div>
        );
      case 'GO':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-electric-500/10 text-electric-400 border border-electric-500/20 flex items-center justify-center font-black text-xs">
            GO
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
        isSelected
          ? 'bg-obsidian-850 border-electric-500 ring-1 ring-electric-500/50 shadow-lg shadow-electric-500/10 scale-[1.01]'
          : 'bg-obsidian-900/80 hover:bg-obsidian-850/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        {getTierIcon(tier.vehicle_type)}
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100 text-xs sm:text-sm">{tier.name}</h4>
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <Users className="w-3 h-3" />
              <span>{tier.capacity}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1">{tier.description}</p>
          <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1 text-electric-400">
              <Clock className="w-3 h-3" />
              <span>{tier.eta_minutes} min away</span>
            </span>
            <span>•</span>
            <span>{tier.distance_km} km</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-base sm:text-lg font-black text-white">
          ${tier.estimated_fare.toFixed(2)}
        </div>
        <div className="text-[9px] text-slate-400">Fare estimate</div>
      </div>
    </div>
  );
};

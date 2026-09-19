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
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-xs shadow-sm">
            CF
          </div>
        );
      case 'XL':
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-black text-xs shadow-sm">
            XL
          </div>
        );
      case 'PREMIUM':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black text-xs shadow-sm">
            VIP
          </div>
        );
      case 'GO':
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-electric-50 text-electric-600 border border-electric-200 flex items-center justify-center font-black text-xs shadow-sm">
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
          ? 'bg-white border-electric-500 ring-2 ring-electric-500/20 shadow-luxury scale-[1.01]'
          : 'bg-white/70 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-3">
        {getTierIcon(tier.vehicle_type)}
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-extrabold text-navy-900 text-xs sm:text-sm">{tier.name}</h4>
            <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
              <Users className="w-3 h-3" />
              <span>{tier.capacity}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">{tier.description}</p>
          <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1 text-electric-600 font-semibold">
              <Clock className="w-3 h-3" />
              <span>{tier.eta_minutes} min away</span>
            </span>
            <span>•</span>
            <span>{tier.distance_km} km</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-base sm:text-lg font-black text-navy-900">
          ₹{tier.estimated_fare.toFixed(2)}
        </div>
        <div className="text-[9px] text-slate-400 font-medium">Fare estimate</div>
      </div>
    </div>
  );
};

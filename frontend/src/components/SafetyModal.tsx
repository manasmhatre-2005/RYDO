import React, { useState } from 'react';
import { Shield, Phone, Share2, AlertTriangle, X, Check } from 'lucide-react';
import { Ride } from '../types';

interface SafetyModalProps {
  ride: Ride;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ ride, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl w-full max-w-md p-6 shadow-luxury-lg animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-navy-900 text-base">RYDO Safety Toolkit</h3>
              <p className="text-[11px] text-slate-400">24/7 Monitored Ride Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy-900 p-1 rounded-full hover:bg-pearl-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 my-5">
          {/* 911 Emergency Button */}
          <a
            href="tel:911"
            className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/70 border border-rose-200 hover:bg-rose-100/70 transition group shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-700 text-sm">Emergency Dispatch (911)</h4>
                <p className="text-[11px] text-rose-500">Immediate local police & ambulance notification</p>
              </div>
            </div>
            <Phone className="w-4 h-4 text-rose-600" />
          </a>

          {/* Share Trip Details */}
          <div
            onClick={handleShare}
            className="flex items-center justify-between p-4 rounded-2xl bg-pearl-100/70 border border-slate-200 hover:bg-white transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-electric-50 text-electric-600 border border-electric-200 flex items-center justify-center shadow-sm">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-sm">Share Trip Telemetry</h4>
                <p className="text-[11px] text-slate-500">Live GPS tracking link for trusted contacts</p>
              </div>
            </div>
            {copied ? (
              <span className="text-xs text-emerald-600 flex items-center space-x-1 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </span>
            ) : (
              <span className="text-xs text-electric-600 font-bold hover:underline">Copy Link</span>
            )}
          </div>

          {/* 24/7 RYDO Safety Desk */}
          <a
            href="tel:+18005557936"
            className="flex items-center justify-between p-4 rounded-2xl bg-pearl-100/70 border border-slate-200 hover:bg-white transition shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 border border-navy-200 flex items-center justify-center shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-sm">RYDO Incident Support Desk</h4>
                <p className="text-[11px] text-slate-500">24/7 dedicated mobility security specialists</p>
              </div>
            </div>
            <span className="text-xs text-navy-900 font-extrabold">1-800-RYDO</span>
          </a>

          {/* Verification Code Reminder */}
          {ride.otp_code && (
            <div className="p-3.5 bg-electric-50 rounded-2xl border border-electric-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start Trip Security PIN</span>
              <div className="text-2xl font-black text-electric-600 tracking-widest mt-0.5">{ride.otp_code}</div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Only share this PIN once you have verified the driver and license plate.</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-pearl-200/70 hover:bg-pearl-300/70 text-navy-900 text-xs font-bold transition"
        >
          Dismiss Toolkit
        </button>

      </div>
    </div>
  );
};

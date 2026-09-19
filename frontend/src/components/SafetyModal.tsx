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
    <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">RYDO Safety Toolkit</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-5">
          {/* 911 Emergency Button */}
          <a
            href="tel:911"
            className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-red-400 text-sm">Emergency Assistance (911)</h4>
                <p className="text-[11px] text-slate-400">Call local police & emergency dispatch</p>
              </div>
            </div>
            <Phone className="w-4 h-4 text-red-400" />
          </a>

          {/* Share Trip Details */}
          <div
            onClick={handleShare}
            className="flex items-center justify-between p-4 rounded-2xl bg-dark-800/80 border border-slate-700/80 hover:bg-dark-700/80 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">Share Trip Status</h4>
                <p className="text-[11px] text-slate-400">Copy live tracking link for friends or family</p>
              </div>
            </div>
            {copied ? (
              <span className="text-xs text-emerald-400 flex items-center space-x-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </span>
            ) : (
              <span className="text-xs text-brand-400 font-semibold">Copy Link</span>
            )}
          </div>

          {/* 24/7 RYDO Safety Desk */}
          <a
            href="tel:+18005557936"
            className="flex items-center justify-between p-4 rounded-2xl bg-dark-800/80 border border-slate-700/80 hover:bg-dark-700/80 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">RYDO 24/7 Safety Line</h4>
                <p className="text-[11px] text-slate-400">Speak directly with RYDO Incident Operations</p>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-semibold">1-800-RYDO</span>
          </a>

          {/* Verification Code Reminder */}
          {ride.otp_code && (
            <div className="p-3 bg-dark-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Your ride verification PIN:</span>
              <div className="text-xl font-black text-brand-400 tracking-widest mt-0.5">{ride.otp_code}</div>
              <span className="text-[10px] text-slate-400">Ensure driver's license plate matches before entering.</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          Close
        </button>

      </div>
    </div>
  );
};

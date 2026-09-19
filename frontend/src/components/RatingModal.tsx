import React, { useState } from 'react';
import { Star, CheckCircle, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../api/client';

interface RatingModalProps {
  rideId: number;
  driverName?: string;
  driverAvatar?: string;
  fare: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  rideId,
  driverName = "Your Driver",
  driverAvatar,
  fare,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = ["Great Conversation", "Clean Car", "Smooth Navigation", "Polite & Professional", "Fast Pickup"];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fullComment = [
        selectedTags.length > 0 ? `[${selectedTags.join(', ')}]` : '',
        comment
      ].filter(Boolean).join(' - ');

      await apiClient.post('/rides/rate', {
        ride_id: rideId,
        rating,
        comment: fullComment || "Great trip!"
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // confetti fallback
      }

      onSuccess();
    } catch (err) {
      console.error("Failed to submit rating", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-3xl w-full max-w-md p-6 shadow-luxury-lg animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-navy-900 transition hover:bg-pearl-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center -mt-2">
          {driverAvatar ? (
            <img
              src={driverAvatar}
              alt={driverName}
              className="w-16 h-16 rounded-2xl mx-auto border-2 border-electric-400 object-cover shadow-md mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto bg-electric-50 border-2 border-electric-300 flex items-center justify-center text-xl font-bold text-electric-600 mb-3">
              {driverName.charAt(0)}
            </div>
          )}

          <h3 className="text-xl font-black text-navy-900">How was your ride with {driverName}?</h3>
          <p className="text-xs text-slate-500 mt-1">Trip settled: <span className="font-bold text-navy-900">₹{fare.toFixed(2)}</span></p>

          {/* Star Rating selector */}
          <div className="flex items-center justify-center space-x-2 my-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedTags.includes(tag)
                    ? 'bg-electric-500 text-white shadow-sm'
                    : 'bg-pearl-100 text-slate-600 hover:bg-pearl-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Comment text area */}
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your trip experience (optional)..."
            className="w-full bg-pearl-100/60 border border-slate-200 rounded-2xl p-3 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition"
          />

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-black text-xs transition shadow-md shadow-electric-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Rating & Feedback'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

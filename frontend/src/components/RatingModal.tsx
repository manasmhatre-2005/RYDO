import React, { useState } from 'react';
import { Star, CheckCircle, Heart, ThumbsUp, Sparkles, MessageSquare } from 'lucide-react';
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
  const [tip, setTip] = useState<number>(0);
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
    <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="text-center">
          {driverAvatar ? (
            <img
              src={driverAvatar}
              alt={driverName}
              className="w-16 h-16 rounded-full mx-auto border-2 border-brand-500 object-cover shadow-lg mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto bg-dark-800 border-2 border-brand-500 flex items-center justify-center text-xl font-bold text-brand-400 mb-3">
              {driverName.charAt(0)}
            </div>
          )}

          <h3 className="text-xl font-extrabold text-white">How was your ride with {driverName}?</h3>
          <p className="text-xs text-slate-400 mt-1">Trip settled: ${fare.toFixed(2)}</p>

          {/* Star Rating selector */}
          <div className="flex items-center justify-center space-x-2 my-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'text-brand-400 fill-brand-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Quick compliment tags */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-semibold'
                      : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Optional Comment */}
          <div className="mb-5">
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a note for your driver (optional)..."
              className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-dark-800 transition"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-2/3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 text-xs font-extrabold transition shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

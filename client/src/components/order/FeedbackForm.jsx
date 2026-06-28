import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, MessageSquare } from 'lucide-react';
import { submitFeedback } from '../../api/feedback.js';
import Button from '../ui/Button.jsx';

export function FeedbackForm({ orderId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await submitFeedback({ orderId, rating, comment: comment.trim() || undefined });
      setStatus('success');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to submit feedback');
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-pale-light rounded-2xl border border-gold-muted/30 p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={24} className="text-green-600" />
        </div>
        <h3 className="font-display text-xl text-rough mb-2">Thank You!</h3>
        <p className="text-sm text-gold-muted">Your feedback helps us serve you better.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-pale-light rounded-2xl border border-gold-muted/30 p-6 space-y-5"
      aria-label="Feedback form"
    >
      <div className="text-center">
        <h3 className="font-display text-xl text-rough mb-1">Rate Your Experience</h3>
        <p className="text-sm text-gold-muted">How was your meal today?</p>
      </div>

      {status === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Star rating */}
      <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110"
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={32}
              className={[
                'transition-colors',
                star <= (hover || rating)
                  ? 'fill-gold text-gold'
                  : 'text-gold-muted/30',
              ].join(' ')}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-center text-sm text-gold font-medium">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
        </p>
      )}

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more about your experience (optional)"
        rows={3}
        className="w-full bg-pale rounded-xl border border-gold-muted/40 px-4 py-3 text-sm text-rough placeholder:text-gold-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors resize-none"
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={rating < 1}
        loading={status === 'loading'}
      >
        <Send size={16} aria-hidden="true" />
        Submit Feedback
      </Button>
    </motion.form>
  );
}

export default FeedbackForm;

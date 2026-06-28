import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../../api/client.js';
import { formatDate } from '../../../utils/formatting.js';
import Button from '../../../components/ui/Button.jsx';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Card from '../../../components/ui/Card.jsx';
import StarRating from '../../../components/ui/StarRating.jsx';

export default function FeedbackTab() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/feedback');
      setFeedbackList(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load guest feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Calculate metrics
  const totalReviews = feedbackList.length;
  const averageRating = totalReviews > 0
    ? Number((feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1))
    : 0;

  // Histogram calculation
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbackList.forEach(f => {
    if (distribution[f.rating] !== undefined) {
      distribution[f.rating]++;
    }
  });

  const getPercent = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const filteredFeedback = feedbackList.filter(f => {
    if (selectedRatingFilter === 'all') return true;
    return Number(f.rating) === Number(selectedRatingFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-rough">Guest Feedback & Reviews</h2>
          <p className="text-sm text-gold-muted mt-1">Review guest ratings, recommendations, and service reviews.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback} disabled={loading}>
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Analyzing satisfaction metrics..." />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      ) : totalReviews === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-gold-muted">
          <MessageSquare size={36} className="text-gold-muted/40 mb-2" />
          <p className="font-display font-medium text-rough text-lg">No Guest Feedback Yet</p>
          <p className="text-sm">Guest reviews will appear here once orders are delivered and rated.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Summary & Histogram */}
          <div className="space-y-6">
            {/* Average Rating Tile */}
            <Card className="p-6 text-center flex flex-col items-center gap-3">
              <div className="p-3 bg-gold/10 rounded-full text-gold">
                <Award size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold text-gold uppercase">Average Guest Rating</span>
                <div className="font-display text-5xl font-bold text-rough mt-1.5 flex items-baseline justify-center gap-1">
                  {averageRating}
                  <span className="text-lg text-gold-muted font-sans font-normal">/ 5</span>
                </div>
              </div>
              <div className="flex justify-center mt-1">
                <StarRating value={Math.round(averageRating)} readOnly size="md" />
              </div>
              <p className="text-xs text-gold-muted">Based on {totalReviews} verified guest submissions.</p>
            </Card>

            {/* Histogram Card */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-rough font-display">Rating Distribution</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = distribution[stars] || 0;
                  const percent = getPercent(count);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => setSelectedRatingFilter(stars.toString())}
                        className="flex items-center gap-1 text-body hover:text-gold transition-colors font-medium min-w-[32px] text-left"
                      >
                        {stars} ★
                      </button>
                      <div className="flex-1 h-2.5 bg-pale rounded-full overflow-hidden border border-gold-muted/20">
                        <div
                          className="h-full bg-gold rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-gold-muted w-10 text-right">{percent}%</span>
                    </div>
                  );
                })}
              </div>
              {selectedRatingFilter !== 'all' && (
                <button
                  onClick={() => setSelectedRatingFilter('all')}
                  className="w-full text-center text-xs text-gold hover:text-gold-hover font-semibold mt-3 pt-2 border-t border-gold-muted/15"
                >
                  Clear filter and show all
                </button>
              )}
            </Card>
          </div>

          {/* Right panel: Feedback Records List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-gold-muted/30 pb-3">
              <h3 className="font-display font-semibold text-rough text-lg">
                Reviews {selectedRatingFilter !== 'all' ? `(${selectedRatingFilter} Star)` : '(All)'}
              </h3>
              <div className="flex gap-1.5">
                {['all', '5', '4', '3', '2', '1'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRatingFilter(r)}
                    className={[
                      'px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors',
                      selectedRatingFilter === r
                        ? 'bg-gold text-pale-light'
                        : 'bg-pale text-rough hover:bg-pale-light'
                    ].join(' ')}
                  >
                    {r === 'all' ? 'All' : `${r}★`}
                  </button>
                ))}
              </div>
            </div>

            {filteredFeedback.length === 0 ? (
              <div className="text-center py-12 text-gold-muted bg-surface/30 rounded-2xl border border-dashed border-gold-muted/40">
                <AlertTriangle size={24} className="mx-auto mb-2 text-gold-muted/60" />
                <p className="font-medium text-rough">No Reviews Found</p>
                <p className="text-xs">No guest reviews matched this star filter.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredFeedback.map(f => (
                  <Card key={f.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-rough">
                            {f.name || 'Anonymous Guest'}
                          </span>
                          <span className="text-[10px] bg-gold/15 text-gold border border-gold/25 px-1.5 py-0.5 rounded font-semibold font-sans">
                            Table {f.tableNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-gold-muted mt-0.5">{formatDate ? formatDate(f.createdAt) : f.createdAt}</p>
                      </div>
                      <StarRating value={f.rating} readOnly size="sm" />
                    </div>
                    {f.comment ? (
                      <p className="text-sm text-body leading-relaxed bg-pale/40 p-3 rounded-lg border border-gold-muted/15 font-sans">
                        "{f.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-gold-muted italic">No text comments provided.</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

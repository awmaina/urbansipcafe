import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

export default function ReviewsSection() {
  const { isAuthenticated } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const { data: reviews, refetch } = trpc.reviews.list.useQuery({ limit: 10 });
  const createMutation = trpc.reviews.create.useMutation();

  const handleSubmitReview = async () => {
    if (!title) {
      toast.error('Please enter a review title');
      return;
    }

    try {
      await createMutation.mutateAsync({
        rating,
        title,
        comment,
      });
      toast.success('Review submitted! Awaiting moderation.');
      setTitle('');
      setComment('');
      setRating(5);
      setShowReviewForm(false);
      refetch();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
            <p className="text-gray-600">What our customers love about Urban Sip</p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setShowReviewForm(true)} className="gap-2">
              Write Review
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {reviews?.map((review) => (
            <div key={review.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{review.title}</h3>
                  {renderStars(review.rating)}
                </div>
              </div>
              {review.comment && <p className="text-gray-700">{review.comment}</p>}
              <p className="text-sm text-gray-500 mt-3">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Review title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Your review (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} className="flex-1">
                  Submit Review
                </Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

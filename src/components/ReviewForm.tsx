import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewFormProps {
  productId?: string;
  serviceId?: string;
  authorId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, serviceId, authorId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { toast.error("Please pick a star rating"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      author_id: authorId,
      product_id: productId ?? null,
      service_id: serviceId ?? null,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your review!");
    setRating(0); setComment("");
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-t pt-4 mt-4">
      <div>
        <div className="text-sm font-medium mb-1">Your rating</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} stars`}
            >
              <Star className={`h-6 w-6 transition-colors ${n <= (hover || rating) ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        rows={3}
      />
      <Button type="submit" disabled={submitting} size="sm" className="bg-gradient-primary text-primary-foreground">
        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Post review
      </Button>
    </form>
  );
}

// Verified vendor badge — small reusable indicator.
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  showLabel?: boolean;
}

export function VerifiedBadge({ className, showLabel = false }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-primary",
        className,
      )}
      title="Verified shop — identity confirmed by Shahar Bazar"
    >
      <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />
      {showLabel && <span className="text-xs font-semibold">Verified</span>}
    </span>
  );
}

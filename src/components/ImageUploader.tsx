import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  /** Current public image URL (or null/empty). */
  value: string | null | undefined;
  /** Called with the new public URL after upload, or "" when removed. */
  onChange: (url: string) => void;
  /** Owner user id — used as the storage folder prefix to satisfy RLS. */
  userId: string;
  /** Label shown above. */
  label: string;
  /** Optional sub-label. */
  hint?: string;
  /** Visual shape. */
  shape?: "circle" | "rect";
  /** Aspect classes for the rect preview. */
  aspectClassName?: string;
  /** Sub-folder under the user id (e.g. "avatar", "logo", "banner"). */
  folder?: string;
}

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export function ImageUploader({
  value,
  onChange,
  userId,
  label,
  hint,
  shape = "rect",
  aspectClassName = "aspect-video",
  folder = "img",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be smaller than 4 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
    setUploading(false);
    onChange(data.publicUrl);
    toast.success("Image uploaded");
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = "";
  };

  const remove = () => onChange("");

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>

      <div
        className={cn(
          "relative overflow-hidden bg-secondary border border-dashed border-border flex items-center justify-center group",
          shape === "circle" ? "h-28 w-28 rounded-full" : `${aspectClassName} w-full rounded-lg`,
        )}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={remove}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs px-2 text-center">
            <Upload className="h-5 w-5" />
            <span>No image yet</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
          <Upload className="h-3.5 w-3.5 mr-1" /> {value ? "Change" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={uploading}>
            Remove
          </Button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInput} />
    </div>
  );
}

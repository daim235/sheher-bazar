import { useEffect, useState } from "react";
import { listAddresses, type Address } from "@/lib/api/addresses";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (a: Address) => void;
}

export function AddressPicker({ selectedId, onSelect }: Props) {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAddresses()
      .then((data) => {
        setItems(data);
        if (!selectedId && data.length > 0) {
          const def = data.find((a) => a.is_default) ?? data[0];
          onSelect(def);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" /> Choose a saved address
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
        {items.map((a) => {
          const active = a.id === selectedId;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a)}
              className={`text-left rounded-md border p-3 transition-colors ${
                active ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{a.label}</Badge>
                {a.is_default && <Badge className="bg-primary text-primary-foreground text-[10px]">Default</Badge>}
              </div>
              <div className="text-sm mt-1 line-clamp-2">{a.address_line}</div>
              <div className="text-xs text-muted-foreground">📞 {a.phone}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

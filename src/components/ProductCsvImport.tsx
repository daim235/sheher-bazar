import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Loader2, FileDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Row {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
}

interface Props {
  vendorId: string;
  onImported: () => void;
}

const SAMPLE_CSV = `name,description,price,stock,image_url
Basmati Rice 5kg,Premium long-grain basmati,1499,20,https://example.com/rice.jpg
Olive Oil 1L,Extra virgin cold pressed,2299,15,
`;

export function ProductCsvImport({ vendorId, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (file: File) => {
    setErrors([]);
    setRows([]);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errs: string[] = [];
        const parsed: Row[] = [];
        result.data.forEach((raw, i) => {
          const name = (raw.name ?? "").trim();
          const priceStr = (raw.price ?? "").trim();
          const stockStr = (raw.stock ?? "0").trim();
          if (!name) { errs.push(`Row ${i + 2}: missing name`); return; }
          const price = Number(priceStr);
          const stock = Number(stockStr);
          if (Number.isNaN(price) || price < 0) { errs.push(`Row ${i + 2}: invalid price`); return; }
          if (Number.isNaN(stock) || stock < 0) { errs.push(`Row ${i + 2}: invalid stock`); return; }
          parsed.push({
            name,
            description: (raw.description ?? "").trim() || undefined,
            price,
            stock,
            image_url: (raw.image_url ?? "").trim() || undefined,
          });
        });
        setRows(parsed);
        setErrors(errs);
      },
      error: (err) => setErrors([err.message]),
    });
  };

  const importNow = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const payload = rows.map((r) => ({
        vendor_id: vendorId,
        name: r.name,
        description: r.description ?? null,
        price: r.price,
        stock: r.stock,
        image_url: r.image_url ?? null,
        is_active: true,
      }));
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
      toast.success(`Imported ${rows.length} product${rows.length === 1 ? "" : "s"}`);
      setOpen(false);
      setRows([]);
      onImported();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-1" /> Import CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk import products from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Required columns: <code>name, price, stock</code>. Optional: <code>description, image_url</code></span>
              <Button size="sm" variant="ghost" onClick={downloadSample}>
                <FileDown className="h-4 w-4 mr-1" /> Sample
              </Button>
            </div>

            <Card className="p-6 border-dashed text-center">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="block w-full text-sm"
              />
            </Card>

            {errors.length > 0 && (
              <Card className="p-3 bg-destructive/10 border-destructive/30">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
                  <AlertCircle className="h-4 w-4" /> {errors.length} row{errors.length === 1 ? "" : "s"} skipped
                </div>
                <ul className="text-xs text-destructive/90 space-y-0.5 max-h-32 overflow-y-auto">
                  {errors.map((er, i) => <li key={i}>• {er}</li>)}
                </ul>
              </Card>
            )}

            {rows.length > 0 && (
              <Card className="p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Ready to import {rows.length} product{rows.length === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-muted-foreground max-h-40 overflow-y-auto space-y-1">
                  {rows.slice(0, 8).map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate pr-3">{r.name}</span>
                      <span>Rs {r.price.toLocaleString()} · stock {r.stock}</span>
                    </div>
                  ))}
                  {rows.length > 8 && <div className="italic">…and {rows.length - 8} more</div>}
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={importNow} disabled={importing || rows.length === 0} className="bg-gradient-primary text-primary-foreground">
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {rows.length > 0 ? rows.length : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

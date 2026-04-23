import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, MapPin, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  type Address,
  type AddressInput,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/api/addresses";

const blank: AddressInput = {
  label: "Home",
  full_name: "",
  address_line: "",
  city: "",
  phone: "",
  is_default: false,
};

export function AddressBook() {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAddresses());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...blank, is_default: items.length === 0 });
    setOpen(true);
  };
  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label,
      full_name: a.full_name ?? "",
      address_line: a.address_line,
      city: a.city ?? "",
      phone: a.phone,
      is_default: a.is_default,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address_line.trim() || !form.phone.trim()) {
      toast.error("Address and phone are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing.id, form);
        toast.success("Address updated");
      } else {
        await createAddress(form);
        toast.success("Address added");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Address) => {
    if (!confirm(`Delete "${a.label}"?`)) return;
    try {
      await deleteAddress(a.id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      await setDefaultAddress(a.id);
      toast.success(`"${a.label}" is now default`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Saved addresses</h3>
          <p className="text-xs text-muted-foreground">Pick from these at checkout.</p>
        </div>
        <Button size="sm" onClick={openNew} className="bg-gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add address
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-6" />
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-3 font-medium">No saved addresses</p>
          <p className="text-sm text-muted-foreground mt-1">Add an address to speed up checkout.</p>
          <Button onClick={openNew} className="mt-4 bg-gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add address
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{a.label}</Badge>
                  {a.is_default && <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Default</Badge>}
                </div>
              </div>
              {a.full_name && <div className="mt-2 text-sm font-medium">{a.full_name}</div>}
              <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{a.address_line}</div>
              {a.city && <div className="text-xs text-muted-foreground">{a.city}</div>}
              <div className="text-xs text-muted-foreground mt-1">📞 {a.phone}</div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {!a.is_default && (
                  <Button size="sm" variant="outline" onClick={() => makeDefault(a)}>
                    <Star className="h-3.5 w-3.5 mr-1" /> Set default
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit address" : "New address"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Label</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." />
              </div>
              <div>
                <Label>Full name</Label>
                <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Address *</Label>
              <Textarea
                rows={2}
                value={form.address_line}
                onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                placeholder="House, street, area"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="rounded"
              />
              Set as default address
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

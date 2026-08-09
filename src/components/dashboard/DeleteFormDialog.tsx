import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

interface DeleteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formTitle: string;
  onConfirm: (password: string) => void;
}

export function DeleteFormDialog({ open, onOpenChange, formTitle, onConfirm }: DeleteFormDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onConfirm(password.trim());
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setPassword(""); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Form
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Anda akan menghapus form <strong className="text-foreground">"{formTitle}"</strong>. 
            Masukkan password form untuk konfirmasi.
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Password Form</Label>
            <div className="relative">
              <Input
                id="delete-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password form"
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" variant="destructive" disabled={!password.trim()}>Hapus</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type Player = {
  id: string;
  playerName: string;
  teamName: string;
  createdAt: string;
  isDisabled: boolean;
  isDisqualified: boolean;
  canEnterScore: boolean;
};

type DeletePlayerDialogProps = {
  target: Player | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeletePlayerDialog({ target, isDeleting, onConfirm, onClose }: DeletePlayerDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oyuncuyu Sil</DialogTitle>
          <DialogDescription>
            <strong>{target?.playerName}</strong> adlı oyuncu ve takım seçimi ({target?.teamName}) silinecek.
            Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>İptal</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

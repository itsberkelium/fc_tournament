"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type StartTournamentDialogProps = {
  isOpen: boolean;
  playerCount: number;
  isStarting: boolean;
  onClose: () => void;
  onConfirm: (options: { doubleLegs: boolean; playoffEnabled: boolean; playoffTeamCount: number }) => void;
};

export function StartTournamentDialog({ isOpen, playerCount, isStarting, onClose, onConfirm }: StartTournamentDialogProps) {
  const [doubleLegs, setDoubleLegs] = useState(false);
  const [playoffEnabled, setPlayoffEnabled] = useState(false);
  const [playoffTeamCount, setPlayoffTeamCount] = useState(4);

  function handleConfirm() {
    onConfirm({ doubleLegs, playoffEnabled, playoffTeamCount: playoffEnabled ? playoffTeamCount : 0 });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Turnuvayı Başlat</DialogTitle>
          <DialogDescription>
            {playerCount} oyuncu için lig maçları oluşturulacak. Başlamadan önce ayarları belirle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Çift maç (iç saha + deplasman)?</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={doubleLegs ? "default" : "outline"} onClick={() => setDoubleLegs(true)} className="flex-1">Evet</Button>
              <Button size="sm" variant={!doubleLegs ? "default" : "outline"} onClick={() => setDoubleLegs(false)} className="flex-1">Hayır</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Play-off olacak mı?</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={playoffEnabled ? "default" : "outline"} onClick={() => setPlayoffEnabled(true)} className="flex-1">Evet</Button>
              <Button size="sm" variant={!playoffEnabled ? "default" : "outline"} onClick={() => setPlayoffEnabled(false)} className="flex-1">Hayır</Button>
            </div>
          </div>

          {playoffEnabled && (
            <div className="space-y-2">
              <Label>Kaç takım play-off&apos;a katılacak?</Label>
              <div className="flex gap-2 flex-wrap">
                {[2, 4, 8].filter((n) => n <= playerCount).map((n) => (
                  <Button key={n} size="sm" variant={playoffTeamCount === n ? "default" : "outline"} onClick={() => setPlayoffTeamCount(n)}>
                    İlk {n}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isStarting}>İptal</Button>
          <Button onClick={handleConfirm} disabled={isStarting}>Başlat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

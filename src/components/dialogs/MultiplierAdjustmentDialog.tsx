'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MultiplierAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newMultiplier: number) => void;
  productName: string;
  currentMultiplier: number;
}

export function MultiplierAdjustmentDialog({ isOpen, onClose, onSave, productName, currentMultiplier }: MultiplierAdjustmentDialogProps) {
  const [multiplier, setMultiplier] = useState(currentMultiplier);
  const [error, setError] = useState("");

  useEffect(() => {
    setMultiplier(currentMultiplier);
  }, [currentMultiplier, isOpen]);

  const handleSave = () => {
    const numericMultiplier = parseFloat(multiplier.toString());
    if (isNaN(numericMultiplier) || numericMultiplier <= 0) {
      setError("Please enter a valid, positive number for the multiplier.");
      return;
    }
    setError("");
    onSave(numericMultiplier);
  };

  const handleClose = () => {
    setError("");
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Outlier Multiplier for {productName}</DialogTitle>
          <DialogDescription>
            Manually override the outlier threshold multiplier for this SKU. The outlier threshold is calculated as (Mode Margin % * Multiplier).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            The current multiplier is <strong>{currentMultiplier}x</strong>.
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="multiplier" className="text-right">
              New Multiplier
            </Label>
            <Input
              id="multiplier"
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="col-span-3"
              step="0.1"
            />
          </div>
          {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

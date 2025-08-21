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
import { formatNumber } from "@/lib/utils";

interface ModeAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newMode: number) => void;
  productName: string;
  currentMode: number;
}

export function ModeAdjustmentDialog({ isOpen, onClose, onSave, productName, currentMode }: ModeAdjustmentDialogProps) {
  const [mode, setMode] = useState(currentMode);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode, isOpen]);

  const handleSave = () => {
    const numericMode = parseFloat(mode.toString());
    if (isNaN(numericMode) || numericMode < 0) {
      setError("Please enter a valid, non-negative number for the mode.");
      return;
    }
    setError("");
    onSave(numericMode);
  };

  const handleClose = () => {
    setError("");
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Mode for {productName}</DialogTitle>
          <DialogDescription>
            Manually override the calculated mode margin (M) for this SKU. This will update the outlier threshold, best margin, and all margin loss calculations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            The current calculated mode is <strong>{formatNumber(currentMode)}%</strong>.
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mode" className="text-right">
              New Mode (%)
            </Label>
            <Input
              id="mode"
              type="number"
              value={mode}
              onChange={(e) => setMode(Number(e.target.value))}
              className="col-span-3"
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
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateNutrients, type FoodData } from "@/logic/food-calc";

interface FoodQuantityModalProps {
  open: boolean;
  onClose: () => void;
  foodName: string;
  foodData: FoodData;
  onConfirm: (qty: number, nutrients: ReturnType<typeof calculateNutrients>) => void;
}

export function FoodQuantityModal({
  open,
  onClose,
  foodName,
  foodData,
  onConfirm,
}: FoodQuantityModalProps) {
  const [qty, setQty] = useState(100);

  const nutrients = calculateNutrients(foodData, qty);

  function handleConfirm() {
    if (qty <= 0) return;
    onConfirm(qty, nutrients);
    setQty(100);
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-sm">{foodName}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
              Quantite (g)
            </label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(+e.target.value)}
              min={1}
            />
          </div>

          {/* Preview */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-secondary rounded-lg py-2">
              <div className="font-bold">{Math.round(nutrients.kcal)}</div>
              <div className="text-[9px] text-muted-foreground">kcal</div>
            </div>
            <div className="bg-secondary rounded-lg py-2">
              <div className="font-bold">{nutrients.prot}</div>
              <div className="text-[9px] text-muted-foreground">Prot</div>
            </div>
            <div className="bg-secondary rounded-lg py-2">
              <div className="font-bold">{nutrients.gluc}</div>
              <div className="text-[9px] text-muted-foreground">Gluc</div>
            </div>
            <div className="bg-secondary rounded-lg py-2">
              <div className="font-bold">{nutrients.lip}</div>
              <div className="text-[9px] text-muted-foreground">Lip</div>
            </div>
            <div className="bg-secondary rounded-lg py-2">
              <div className="font-bold">{nutrients.fib}</div>
              <div className="text-[9px] text-muted-foreground">Fib</div>
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full min-h-[44px]">
            Ajouter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

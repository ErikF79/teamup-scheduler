"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextPromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function TextPromptDialog({
  open,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  onClose,
}: TextPromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const submit = () => {
    onConfirm(value);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="grid gap-4 py-2"
        >
          {label && <Label htmlFor="text-prompt-input">{label}</Label>}
          <Input
            id="text-prompt-input"
            autoFocus
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";

type CopyTextButtonProps = {
  value: string;
  className?: string;
};

export default function CopyTextButton({ value, className }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={className}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

import Image from "next/image";

import { cn } from "@/lib/utils";

export function CrystalMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full shadow-[0_0_30px_rgba(47,145,220,0.2)]",
        className,
      )}
    >
      <Image
        alt=""
        className="object-contain"
        fill
        sizes="48px"
        src="/brand/yita-iceberg-logo.webp"
      />
    </span>
  );
}

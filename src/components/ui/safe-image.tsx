"use client";
import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/** next/image with a graceful gradient fallback if the source fails to load. */
export function SafeImage({ className, alt, ...props }: ImageProps) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <div role="img" aria-label={alt} className={cn("bg-gradient-to-br from-navy-600 to-navy-800", className)} />;
  }
  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}

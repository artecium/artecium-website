import { AreaHubPreviewCover } from "@/components/auth/AreaHubPreviewCover";
import type { ReactNode } from "react";

type AreaHubCardPreviewViewportProps = {
  children: ReactNode;
  variant: "client" | "booking";
};

/** Retângulo compacto dos cartões na grelha — preview em modo cover. */
export function AreaHubCardPreviewViewport({
  children,
  variant,
}: AreaHubCardPreviewViewportProps) {
  return (
    <AreaHubPreviewCover variant={variant} className="h-[7.25rem] sm:h-[8rem]">
      {children}
    </AreaHubPreviewCover>
  );
}
import { AreaHubPreviewCover } from "@/components/auth/AreaHubPreviewCover";
import type { ReactNode } from "react";

type AreaHubModalPreviewViewportProps = {
  children: ReactNode;
  variant: "client" | "booking";
};

/** Modal expandido — mesma lógica cover que os cartões, altura mais baixa. */
export function AreaHubModalPreviewViewport({
  children,
  variant,
}: AreaHubModalPreviewViewportProps) {
  return (
    <AreaHubPreviewCover variant={variant} className="h-[6rem] sm:h-[6.75rem]">
      {children}
    </AreaHubPreviewCover>
  );
}
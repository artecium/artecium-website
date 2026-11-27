"use client";

import {
  AreaHubPlatformCard,
  type AreaHubCardId,
  type AreaHubPlatformCardData,
} from "@/components/auth/AreaHubPlatformCard";
import { AreaHubPlatformOverlay } from "@/components/auth/AreaHubPlatformOverlay";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface AreaHubPlatformsGridProps {
  platforms: AreaHubPlatformCardData[];
  /** Dev/QA only — opens overlay on first paint (e.g. /dev/area-hub-preview?open=client). */
  initialOpenId?: AreaHubCardId | null;
}

export function AreaHubPlatformsGrid({
  platforms,
  initialOpenId = null,
}: AreaHubPlatformsGridProps) {
  const [openId, setOpenId] = useState<AreaHubCardId | null>(initialOpenId);

  const openPlatform = platforms.find((p) => p.cardId === openId) ?? null;

  const handleOpen = useCallback((id: AreaHubCardId) => {
    setOpenId(id);
  }, []);

  const handleClose = useCallback(() => {
    setOpenId(null);
  }, []);

  return (
    <LayoutGroup id="area-hub-platforms">
      <div className="mt-10 grid items-start gap-6 sm:mt-12 lg:mt-14 lg:grid-cols-2 lg:gap-8">
        {platforms.map((platform) => (
          <AreaHubPlatformCard
            key={platform.cardId}
            {...platform}
            isOpen={openId === platform.cardId}
            onOpen={() => handleOpen(platform.cardId)}
          />
        ))}
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <LayoutGroup id="area-hub-platforms-overlay">
              <AnimatePresence>
                {openPlatform ? (
                  <AreaHubPlatformOverlay
                    key={openPlatform.cardId}
                    platform={openPlatform}
                    onClose={handleClose}
                  />
                ) : null}
              </AnimatePresence>
            </LayoutGroup>,
            document.body,
          )
        : null}
    </LayoutGroup>
  );
}
import Image from "next/image";

interface ArteciumLogoProps {
  className?: string;
  priority?: boolean;
}

export function ArteciumLogo({
  className = "h-9 w-9 sm:h-10 sm:w-10",
  priority = false,
}: ArteciumLogoProps) {
  return (
    <Image
      src="/artecium-logo.png"
      alt="Artecium"
      width={40}
      height={40}
      className={`shrink-0 object-contain ${className}`}
      priority={priority}
    />
  );
}

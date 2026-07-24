import Image from "next/image";

interface ArteciumLogoProps {
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function ArteciumLogo({
  className = "h-9 w-9 sm:h-10 sm:w-10",
  priority = false,
  alt = "Artecium logo — premium software and AI solutions",
}: ArteciumLogoProps) {
  return (
    <Image
      src="/artecium-logo.png"
      alt={alt}
      width={40}
      height={40}
      className={`shrink-0 object-contain ${className}`}
      priority={priority}
    />
  );
}

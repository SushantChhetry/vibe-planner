import Image from "next/image";

export const BRAND_LOGO_PATH = "/images/logo-transparent.png";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority }: BrandLogoProps) {
  return (
    <Image
      src={BRAND_LOGO_PATH}
      alt="PuMi"
      width={280}
      height={84}
      className={className}
      priority={priority}
    />
  );
}

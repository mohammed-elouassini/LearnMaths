import { Sigma } from 'lucide-react';

interface BrandLogoProps {
  avatarDataUrl: string | null;
  className: string;
  iconClassName: string;
}

export function BrandLogo({ avatarDataUrl, className, iconClassName }: BrandLogoProps) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-brand-600 text-white ${className}`}>
      {avatarDataUrl ? (
        <img src={avatarDataUrl} alt="Photo de profil" className="h-full w-full object-cover" />
      ) : (
        <Sigma className={iconClassName} />
      )}
    </div>
  );
}

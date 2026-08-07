import Image from "next/image";
import { PackageSearch } from "lucide-react";

export function ProductImage({
  imageUrl,
  name,
  className,
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-brand-orange-light ${className ?? ""}`}>
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand-orange-light to-brand-blue-light ${className ?? ""}`}
    >
      <PackageSearch className="h-10 w-10 text-brand-blue/40" strokeWidth={1.5} />
    </div>
  );
}

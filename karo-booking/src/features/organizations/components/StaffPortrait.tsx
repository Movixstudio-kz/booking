import Image from "next/image";
import { getPublicAssetPath } from "@/config/routes";
import type { PublicStaffItem } from "@/features/staff/types";

type StaffPortraitProps = {
  member: PublicStaffItem;
  className: string;
};

export function StaffPortrait({ member, className }: StaffPortraitProps) {
  if (!member.photoUrl) {
    return (
      <div
        role="img"
        aria-label={`Фото ${member.name}`}
        className={`grid place-items-center text-6xl font-bold text-[#10231d] ${className}`}
        style={{ backgroundColor: member.calendarColor }}
      >
        {member.name.slice(0, 1)}
      </div>
    );
  }

  return (
    <Image
      src={getPublicAssetPath(member.photoUrl)}
      alt={`Фото ${member.name}`}
      width={720}
      height={780}
      unoptimized
      className={className}
    />
  );
}

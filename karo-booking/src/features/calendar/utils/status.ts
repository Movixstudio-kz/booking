import type { BookingStatus } from "@/features/booking/types";

export const calendarStatusStyles: Record<BookingStatus, string> = {
  new: "border-[#e9bd57] bg-[#fff6d9] text-[#76551a]",
  confirmed: "border-[#78aef2] bg-[#e9f3ff] text-[#285f98]",
  in_progress: "border-[#aa8be6] bg-[#f2edff] text-[#624496]",
  completed: "border-[#70c591] bg-[#e8faef] text-[#226b40]",
  cancelled: "border-[#e18b82] bg-[#fff1ef] text-[#963e35]",
};

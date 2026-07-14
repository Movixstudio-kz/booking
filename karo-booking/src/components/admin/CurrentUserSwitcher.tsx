"use client";

import { currentUserOptions } from "@/config/currentUser";
import { useCurrentUser } from "@/hooks";

export function CurrentUserSwitcher() {
  const { currentUser, selectCurrentUser } = useCurrentUser();

  return (
    <label className="relative flex items-center">
      <span className="sr-only">Текущий пользователь</span>
      <select
        value={currentUser.id}
        onChange={(event) => selectCurrentUser(event.target.value)}
        aria-label="Текущий пользователь"
        className="max-w-[12rem] appearance-none rounded-xl border border-[#dfe5da] bg-white py-2.5 pl-3 pr-8 text-sm font-semibold text-[#24382f] shadow-sm outline-none transition hover:bg-[#f5f7f3] focus:border-[#83a08f] sm:max-w-none"
      >
        {currentUserOptions.map(({ label, user }) => (
          <option key={user.id} value={user.id}>
            {label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-xs text-[#7f9187]"
      >
        ▾
      </span>
    </label>
  );
}

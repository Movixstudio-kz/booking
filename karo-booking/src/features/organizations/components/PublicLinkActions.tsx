"use client";

import Link from "next/link";
import { useState } from "react";
import { getAbsolutePublicUrl } from "@/config/routes";

type PublicLinkActionsProps = {
  route: string;
  showOpen?: boolean;
  compact?: boolean;
};

export function PublicLinkActions({
  route,
  showOpen = true,
  compact = false,
}: PublicLinkActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = getAbsolutePublicUrl(window.location.origin, route);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={compact ? "mt-4" : "mt-5"}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#789087]">
        Публичная ссылка
      </p>
      <p className="mt-2 truncate rounded-lg bg-[#f3f6f1] px-3 py-2 font-mono text-[11px] text-[#607068]">
        {route}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-lg border border-[#d5ddd5] bg-white px-3 py-2 text-xs font-semibold text-[#365146] transition hover:border-[#9fb0a3]"
        >
          {copied ? "Скопировано" : "Копировать"}
        </button>
        {showOpen && (
          <Link
            href={route}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#10231d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#244137]"
          >
            Открыть
          </Link>
        )}
      </div>
    </div>
  );
}

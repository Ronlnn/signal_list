"use client";
import React, { useMemo, useState, useTransition } from "react";
import {t} from "@/lib/i18n";
import {addToWatchlist, removeFromWatchlist} from "@/lib/actions/watchlist.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import { Trash2 } from "lucide-react";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const router = useRouter();
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    if (isPending) return added ? t('watchlist.removing') : t('watchlist.adding');
    return added ? t('watchlist.remove') : t('watchlist.add');
  }, [added, isPending, type]);

  const handleClick = () => {
    const next = !added;
    startTransition(async () => {
      const result = next
        ? await addToWatchlist(symbol, company)
        : await removeFromWatchlist(symbol);

      if (!result.success) {
        toast.error(result.error || t('watchlist.actionFailed'));
        return;
      }

      setAdded(next);
      onWatchlistChange?.(symbol, next);
      toast.success(
        next
          ? t('watchlist.added', { symbol })
          : t('watchlist.removed', { symbol })
      );
      router.refresh();
    });
  };

  if (type === "icon") {
    return (
      <button
        title={added ? t('watchlist.removeTitle', { symbol: company || symbol }) : t('watchlist.addTitle', { symbol: company || symbol })}
        aria-label={added ? t('watchlist.removeTitle', { symbol: company || symbol }) : t('watchlist.addTitle', { symbol: company || symbol })}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={isPending}
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className="watchlist-star"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} onClick={handleClick} disabled={isPending} type="button">
      {showTrashIcon && added ? (
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

type Match = {
  id: number;
  status: string;
  elapsed: number | null;
  league: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

type FootballData = {
  date: string;
  matches: Match[];
  error?: string;
};

function statusLabel(status: string, elapsed: number | null, isAr: boolean): string {
  switch (status) {
    case "1H":
    case "2H":
    case "ET":
      return elapsed ? `${elapsed}'` : isAr ? "مباشر" : "Live";
    case "HT":
      return isAr ? "استراحة" : "HT";
    case "FT":
    case "AET":
    case "PEN":
      return isAr ? "انتهت" : "FT";
    case "NS":
      return isAr ? "لم تبدأ" : "NS";
    case "TBD":
      return isAr ? "لاحقاً" : "TBD";
    default:
      return status;
  }
}

function isLive(status: string) {
  return ["1H", "2H", "ET", "HT", "LIVE", "P"].includes(status);
}

export function FootballWidget({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const reduced = useReducedMotion();
  const [data, setData] = useState<FootballData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/football");
        const json = await res.json();
        if (!cancelled && !json.error) setData(json);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
          <Trophy className="h-3.5 w-3.5" />
          {isAr ? "المباريات" : "Today's Matches"}
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.matches?.length) return null;

  const topMatches = data.matches.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0.15 : 0.45 }}
      className="glass rounded-[var(--radius-lg)] p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
          <Trophy className="h-3.5 w-3.5" />
          {isAr ? "مباريات اليوم" : "Today's Matches"}
        </div>
        <span className="text-xs text-[var(--text-3)]">{data.date}</span>
      </div>

      <div className="mt-4 space-y-2">
        {topMatches.map((match) => {
          const live = isLive(match.status);
          return (
            <div
              key={match.id}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${live ? "border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5" : "border-[var(--glass-border)] bg-white/5"}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                {match.homeLogo ? <Image src={match.homeLogo} alt="" width={16} height={16} className="h-4 w-4 shrink-0 object-contain" /> : null}
                <span className="truncate text-xs font-medium text-[var(--text-1)]">{match.homeTeam}</span>
              </div>

              <div className="flex shrink-0 flex-col items-center">
                <span className="font-display text-sm font-bold text-[var(--text-1)]">
                  {match.homeGoals ?? "-"} : {match.awayGoals ?? "-"}
                </span>
                <span className={`text-[10px] font-semibold ${live ? "text-[var(--accent-red)]" : "text-[var(--text-3)]"}`}>
                  {live ? "● " : ""}{statusLabel(match.status, match.elapsed, isAr)}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 truncate">
                <span className="truncate text-xs font-medium text-[var(--text-1)]">{match.awayTeam}</span>
                {match.awayLogo ? <Image src={match.awayLogo} alt="" width={16} height={16} className="h-4 w-4 shrink-0 object-contain" /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

type WeatherData = {
  city: string;
  country: string;
  temp_c: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_kph: number;
  feelslike_c: number;
  is_day: number;
  localtime: string;
  error?: string;
};

export function WeatherWidget({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const reduced = useReducedMotion();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/weather?city=Berlin");
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
          <CloudSun className="h-3.5 w-3.5" />
          {isAr ? "الطقس" : "Weather"}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 w-24 animate-pulse rounded-md bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-white/10" />
        </div>
      </div>
    );
  }

  if (!data) return null;

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
          <CloudSun className="h-3.5 w-3.5" />
          {isAr ? "الطقس الآن" : "Weather now"}
        </div>
        <span className="text-xs text-[var(--text-3)]">{data.city}</span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {data.icon ? (
          <Image src={data.icon.startsWith("//") ? `https:${data.icon}` : data.icon} alt={data.condition} width={48} height={48} className="h-12 w-12" />
        ) : null}
        <div>
          <div className="font-display text-3xl font-extrabold text-[var(--text-1)]">{Math.round(data.temp_c)}°C</div>
          <div className="text-xs text-[var(--text-2)]">{data.condition}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 text-[var(--text-3)]">
          <Thermometer className="h-3.5 w-3.5" />
          <span className="text-xs">{isAr ? "يحس" : "Feels"} {Math.round(data.feelslike_c)}°</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-3)]">
          <Wind className="h-3.5 w-3.5" />
          <span className="text-xs">{Math.round(data.wind_kph)} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-3)]">
          <Droplets className="h-3.5 w-3.5" />
          <span className="text-xs">{data.humidity}%</span>
        </div>
      </div>
    </motion.div>
  );
}

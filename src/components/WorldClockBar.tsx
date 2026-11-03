import React, { useState, useEffect, useMemo } from 'react';
import {
  COMMUNITY_COUNTRIES,
  CountryClock,
  getDetectedUserLocation,
  formatTimeInZone,
  formatDateInZone,
  convertUtcHourToLocal,
} from '../utils/timezone';
import { Globe, MapPin, Clock, Sparkles, ChevronRight, Shield } from 'lucide-react';

interface WorldClockBarProps {
  compact?: boolean;
}

export const WorldClockBar: React.FC<WorldClockBarProps> = ({ compact = false }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // Auto-detect user's location on load
  const userLocation = useMemo(() => getDetectedUserLocation(), []);

  // Live ticker updating every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userTimeFormatted = formatTimeInZone(currentTime, userLocation.timeZone);
  const userDateFormatted = formatDateInZone(currentTime, userLocation.timeZone);
  const serverTimeFormatted = formatTimeInZone(currentTime, 'UTC');

  // Castle Siege converted to user's local hour (Sunday at 20:00 UTC)
  const siegeLocalHour = convertUtcHourToLocal(20, userLocation.timeZone);

  if (compact) {
    return (
      <div className="bg-[#0a0e1c] border-b border-purple-500/20 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Tu horario ({userLocation.countryName}):</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">{userTimeFormatted}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Servidor (UTC):</span>
            <span className="font-mono text-amber-300 tabular-nums">{serverTimeFormatted}</span>
          </div>

          <div className="text-[11px] text-red-300 font-mono flex items-center space-x-1.5">
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/50">
              Deshabilitado
            </span>
            <span>🏰 Castle Siege: Domingos {siegeLocalHour} hs (Al activarse en servidor)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-r from-[#0b0e1d] via-[#10152e] to-[#0c1020] border-b border-purple-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        {/* Top line: Auto-detection banner + Live Local Time */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-300 shrink-0">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <span>Horarios Oficiales Internacionales</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ubicación Detectada Automáticamente</span>
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400 inline shrink-0" />
                <span className="text-slate-200 font-bold">{userLocation.flag} {userLocation.countryName}</span>
                <span className="text-slate-500">({userLocation.cityName} · {userLocation.utcOffsetLabel})</span>
                <span className="text-slate-600">·</span>
                <span className="text-purple-300 font-mono">Zona: {userLocation.timeZone}</span>
              </div>
            </div>
          </div>

          {/* User's Prominent Clock Badge */}
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="bg-[#070a16] border border-cyan-500/40 rounded-xl px-3.5 py-1.5 text-right shadow-inner">
              <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 flex items-center justify-end space-x-1">
                <span>Tu Hora Local ({userLocation.countryName})</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono tabular-nums leading-tight mt-0.5">
                {userTimeFormatted}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{userDateFormatted}</div>
            </div>

            <div className="hidden sm:block bg-[#070a16] border border-amber-500/30 rounded-xl px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Server (UTC)</div>
              <div className="text-lg font-black text-amber-300 font-mono tabular-nums leading-tight mt-0.5">
                {serverTimeFormatted}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Smash MU</div>
            </div>
          </div>
        </div>

        {/* Multi-Country Live Time Cards Bar (Horario actual de cada país) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {COMMUNITY_COUNTRIES.slice(0, 7).map((item) => {
            const isUserCountry =
              userLocation.timeZone === item.timeZone ||
              userLocation.countryName.toLowerCase() === item.country.toLowerCase();
            const countryTime = formatTimeInZone(currentTime, item.timeZone);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCountryId(item.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-default flex flex-col justify-between ${
                  isUserCountry
                    ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500/40 shadow-md shadow-purple-950/50'
                    : 'bg-[#080b16] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base">{item.flag}</span>
                    <span className="font-bold text-white text-[11px] truncate max-w-[70px]">
                      {item.country}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded">
                    {item.utcOffsetLabel}
                  </span>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="font-mono tabular-nums font-black text-sm text-cyan-300">
                    {countryTime}
                  </span>
                  {isUserCountry && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-1 rounded">
                      Tu País
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional community countries strip & Event Synced Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500 font-semibold">Otros Países del Clan:</span>
            {COMMUNITY_COUNTRIES.slice(7, 12).map((item) => {
              const countryTime = formatTimeInZone(currentTime, item.timeZone);
              return (
                <div key={item.id} className="flex items-center space-x-1 font-mono">
                  <span>{item.flag}</span>
                  <span className="text-slate-300 font-sans">{item.country}:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{countryTime.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700/50">
              Deshabilitado en Servidor
            </span>
            <span className="text-slate-400">Castle Siege:</span>
            <span className="text-amber-400 font-mono font-bold">Domingos {siegeLocalHour} hs</span>
            <span className="text-slate-500 font-normal">({userLocation.utcOffsetLabel} · Horario al inaugurarse)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

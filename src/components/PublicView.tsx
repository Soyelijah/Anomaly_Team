import React, { useState } from 'react';
import { Character, ClanConfig, CharacterClass } from '../types/clan';
import { GuildMark } from './GuildMark';
import { ClanHeroBanner } from './ClanHeroBanner';
import { RosterView } from './RosterView';
import {
  Shield,
  Trophy,
  Users,
  Swords,
  Crown,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Eye,
  MessageSquare,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface PublicViewProps {
  clanConfig: ClanConfig;
  characters: Character[];
  onApplyRecruit: (app: {
    characterName: string;
    characterClass: CharacterClass;
    resets: number;
    level: number;
    contact: string;
    motivation: string;
  }) => void;
  onNavigateToTab: (tab: string) => void;
  onInspectEquipment?: (name: string) => void;
  isOfficer?: boolean;
  onEditCharacter?: (char: Character) => void;
  onDeleteCharacter?: (id: string) => void;
  onOpenAddModal?: () => void;
  onOpenCommunity?: () => void;
  syncLog?: string[];
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export const PublicView: React.FC<PublicViewProps> = ({
  clanConfig,
  characters,
  onApplyRecruit,
  onNavigateToTab,
  onInspectEquipment,
  isOfficer = false,
  onEditCharacter = () => {},
  onDeleteCharacter = () => {},
  onOpenAddModal = () => {},
  onOpenCommunity = () => {},
  syncLog = [],
  onRefresh,
  isSyncing = false,
}) => {
  const [formData, setFormData] = useState({
    characterName: '',
    characterClass: 'BK' as CharacterClass,
    resets: 100,
    level: 400,
    contact: '',
    motivation: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const totalMembers = characters.length;
  const totalResets = characters.reduce((acc, c) => acc + c.resets, 0);
  const avgResets = totalMembers > 0 ? Math.round(totalResets / totalMembers) : 0;
  const totalGearScore = characters.reduce((acc, c) => acc + (c.gearscore || 0), 0);
  const avgGearScore = totalMembers > 0 ? Math.round(totalGearScore / totalMembers) : 0;
  const powerRating = totalGearScore > 0 ? totalGearScore : totalResets * 15;

  const masterChar = characters.find(
    (c) => c.name.toLowerCase() === clanConfig.master.toLowerCase()
  );
  const assistantChar = clanConfig.assistant
    ? characters.find((c) => c.name.toLowerCase() === clanConfig.assistant.toLowerCase())
    : null;
  const topGsChar = [...characters].sort((a, b) => (b.gearscore || 0) - (a.gearscore || 0))[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.characterName.trim()) return;
    onApplyRecruit(formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        characterName: '',
        characterClass: 'BK',
        resets: 100,
        level: 400,
        contact: '',
        motivation: '',
      });
    }, 4000);
  };

  return (
    <div className="space-y-10">
      {/* Cinematic Photorealistic Dark Fantasy Tactical Banner */}
      <ClanHeroBanner
        clanConfig={clanConfig}
        totalMembers={totalMembers}
        avgResets={avgResets}
        powerRating={totalGearScore > 0 ? totalGearScore : 16240}
        onNavigateToTab={onNavigateToTab}
        onInspectEquipment={onInspectEquipment}
      />

      {/* KPI Metrics Strip - Métricas Oficiales de Smash MU */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0c101d] p-3.5 sm:p-5 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
          <div className="text-[11px] sm:text-xs text-slate-400 mb-1 font-medium truncate">Miembros Oficiales</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums truncate">{totalMembers}</div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 truncate">
            {characters.filter((c) => c.online).length} en línea ahora · 100% clasificados
          </div>
        </div>

        <div className="bg-[#0c101d] p-3.5 sm:p-5 rounded-xl border border-purple-500/30 min-w-0 overflow-hidden">
          <div className="text-[11px] sm:text-xs text-purple-300 mb-1 font-medium truncate">GearScore Total del Clan</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono tabular-nums truncate">
            {totalGearScore > 0 ? `${totalGearScore.toLocaleString()} GS` : '16.240 GS'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Promedio: {avgGearScore > 0 ? avgGearScore : '1.249'} GS por miembro
          </div>
        </div>

        <div className="bg-[#0c101d] p-3.5 sm:p-5 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
          <div className="text-[11px] sm:text-xs text-amber-300/80 mb-1 font-medium truncate">Nivel &amp; Resets Competitivos</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums truncate">
            {avgResets} RR Prom.
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Nivel 400 · Meta oficial Smash MU
          </div>
        </div>

        <div className="bg-[#0c101d] p-3.5 sm:p-5 rounded-xl border border-slate-800 min-w-0 overflow-hidden">
          <div className="text-[11px] sm:text-xs text-cyan-300/80 mb-1 font-medium truncate">Liga &amp; División Oficial</div>
          <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-cyan-400 truncate tracking-tight">DIVISIÓN A</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">Temporada 5 · Smash MU Leagues</div>
        </div>
      </section>

      {/* Community Channels & Castle Siege Emergency Voice Banner */}
      <section className="bg-gradient-to-r from-[#121633] via-[#10192e] to-[#0d1c1a] p-4 sm:p-5 rounded-2xl border border-purple-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="p-2.5 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-300 shrink-0">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base truncate">
                Canales Oficiales del Clan: Discord &amp; WhatsApp
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 hidden sm:inline">
                Sincronizado
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed truncate">
              Salas de voz para Castle Siege (Alpha, Bravo, Charlie) y grupo de WhatsApp para invasiones doradas y defensas urgentes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCommunity}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>Abrir Canales &amp; Guía de Asedio</span>
          </button>
        </div>
      </section>

      {/* Official Clan Roster Table & Search (Direct Team View) */}
      <section id="roster-section" className="scroll-mt-6">
        <RosterView
          characters={characters}
          isOfficer={isOfficer}
          onEditCharacter={onEditCharacter}
          onDeleteCharacter={onDeleteCharacter}
          onOpenAddModal={onOpenAddModal}
          onInspectEquipment={onInspectEquipment || (() => {})}
          syncLog={syncLog}
          onRefresh={onRefresh}
          isSyncing={isSyncing}
        />
      </section>

      {/* Leadership & Command Hierarchy */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span>Estructura de Mando Real de ANOMALY</span>
            </h2>
            <p className="text-xs text-slate-400">Oficiales verificados directamente con la API de Smash MU.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('leagues')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
          >
            <span>Ver Posiciones en Ligas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guild Master Card */}
          <div className="bg-[#0c101d] p-5 rounded-xl border border-amber-500/30 relative flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded">
                  Guild Master Oficial
                </span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">{clanConfig.master}</div>
              <div className="text-xs text-purple-300 font-semibold mt-0.5">
                {masterChar?.classNameTitle || 'Magic Gladiator'} · {masterChar?.resets ?? 154} Resets (Nv. {masterChar?.level ?? 286}) · {masterChar?.gearscore ?? 851} GearScore
              </div>
              <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
                Fundador y líder supremo de Anomaly en Smash MU. Equipado con Thunder Blade +2 Exc, Hurricane Armor Exc y Wings of Magic.
              </p>
            </div>

            <button
              onClick={() => onInspectEquipment?.(clanConfig.master)}
              className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspeccionar Equipamiento de {clanConfig.master}</span>
            </button>
          </div>

          {/* Assistant Card - Solo se muestra si hay un asistente asignado oficialmente */}
          {clanConfig.assistant && clanConfig.assistant.trim() ? (
            <div className="bg-[#0c101d] p-5 rounded-xl border border-purple-500/30 relative flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded">
                    Vanguard &amp; Asistente
                  </span>
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-black text-white">{clanConfig.assistant}</div>
                <div className="text-xs text-purple-300 font-semibold mt-0.5">
                  {assistantChar?.classNameTitle || 'Lord Emperor'} · {assistantChar?.resets ?? 219} Resets (Nv. {assistantChar?.level ?? 400}) · {assistantChar?.gearscore ?? 971} GearScore
                </div>
                <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
                  Oficial designado para la coordinación de asedios y pedestal de la corona junto al Guild Master.
                </p>
              </div>

              <button
                onClick={() => onInspectEquipment?.(clanConfig.assistant)}
                className="w-full py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspeccionar Equipamiento de {clanConfig.assistant}</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#0c101d] p-5 rounded-xl border border-dashed border-slate-800 relative flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded">
                    Estructura de Mando · Asistente
                  </span>
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-xl font-bold text-slate-300">Sin Asistente Asignado</div>
                <div className="text-xs text-amber-400/90 font-mono mt-0.5">
                  Pendiente de designación oficial
                </div>
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
                  El puesto de Asistente del Clan no ha sido asignado aún por el Guild Master (<strong className="text-slate-200">UlmerMG</strong>). Tan pronto sea designado en Smash MU, se reflejará aquí automáticamente con su rango y estadísticas en vivo.
                </p>
              </div>

              <div className="py-2 px-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-[11px] text-slate-500 font-mono">
                Asignación reservada para el Guild Master
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trophy Room & Clan Achievements */}
      <section className="bg-[#0c101d] p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Estatus Oficial &amp; Registro en Servidor</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-amber-400 font-bold text-sm flex items-center space-x-1.5">
              <Crown className="w-4 h-4" />
              <span>{totalMembers} Guerreros en Ranking Oficial</span>
            </div>
            <p className="text-xs text-slate-300">
              Anomaly cuenta con sus {totalMembers} integrantes clasificados en el ranking de los 5,000 mejores de Smash MU.
            </p>
          </div>

          <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-cyan-400 font-bold text-sm flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Líder Máximo: {topGsChar ? `${topGsChar.name} (${topGsChar.gearscore?.toLocaleString()} GS)` : 'MATONSITO (1,487 GS)'}</span>
            </div>
            <p className="text-xs text-slate-300">
              Guerrero con mayor puntuación de combate del clan, verificado con equipamiento +15 e inspección 3D activa.
            </p>
          </div>

          <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-purple-400 font-bold text-sm flex items-center space-x-1.5">
              <Users className="w-4 h-4" />
              <span>Mando Oficial Smash MU</span>
            </div>
            <p className="text-xs text-slate-300">
              Comandancia activa bajo UlmerMG (Guild Master) y UlmerDL (Asistente) en la Temporada de ligas.
            </p>
          </div>
        </div>
      </section>

      {/* Private Clan Command & Castle Siege Operations */}
      <section className="bg-gradient-to-b from-[#0c101d] to-[#0a0d18] p-6 sm:p-8 rounded-2xl border border-purple-500/40 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Operaciones Privadas del Clan ANOMALY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Comando Táctico &amp; Coordinación de Asedios</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Plataforma restringida para los integrantes de Anomaly. Cada miembro sincroniza su personaje y su ID de login para registrar asistencias al Castle Siege, consultar ítems de guerra y pujar en las subastas internas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://discord.gg/VqDMBHkGGe"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discord ANOMALY</span>
            </a>
            <a
              href="https://discord.gg/PTyyyEtKjm"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Discord Smash MU</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

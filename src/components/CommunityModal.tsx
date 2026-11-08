import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Radio,
  Shield,
  Crown,
  Check,
  Copy,
  ExternalLink,
  Volume2,
  Users,
  Flame,
  Globe,
} from 'lucide-react';
import { GuildMark } from './GuildMark';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamDiscordUrl?: string;
  smashMuDiscordUrl?: string;
  whatsappUrl?: string;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  teamDiscordUrl = 'https://discord.gg/VqDMBHkGGe',
  smashMuDiscordUrl = 'https://discord.gg/PTyyyEtKjm',
  whatsappUrl,
}) => {
  const [copiedLink, setCopiedLink] = useState<'team' | 'smash' | 'whatsapp' | null>(null);

  if (!isOpen) return null;

  const handleCopy = (type: 'team' | 'smash' | 'whatsapp', url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e1e] border border-purple-500/40 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <GuildMark size={5} className="border-purple-400 shadow-md shadow-purple-950/60" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-wide">
                  Canales Oficiales del Clan &amp; Servidor
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFICADOS
                </span>
              </div>
              <p className="text-xs text-purple-300 font-mono mt-0.5">
                Enlaces directos oficiales y coordinación táctica de Castle Siege
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Primary Verified Official Discord Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Discord Oficial del Team ANOMALY */}
          <div className="bg-gradient-to-b from-[#181c3e] to-[#0c0f24] border border-purple-500/50 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-lg ring-1 ring-purple-500/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/25 border border-purple-500/50 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="font-extrabold text-white text-base">Discord ANOMALY</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Team Oficial
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Servidor privado del clan. Salas de voz tácticas obligatorias durante el <strong>Castle Siege (Domingos 20:00 UTC)</strong>, anuncios de subastas y baúl comunitario.
              </p>
              <div className="text-[11px] font-mono text-purple-300 bg-black/40 p-2 rounded border border-purple-500/20 truncate">
                {teamDiscordUrl}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <a
                href={teamDiscordUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/30 cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Entrar a Discord del Team</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy('team', teamDiscordUrl)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                title="Copiar enlace del Discord de Anomaly"
              >
                {copiedLink === 'team' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Discord Oficial de SMASH MU */}
          <div className="bg-gradient-to-b from-[#141838] to-[#0a0d1e] border border-[#5865F2]/50 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-lg ring-1 ring-[#5865F2]/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/50 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-[#5865F2]" />
                  </div>
                  <span className="font-extrabold text-white text-base">Discord Smash MU</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/30">
                  Servidor Oficial
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comunidad oficial de Smash MU. Anuncios de actualizaciones, soporte técnico del juego, ranking de ligas y mantenimiento del servidor.
              </p>
              <div className="text-[11px] font-mono text-cyan-300 bg-black/40 p-2 rounded border border-cyan-500/20 truncate">
                {smashMuDiscordUrl}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <a
                href={smashMuDiscordUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-[#5865F2]/30 cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Entrar a Discord Smash MU</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy('smash', smashMuDiscordUrl)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                title="Copiar enlace del Discord de Smash MU"
              >
                {copiedLink === 'smash' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Group (only if configured, or info banner) */}
        {whatsappUrl ? (
          <div className="bg-gradient-to-r from-[#0f281e] to-[#091510] border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-white block">Grupo de WhatsApp de Alertas de Asedio:</span>
                <span className="text-[11px] text-emerald-300 font-mono truncate block">{whatsappUrl}</span>
              </div>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shrink-0 flex items-center space-x-1"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="bg-[#080b15] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <Radio className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="text-slate-300">
                <span className="font-bold text-white">Alertas por WhatsApp: </span>
                <span>Los oficiales gestionan el ingreso de números de confianza a través del canal <code className="text-purple-300">#alertas-whatsapp</code> en el Discord del team.</span>
              </div>
            </div>
          </div>
        )}

        {/* Castle Siege Voice Guide & Tactical Rooms */}
        <div className="bg-[#080b15] rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs sm:text-sm">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Distribución de Salas de Voz para Castle Siege (Discord ANOMALY)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-[#0c101d] p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="text-amber-300 font-bold flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Sala 1: Corona &amp; Pedestal</span>
              </div>
              <p className="text-[11px] text-slate-400">
                UlmerDL, Dark Lords de sello y escolta defensiva con Soul Barrier. Prioridad absoluta de palabra.
              </p>
            </div>

            <div className="bg-[#0c101d] p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="text-cyan-300 font-bold flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Sala 2: Frontline Choque</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Blade Knights y Fist Masters para derribo de puertas, arietes y switches exteriores.
              </p>
            </div>

            <div className="bg-[#0c101d] p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="text-purple-300 font-bold flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Sala 3: Support &amp; Magos</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Elfas de buff permanente (Aura) y Magos en rotación de teleport y daño masivo.
              </p>
            </div>
          </div>
        </div>

        {/* Clan Brotherhood Rules */}
        <div className="bg-[#0c101d] rounded-xl border border-purple-500/20 p-4 space-y-2 text-xs">
          <div className="text-white font-bold flex items-center space-x-1.5">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Código de Hermandad de ANOMALY</span>
          </div>
          <ul className="text-slate-300 space-y-1.5 text-[11px] list-disc list-inside leading-relaxed">
            <li>
              <strong>Compromiso dominical:</strong> Confirmar asistencia con 24 horas de antelación en el portal del clan.
            </li>
            <li>
              <strong>Cuentas y Baúl compartido:</strong> Devolver las Elfas de Buff y Summoners una vez finalizada la actividad. No cambiar contraseñas.
            </li>
            <li>
              <strong>Respeto y lealtad:</strong> Lo que se discute en los canales de Anomaly queda en el clan. Apoyo mutuo en farmeo y subidas de resets.
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SharedAccount } from '../types/clan';
import {
  Package,
  Key,
  Shield,
  Sparkles,
  Users,
  Copy,
  Check,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Unlock,
  Radio,
} from 'lucide-react';

interface VaultAccountsViewProps {
  sharedAccounts: SharedAccount[];
  currentMemberName: string;
  isOfficer: boolean;
  isAnomalyMember?: boolean;
  onToggleStatus: (id: string) => void;
  onDeleteAccount: (id: string) => void;
  onOpenAddModal: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const VaultAccountsView: React.FC<VaultAccountsViewProps> = ({
  sharedAccounts,
  currentMemberName,
  isOfficer,
  isAnomalyMember = true,
  onToggleStatus,
  onDeleteAccount,
  onOpenAddModal,
  onNavigateToTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyHint = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = sharedAccounts.filter((acc) => {
    const matchSearch =
      acc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.inventorySummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === 'ALL' || acc.accountCategory === selectedCategory;
    return matchSearch && matchCat;
  });

  const getCategoryLabel = (cat: SharedAccount['accountCategory']) => {
    switch (cat) {
      case 'buffer_elf':
        return { label: 'Buffer Elf', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
      case 'dl_summon':
        return { label: 'DL Summoner', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
      case 'guild_vault':
        return { label: 'Baúl Comunitario', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
      case 'farm_mg':
        return { label: 'Farmeador MG', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' };
      default:
        return { label: 'Cuenta Clan', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  if (!isAnomalyMember) {
    return (
      <div className="space-y-6">
        <div className="bg-[#0c101d] rounded-2xl p-8 border border-slate-800 text-center max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-950/50">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Acceso Exclusivo para Miembros de ANOMALY
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Esta sección contiene las credenciales de acceso a las Elfas de Buff comunitarias, Dark Lords invocadores y cuentas mulas de suministros del Clan <strong className="text-pink-400">ANOMALY</strong>.
          </p>
          <div className="p-4 bg-[#080b15] rounded-xl border border-slate-800/80 text-xs text-slate-400 text-left space-y-1.5">
            <div className="text-slate-300 font-semibold">Tu cuenta actual:</div>
            <div className="font-mono text-cyan-300">• Personaje: {currentMemberName}</div>
            <div className="font-mono text-amber-300">• Estado: Jugador Independiente / Sin Clan</div>
          </div>
          <p className="text-xs text-slate-400">
            Si deseas solicitar ingreso al team para acceder a las cuentas compartidas y apoyo en eventos, contáctanos en Discord:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="https://discord.gg/VqDMBHkGGe"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Postular al Clan en Discord</span>
            </a>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('auction')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Ver Subasta del Baúl</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#0c101d] via-[#121630] to-[#0c101d] rounded-2xl p-5 sm:p-6 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-300">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white truncate">
                Cuentas Compartidas &amp; Baúl del Clan ANOMALY
              </h1>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Recursos de apoyo mutuo para miembros del team: Elfas de buff para leveleo acelerado, Dark Lords para invocación instantánea en eventos y mulas con reservas de pociones y joyas para el asedio.
            </p>
          </div>

          {isOfficer && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Cuenta</span>
            </button>
          )}
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-[#080b15] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Cuentas en Nómina:</span>
            <span className="text-white font-mono font-bold text-sm">{sharedAccounts.length}</span>
          </div>
          <div className="bg-[#080b15] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Disponibles (Libres):</span>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              {sharedAccounts.filter((a) => a.status === 'available').length}
            </span>
          </div>
          <div className="bg-[#080b15] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">En Uso Actual:</span>
            <span className="text-amber-400 font-mono font-bold text-sm">
              {sharedAccounts.filter((a) => a.status === 'in_use').length}
            </span>
          </div>
          <div className="bg-[#080b15] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Mi Usuario:</span>
            <span className="text-purple-300 font-mono font-bold text-sm truncate block">
              {currentMemberName}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0c101d] rounded-xl p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 sm:flex-initial min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, propósito o inventario..."
              className="bg-[#080b15] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-full sm:w-64"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#080b15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="buffer_elf">Elfas de Buff</option>
            <option value="dl_summon">DL Summoners</option>
            <option value="guild_vault">Baúl Comunitario</option>
            <option value="farm_mg">Farmeadores MG</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Mostrando {filtered.length} de {sharedAccounts.length}
        </div>
      </div>

      {/* Shared Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-[#0c101d] rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-white font-bold text-sm">
              {sharedAccounts.length === 0
                ? 'No hay cuentas compartidas registradas todavía'
                : 'No se encontraron cuentas con los filtros aplicados'}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {sharedAccounts.length === 0
                ? 'Los oficiales o el Guild Master pueden registrar cuentas de apoyo del clan (Elfas de Buff, Summoners DL o mulas de baúl) con el botón "Registrar Nueva Cuenta".'
                : 'Intenta cambiar el término de búsqueda o seleccionar otra categoría.'}
            </p>
            {isOfficer && sharedAccounts.length === 0 && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Primera Cuenta</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((acc) => {
            const catBadge = getCategoryLabel(acc.accountCategory);
            const isAvailable = acc.status === 'available';

            return (
              <div
                key={acc.id}
                className={`bg-[#0c101d] rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all shadow-md ${
                  isAvailable
                    ? 'border-slate-800/90 hover:border-purple-500/50'
                    : 'border-amber-500/40 bg-amber-950/10'
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        <h3 className="font-extrabold text-white text-base truncate">{acc.title}</h3>
                      </div>
                      <div className="text-xs font-mono text-purple-300 flex items-center space-x-2">
                        <span className="font-bold text-white">{acc.characterName}</span>
                        <span>·</span>
                        <span>{acc.characterClass}</span>
                        <span>·</span>
                        <span className="text-cyan-300">Nv. {acc.level}</span>
                        <span>·</span>
                        <span className="text-amber-400 font-bold">{acc.resets} RR</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${catBadge.color}`}
                    >
                      {catBadge.label}
                    </span>
                  </div>

                  {/* Status Strip */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#080b15] border border-slate-800/80">
                    <span className="text-slate-400">Estado actual:</span>
                    {isAvailable ? (
                      <span className="text-emerald-400 font-bold flex items-center space-x-1 font-mono">
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Libre (Disponible)</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center space-x-1 font-mono">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>En uso por: {acc.holder}</span>
                      </span>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-semibold block mb-0.5">Propósito &amp; Ubicación:</span>
                    {acc.purpose}
                  </div>

                  {/* Inventory Summary */}
                  {acc.inventorySummary && (
                    <div className="p-2.5 rounded-lg bg-[#070912] border border-slate-800/80 text-xs space-y-1">
                      <span className="text-slate-400 font-semibold text-[11px] block">
                        Inventario &amp; Suministros:
                      </span>
                      <div className="text-slate-200 font-mono text-[11px] leading-relaxed">
                        {acc.inventorySummary}
                      </div>
                    </div>
                  )}

                  {/* Access code hint */}
                  {acc.accessCodeHint && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-black/40 p-2 rounded border border-slate-800/60">
                      <span className="truncate">🔑 {acc.accessCodeHint}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHint(acc.id, acc.accessCodeHint)}
                        className="text-purple-400 hover:text-white transition-colors shrink-0 ml-2"
                        title="Copiar indicación"
                      >
                        {copiedId === acc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => onToggleStatus(acc.id)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer ${
                      isAvailable
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Tomar Cuenta ({currentMemberName})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Liberar Cuenta para el Clan</span>
                      </>
                    )}
                  </button>

                  {isOfficer && (
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

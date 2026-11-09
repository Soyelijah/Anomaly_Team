import React, { useState } from 'react';
import { Character, CharacterClass, SquadRole, AttendanceStatus, SharedAccount } from '../types/clan';
import { X, Lock, Shield, UserPlus, Package, User, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { GuildMark } from './GuildMark';


interface EditMemberModalProps {
  isOpen: boolean;
  character: Character | null;
  onClose: () => void;
  onSave: (updated: Character) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, character, onClose, onSave }) => {
  if (!isOpen || !character) return null;

  const [build, setBuild] = useState(character.build);
  const [squad, setSquad] = useState<SquadRole>(character.squad);
  const [note, setNote] = useState(character.note);
  const [attendance, setAttendance] = useState<AttendanceStatus>(character.attendance);
  const [resets, setResets] = useState(character.resets);
  const [level, setLevel] = useState(character.level);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...character,
      build,
      squad,
      note,
      attendance,
      resets,
      level,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0c101d] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Editar Datos de {character.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Resets</label>
              <input
                type="number"
                value={resets}
                onChange={(e) => setResets(parseInt(e.target.value) || 0)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nivel</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 400)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Build / Especialización</label>
            <input
              type="text"
              value={build}
              onChange={(e) => setBuild(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Escuadrón Siege</label>
              <select
                value={squad}
                onChange={(e) => setSquad(e.target.value as SquadRole)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="frontline">Frontline (Tanque)</option>
                <option value="support">Support &amp; Buff</option>
                <option value="seal">Sello &amp; Corona</option>
                <option value="disruptor">Disruptor / Debuff</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Estado de Asistencia</label>
              <select
                value={attendance}
                onChange={(e) => setAttendance(e.target.value as AttendanceStatus)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="confirmed">🟢 Confirmado</option>
                <option value="pending">🟡 Pendiente</option>
                <option value="absent">🔴 Ausente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nota Táctica / Asignación</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (char: Character) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('BK');
  const [level, setLevel] = useState(400);
  const [resets, setResets] = useState(100);
  const [build, setBuild] = useState('Fuerza / Combo');
  const [squad, setSquad] = useState<SquadRole>('frontline');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: `char-${Date.now()}`,
      name: name.trim(),
      characterClass,
      level,
      resets,
      online: true,
      build,
      squad,
      note,
      attendance: 'confirmed',
      category: 'main',
      assignedPlayer: 'Miembro',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0c101d] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Registrar Nuevo Personaje al Clan</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Nombre del Personaje</label>
            <input
              type="text"
              required
              placeholder="Ej: Anomaly_Warrior"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Clase</label>
              <select
                value={characterClass}
                onChange={(e) => setCharacterClass(e.target.value as CharacterClass)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="BK">Blade Knight (BK)</option>
                <option value="SM">Soul Master (SM)</option>
                <option value="ELF">Muse Elf (ELF)</option>
                <option value="DL">Dark Lord (DL)</option>
                <option value="MG">Magic Gladiator (MG)</option>
                <option value="SUM">Summoner (SUM)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Resets</label>
              <input
                type="number"
                value={resets}
                onChange={(e) => setResets(parseInt(e.target.value) || 0)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Build Inicial</label>
              <input
                type="text"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Escuadrón Siege</label>
              <select
                value={squad}
                onChange={(e) => setSquad(e.target.value as SquadRole)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="frontline">Frontline (Tanque)</option>
                <option value="support">Support &amp; Buff</option>
                <option value="seal">Sello &amp; Corona</option>
                <option value="disruptor">Disruptor / Debuff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Nota Interna</label>
            <input
              type="text"
              placeholder="Ej: Nuevo ingreso, asignado a Party 2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              Registrar Personaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddVaultAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (acc: SharedAccount) => void;
}

export const AddVaultAccountModal: React.FC<AddVaultAccountModalProps> = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('ELF');
  const [accountCategory, setAccountCategory] = useState<SharedAccount['accountCategory']>('buffer_elf');
  const [resets, setResets] = useState(120);
  const [purpose, setPurpose] = useState('');
  const [inventorySummary, setInventorySummary] = useState('');
  const [accessCodeHint, setAccessCodeHint] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !characterName.trim()) return;

    onAdd({
      id: `acc-${Date.now()}`,
      title,
      characterName,
      characterClass,
      accountCategory,
      level: 400,
      resets,
      purpose,
      holder: 'Libre',
      status: 'available',
      inventorySummary,
      accessCodeHint,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0c101d] border border-purple-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Registrar Cuenta o Baúl Compartido</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Título Descriptivo</label>
            <input
              type="text"
              required
              placeholder="Ej: Buffer Elf #2 (Noria)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Nick del Personaje</label>
              <input
                type="text"
                required
                placeholder="Ej: Aura_Free"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Tipo de Cuenta</label>
              <select
                value={accountCategory}
                onChange={(e) => setAccountCategory(e.target.value as SharedAccount['accountCategory'])}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="buffer_elf">Buffer Elf</option>
                <option value="dl_summon">DL Summoner</option>
                <option value="guild_vault">Baúl Comunitario</option>
                <option value="farm_mg">Farmeador MG</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Clase</label>
              <select
                value={characterClass}
                onChange={(e) => setCharacterClass(e.target.value as CharacterClass)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="ELF">ELF</option>
                <option value="DL">DL</option>
                <option value="BK">BK</option>
                <option value="SM">SM</option>
                <option value="MG">MG</option>
                <option value="SUM">SUM</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Resets</label>
              <input
                type="number"
                value={resets}
                onChange={(e) => setResets(parseInt(e.target.value) || 0)}
                className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Propósito &amp; Instrucciones</label>
            <input
              type="text"
              placeholder="Ej: Para miembros que necesiten buff de ataque en Devias 3"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Inventario / Suministros</label>
            <input
              type="text"
              placeholder="Ej: Set Wind +11, 200 Pociones de Maná"
              value={inventorySummary}
              onChange={(e) => setInventorySummary(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Indicación de Acceso / Pista Clave</label>
            <input
              type="text"
              placeholder="Ej: Pedir clave en Discord canal #cuentas"
              value={accessCodeHint}
              onChange={(e) => setAccessCodeHint(e.target.value)}
              className="w-full bg-[#080b15] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Registrar Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

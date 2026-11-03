import React, { useState, useEffect, Suspense, useRef } from 'react';
import { SmashMUCharacterProfile, SmashMUEquipmentItem } from '../types/clan';
import {
  Sparkles,
  Shield,
  Sword,
  RotateCw,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Flame,
  Crown,
  Eye,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export interface Character3DViewerProps {
  profile: SmashMUCharacterProfile;
  selectedSlotIndex?: number | null;
  height?: string;
  onOpenEquipment?: () => void;
}

/**
 * Check WebGL context support safely without throwing unhandled exceptions.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}

/**
 * Fallback 2D view for environments where WebGL is unavailable or fails.
 */
export const Character2DFallbackView: React.FC<{
  profile: SmashMUCharacterProfile;
  selectedSlotIndex?: number | null;
  reason?: string;
  onRetry?: () => void;
}> = ({ profile, selectedSlotIndex, reason, onRetry }) => {
  const character = profile.character;
  const activeItems = (profile.equipment || []).filter((e) => !e.isEmpty);
  const selectedItem =
    selectedSlotIndex !== undefined && selectedSlotIndex !== null
      ? profile.equipment?.find((e) => e.slotIndex === selectedSlotIndex)
      : activeItems[0];

  return (
    <div className="relative w-full h-[460px] rounded-xl overflow-hidden bg-gradient-to-b from-[#090e18] via-[#05070e] to-[#04050a] border border-slate-800/80 flex flex-col items-center justify-between p-5 text-center shadow-inner">
      {/* Background Stage Image */}
      <div
        className="absolute inset-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/assets/causarex-armory-stage.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070e] via-transparent to-[#05070e]/70 pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-purple-500/30">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-100">{character?.name}</span>
          <span className="text-[10px] text-purple-400 font-mono">
            Nivel {character?.level || 400}
          </span>
        </div>
        <div className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          {character?.gearScore || 0} GS
        </div>
      </div>

      {/* Center Equipment Showcase */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-3">
        <div className="relative w-36 h-36 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-950 border border-purple-500/40 flex items-center justify-center shadow-2xl group">
          {selectedItem?.imagePath ? (
            <img
              src={
                selectedItem.imagePath.startsWith('http')
                  ? selectedItem.imagePath
                  : `https://www.smashmu.com${selectedItem.imagePath}`
              }
              alt={selectedItem.name}
              className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Shield className="w-16 h-16 text-purple-400/50" />
          )}

          {selectedItem && (
            <div className="absolute -bottom-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#090b14] font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg">
              +{selectedItem.level || 0}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-bold text-white tracking-wide">
            {selectedItem?.name || character?.className || 'Personaje MU'}
          </div>
          <div className="text-xs text-purple-300/80 font-medium">
            {character?.className} · {character?.guild?.name || 'ANOMALY'}
          </div>
        </div>

        {reason && (
          <div className="text-[11px] text-slate-400 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded-lg max-w-xs flex items-center space-x-1.5 text-left">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{reason}</span>
          </div>
        )}
      </div>

      {/* Quick Action / Retry */}
      <div className="relative z-10 w-full flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
        <span className="text-[11px] text-slate-500">
          {activeItems.length} objetos equipados
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-1.5 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-md border border-purple-500/30 transition-colors"
          >
            <RotateCw className="w-3 h-3" />
            <span>Reintentar 3D</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Authentic 3D Character Model component loaded from Causarex MU Engine.
 */
interface RealMUViewerProps {
  profile: SmashMUCharacterProfile;
  selectedSlotIndex?: number | null;
}

const RealMUCharacterViewer: React.FC<RealMUViewerProps> = ({ profile }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ViewerComponent, setViewerComponent] = useState<React.ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadViewer = async () => {
      try {
        // Ensure React is globally available for the bundle shim
        if (typeof window !== 'undefined' && !(window as any).React) {
          (window as any).React = React;
        }

        // Dynamically import the authentic MU Online 3D viewer bundle
        const loadModule = new Function('url', 'return import(url)');
        const mod = await loadModule('/assets/CharacterViewer.js?v=s6_play');
        if (isCancelled) return;

        if (mod && mod.default) {
          setViewerComponent(() => mod.default);
        } else {
          throw new Error('No se pudo inicializar el módulo del visor 3D.');
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[Character3DViewer] Error loading 3D viewer bundle:', err);
          setLoadError(err.message || 'Error cargando motor 3D');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadViewer();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <Character2DFallbackView
        profile={profile}
        reason={loadError}
        onRetry={() => {
          setLoadError(null);
          setIsLoading(true);
        }}
      />
    );
  }

  const char = profile.character;
  const rawClass = char?.class ?? 2;
  const equipment = profile.equipment || [];

  return (
    <div
      ref={containerRef}
      className="viewer-stage relative w-full h-[470px] min-h-[440px] rounded-xl overflow-hidden border border-slate-800/80 bg-[#08080e] shadow-2xl"
    >
      {/* Gothic Temple Cathedral Stage Backdrop */}
      <div className="stage-backdrop pointer-events-none" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070a13]/80 backdrop-blur-sm space-y-3">
          <div className="rex-viewer__spinner" />
          <div className="text-xs font-semibold text-purple-300 tracking-wider uppercase">
            Cargando modelo 3D y texturas MU…
          </div>
          <div className="text-[11px] text-slate-400 font-mono">{char?.name}</div>
        </div>
      )}

      {/* Authentic MU Character 3D Viewer */}
      {ViewerComponent && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070a13]/60 backdrop-blur-sm">
              <div className="rex-viewer__spinner" />
              <span className="text-xs text-slate-300 mt-3">Construyendo personaje MU…</span>
            </div>
          }
        >
          <ViewerComponent
            classCode={rawClass}
            equipment={equipment}
            name={char?.name || 'Personaje'}
            guildName={char?.guild?.name || 'ANOMALY'}
            guildMark={char?.guild?.mark || null}
            className={char?.className || 'Grand Master'}
            level={char?.level || 400}
            gearScore={char?.gearScore || 0}
            globalGsRank={1}
          />
        </Suspense>
      )}
    </div>
  );
};

/**
 * Main Character3DViewer component with error boundary and WebGL check.
 */
export const Character3DViewer: React.FC<Character3DViewerProps> = (props) => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [hasCrash, setHasCrash] = useState<boolean>(false);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  if (!hasWebGL || hasCrash) {
    return (
      <Character2DFallbackView
        profile={props.profile}
        selectedSlotIndex={props.selectedSlotIndex}
        reason={!hasWebGL ? 'WebGL deshabilitado o no compatible' : 'Fallo de contexto WebGL'}
        onRetry={() => {
          setHasCrash(false);
          setHasWebGL(isWebGLAvailable());
        }}
      />
    );
  }

  return (
    <div className="relative w-full">
      <RealMUCharacterViewer
        profile={props.profile}
        selectedSlotIndex={props.selectedSlotIndex}
      />
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScenarioConfig, ScenarioId } from '../types';
import { Terminal, BookOpen, RotateCcw, FileText, Award } from 'lucide-react';

interface HeaderProps {
  scenarios: ScenarioConfig[];
  activeScenarioId: ScenarioId;
  onSelectScenario: (id: ScenarioId) => void;
  onOpenCheatsheet: () => void;
  onOpenScratchpad: () => void;
  onOpenAuditReport: () => void;
  onResetLab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onOpenCheatsheet,
  onOpenScratchpad,
  onOpenAuditReport,
  onResetLab,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0a0f1d] border-b border-slate-800/90 text-slate-100 select-none">
      {/* Zone 1: Brand Zone with User Logo and Link */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <a
          href="https://www.unfantasmaenelsistema.com/"
          target="_blank"
          rel="noopener noreferrer"
          title="Visitar Un Fantasma en el Sistema"
          className="group flex items-center gap-2.5 transition-all"
        >
          <div className="relative w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 group-hover:border-sky-500 transition-colors flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src="./icono.png"
              alt="Un Fantasma en el Sistema Logo"
              className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback to remote web logo if local asset path is interrupted
                (e.currentTarget as HTMLImageElement).src =
                  'https://www.unfantasmaenelsistema.com/wp-content/uploads/2026/09/icono.png';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300 transition-colors flex items-center gap-1">
              Un Fantasma en el Sistema
              <span className="text-[10px] text-slate-500 group-hover:text-sky-400">↗</span>
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-100">
              eJPTv2 Pivoting Lab
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Clean single-line scenario selector tabs */}
      <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
        {scenarios.map((sc, idx) => {
          const isActive = sc.id === activeScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Escenario {idx + 1}: {sc.id === 'windows-portproxy-zorin' ? 'Portproxy' : sc.id === 'linux-autoroute-portfwd' ? 'Route + Portfwd' : 'EternalBlue + ARP'}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenScratchpad}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          title="Abrir bloc de notas del auditor y registro de flags"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden md:inline">Notas / Loot</span>
        </button>

        <button
          onClick={onOpenAuditReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-emerald-300 hover:text-emerald-200 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          title="Ver o generar informe de auditoría eJPTv2"
        >
          <Award className="w-4 h-4" />
          <span className="hidden md:inline">Informe eJPTv2</span>
        </button>

        <button
          onClick={onOpenCheatsheet}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-sky-300 hover:text-sky-200 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Cheat Sheet</span>
        </button>

        <button
          onClick={onResetLab}
          title="Reiniciar todo el progreso del laboratorio"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors border border-transparent hover:border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

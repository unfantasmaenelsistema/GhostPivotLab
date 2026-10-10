/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Share2,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
} from 'lucide-react';

export interface PivotingEvent {
  id: string;
  type: 'session' | 'route' | 'portforward' | 'discovery' | 'compromise' | 'milestone';
  title: string;
  detail: string;
  timestamp: string;
  badge: string;
}

interface EventLogProps {
  events: PivotingEvent[];
  onClearEvents: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onClearEvents }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents =
    filterType === 'all' ? events : events.filter((e) => e.type === filterType);

  const getEventBadge = (type: PivotingEvent['type']) => {
    switch (type) {
      case 'session':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
          badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          label: 'SESIÓN',
        };
      case 'route':
        return {
          icon: <Share2 className="w-3.5 h-3.5 text-sky-400" />,
          badgeStyle: 'bg-sky-950/80 text-sky-300 border-sky-800',
          label: 'RUTA',
        };
      case 'portforward':
        return {
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />,
          badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-800',
          label: 'PORT FORWARD',
        };
      case 'discovery':
        return {
          icon: <Search className="w-3.5 h-3.5 text-purple-400" />,
          badgeStyle: 'bg-purple-950/80 text-purple-300 border-purple-800',
          label: 'DISCOVERY',
        };
      case 'compromise':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          badgeStyle: 'bg-emerald-950/90 text-emerald-200 border-emerald-700',
          label: 'PWNED',
        };
      case 'milestone':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          badgeStyle: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
          label: 'OBJETIVO',
        };
    }
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 font-sans transition-all">
      {/* Header Bar */}
      <div className="bg-[#0d1629] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-sky-500/10 border border-sky-500/30 rounded text-sky-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Event Log (Registro de Acciones en Tiempo Real)
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-sky-400 rounded-full">
              {events.length}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todos ({events.length})</option>
              <option value="session" className="bg-slate-900">Sesiones</option>
              <option value="route" className="bg-slate-900">Rutas</option>
              <option value="portforward" className="bg-slate-900">Port Forwards</option>
              <option value="discovery" className="bg-slate-900">Descubrimiento</option>
              <option value="compromise" className="bg-slate-900">Accesos Pwned</option>
            </select>
          </div>

          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              title="Limpiar registro de eventos"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimizar Event Log' : 'Expandir Event Log'}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Events Stream Body */}
      {isExpanded && (
        <div className="p-3 max-h-[180px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              Esperando acciones en el laboratorio (establece una sesión, añade una ruta o redirige un puerto para ver el registro en vivo)...
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const meta = getEventBadge(ev.type);
              const isLatest = idx === 0;

              return (
                <div
                  key={ev.id}
                  className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border text-xs transition-all ${
                    isLatest
                      ? 'bg-slate-900/90 border-sky-500/40 shadow-sm ring-1 ring-sky-500/20'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{meta.icon}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{ev.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${meta.badgeStyle}`}
                        >
                          {meta.label}
                        </span>
                        {isLatest && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono leading-tight">
                        {ev.detail}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {ev.timestamp}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

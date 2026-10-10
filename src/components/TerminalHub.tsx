/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  TerminalTab,
  ScenarioConfig,
  ScenarioStep,
  PivotingSession,
  NetworkRoute,
  PortForwardRule,
} from '../types';
import { parseAndExecuteCommand, getCompletions, getPromptPrefix } from '../utils/terminalParser';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Trash2,
  Copy,
  Check,
  Columns,
  Sparkles,
} from 'lucide-react';

interface TerminalHubProps {
  scenario: ScenarioConfig;
  currentStep: ScenarioStep | undefined;
  sessions: PivotingSession[];
  routes: NetworkRoute[];
  portForwards: PortForwardRule[];
  discoveredHosts: string[];
  onStepCompleted: (stepId: string) => void;
  onNewSession: (session: PivotingSession) => void;
  onNewRoute: (route: NetworkRoute) => void;
  onNewPortForward: (rule: PortForwardRule) => void;
  onHostDiscovered: (host: { ip: string; mac?: string }) => void;
  onTargetCompromised: (machineId: string) => void;
}

const PERSISTED_HISTORY_KEY = 'ejpt_terminal_persistent_history';

function getPersistedHistory(): string[] {
  try {
    const raw = localStorage.getItem(PERSISTED_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePersistedHistory(newHistory: string[]) {
  try {
    const sliced = newHistory.slice(-200);
    localStorage.setItem(PERSISTED_HISTORY_KEY, JSON.stringify(sliced));
  } catch {}
}

export const TerminalHub: React.FC<TerminalHubProps> = ({
  scenario,
  currentStep,
  sessions,
  routes,
  portForwards,
  discoveredHosts,
  onStepCompleted,
  onNewSession,
  onNewRoute,
  onNewPortForward,
  onHostDiscovered,
  onTargetCompromised,
}) => {
  const initialHistory = getPersistedHistory();

  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      title: 'Kali Bash 1',
      context: 'bash',
      cwd: '~',
      moduleOptions: {},
      lines: [
        {
          id: 'init-1',
          type: 'info',
          text: `[+] Kali Linux 2026.1 (x86_64) - Entorno de Laboratorio eJPTv2 iniciado.\n[*] Red Puente: 192.168.1.100/24. Subred aislada: ${scenario.isolatedSubnet}.\n[*] Desarrollado por Un Fantasma en el Sistema (https://www.unfantasmaenelsistema.com/)\n[*] Escribe 'help', 'history' o consulta los objetivos del panel lateral para comenzar.`,
          timestamp: Date.now(),
        },
      ],
      history: initialHistory,
      historyIndex: initialHistory.length,
    },
    {
      id: 'tab-2',
      title: 'msfconsole listener',
      context: 'msf-root',
      cwd: '~',
      moduleOptions: {},
      lines: [
        {
          id: 'init-2',
          type: 'banner',
          text: `[*] msfconsole (Pestaña 2) listo para configurar listeners y módulos.`,
          timestamp: Date.now(),
        },
      ],
      history: initialHistory,
      historyIndex: initialHistory.length,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [splitTabId, setSplitTabId] = useState<string>('tab-2');
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);

  // Input states for Tab 1
  const [inputVal1, setInputVal1] = useState<string>('');
  const [completions1, setCompletions1] = useState<string[]>([]);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const endRef1 = useRef<HTMLDivElement>(null);

  // Input states for Tab 2 (Split Panel)
  const [inputVal2, setInputVal2] = useState<string>('');
  const [completions2, setCompletions2] = useState<string[]>([]);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const endRef2 = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState<boolean>(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const splitTab = tabs.find((t) => t.id === splitTabId) || tabs[1] || tabs[0];

  useEffect(() => {
    endRef1.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab.lines]);

  useEffect(() => {
    endRef2.current?.scrollIntoView({ behavior: 'smooth' });
  }, [splitTab.lines]);

  const handleCreateTab = () => {
    const currentHist = getPersistedHistory();
    const newId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      title: `Terminal ${tabs.length + 1}`,
      context: 'bash',
      cwd: '~',
      moduleOptions: {},
      lines: [
        {
          id: `line-${Date.now()}`,
          type: 'info',
          text: `[*] Nueva pestaña abierta en Kali Linux (~).`,
        },
      ],
      history: currentHist,
      historyIndex: currentHist.length,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (tabIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remaining);
    if (activeTabId === tabIdToClose) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
    if (splitTabId === tabIdToClose) {
      setSplitTabId(remaining[0].id);
    }
  };

  const handleClearTerminal = (targetTabId: string) => {
    setTabs(tabs.map((t) => (t.id === targetTabId ? { ...t, lines: [] } : t)));
  };

  const handleCopyHistory = (targetTab: TerminalTab) => {
    const textToCopy = targetTab.lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCommand = (cmd: string, targetTab: TerminalTab, isPanel2 = false) => {
    const trimmed = cmd.trim();
    if (trimmed) {
      const currentPersisted = getPersistedHistory();
      const updatedPersisted =
        currentPersisted[currentPersisted.length - 1] === trimmed
          ? currentPersisted
          : [...currentPersisted, trimmed];
      savePersistedHistory(updatedPersisted);
    }

    const result = parseAndExecuteCommand(
      cmd,
      targetTab,
      scenario,
      currentStep,
      sessions,
      routes,
      portForwards,
      discoveredHosts
    );

    const freshHistory = getPersistedHistory();
    const syncedTab = {
      ...result.updatedTab,
      history: freshHistory,
      historyIndex: freshHistory.length,
    };

    setTabs(tabs.map((t) => (t.id === targetTab.id ? syncedTab : { ...t, history: freshHistory })));

    if (isPanel2) {
      setInputVal2('');
      setCompletions2([]);
    } else {
      setInputVal1('');
      setCompletions1([]);
    }

    if (result.stepCompletedId) onStepCompleted(result.stepCompletedId);
    if (result.newSession) onNewSession(result.newSession);
    if (result.newRoute) onNewRoute(result.newRoute);
    if (result.newPortForward) onNewPortForward(result.newPortForward);
    if (result.discoveredHost) onHostDiscovered(result.discoveredHost);
    if (result.compromisedMachineId) onTargetCompromised(result.compromisedMachineId);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    targetTab: TerminalTab,
    inputVal: string,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    setCompletions: React.Dispatch<React.SetStateAction<string[]>>,
    isPanel2 = false
  ) => {
    // TAB Completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const suggestions = getCompletions(inputVal, targetTab);
      if (suggestions.length === 1) {
        setInputVal(suggestions[0]);
        setCompletions([]);
      } else if (suggestions.length > 1) {
        setCompletions(suggestions);
      }
      return;
    }

    // Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setTabs(
        tabs.map((t) =>
          t.id === targetTab.id
            ? {
                ...t,
                lines: [
                  ...t.lines,
                  {
                    id: `int-${Date.now()}`,
                    type: 'prompt',
                    text: `${getPromptPrefix(t)}${inputVal}^C`,
                  },
                ],
              }
            : t
        )
      );
      setInputVal('');
      setCompletions([]);
      return;
    }

    // Ctrl+L
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      handleClearTerminal(targetTab.id);
      return;
    }

    // Arrow Up (History backwards)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const hist = targetTab.history.length > 0 ? targetTab.history : getPersistedHistory();
      if (hist.length === 0) return;
      const newIndex = Math.max(0, targetTab.historyIndex - 1);
      setTabs(tabs.map((t) => (t.id === targetTab.id ? { ...t, history: hist, historyIndex: newIndex } : t)));
      setInputVal(hist[newIndex] || '');
      return;
    }

    // Arrow Down (History forwards)
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const hist = targetTab.history.length > 0 ? targetTab.history : getPersistedHistory();
      if (targetTab.historyIndex < hist.length - 1) {
        const newIndex = targetTab.historyIndex + 1;
        setTabs(tabs.map((t) => (t.id === targetTab.id ? { ...t, history: hist, historyIndex: newIndex } : t)));
        setInputVal(hist[newIndex] || '');
      } else {
        setTabs(tabs.map((t) => (t.id === targetTab.id ? { ...t, history: hist, historyIndex: hist.length } : t)));
        setInputVal('');
      }
      return;
    }

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(inputVal, targetTab, isPanel2);
    }
  };

  const renderTerminalWindow = (
    tab: TerminalTab,
    inputVal: string,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    completions: string[],
    setCompletions: React.Dispatch<React.SetStateAction<string[]>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    endRef: React.RefObject<HTMLDivElement | null>,
    isPanel2 = false
  ) => {
    return (
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 flex flex-col min-h-0 bg-[#080c14] overflow-hidden"
      >
        {/* Output lines */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {tab.lines.map((line) => {
            let colorStyle = 'text-slate-300';
            if (line.type === 'prompt') colorStyle = 'text-sky-300 font-semibold';
            if (line.type === 'success') colorStyle = 'text-emerald-400 font-medium';
            if (line.type === 'error') colorStyle = 'text-rose-400 font-medium';
            if (line.type === 'warning') colorStyle = 'text-amber-400';
            if (line.type === 'info') colorStyle = 'text-sky-400/90';
            if (line.type === 'banner') colorStyle = 'text-sky-500 font-mono';

            return (
              <div key={line.id} className={`leading-relaxed whitespace-pre-wrap ${colorStyle}`}>
                {line.text}
              </div>
            );
          })}

          {/* Autocompletion suggestions */}
          {completions.length > 1 && (
            <div className="bg-slate-900 border border-slate-700/80 rounded p-2 text-[11px] text-slate-300 space-y-1 my-2">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Sugerencias (pulsa Tab para autocompletar):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {completions.map((c, i) => (
                  <span
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInputVal(c);
                      setCompletions([]);
                      inputRef.current?.focus();
                    }}
                    className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sky-300 hover:border-sky-500 cursor-pointer text-[10px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div className="bg-[#0b101c] border-t border-slate-800/80 px-3 py-2 flex items-center gap-2">
          <span className="text-emerald-400 font-semibold select-none whitespace-pre text-[11px]">
            {tab.context === 'bash'
              ? 'kali@kali:~$ '
              : tab.context === 'msf-root'
              ? 'msf6 > '
              : tab.context === 'msf-module'
              ? 'msf6(mod) > '
              : 'meterpreter > '}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (completions.length > 0) setCompletions([]);
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, tab, inputVal, setInputVal, setCompletions, isPanel2)
            }
            spellCheck={false}
            autoComplete="off"
            placeholder="Escribe comando (Tab para autocompletar)..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs caret-sky-400"
          />
          <button
            onClick={() => executeCommand(inputVal, tab, isPanel2)}
            className="px-2 py-0.5 bg-sky-950 text-sky-400 hover:bg-sky-900 border border-sky-800 rounded text-[10px] font-sans transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#080c14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[560px] font-mono text-xs">
      {/* Terminal Title Bar & Multi-Tabs */}
      <div className="bg-[#0d1424] border-b border-slate-800 px-3 py-2 flex items-center justify-between select-none">
        {/* Tab List */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65%] scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTabId(tab.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#080c14] text-sky-300 border-sky-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TerminalIcon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className="truncate max-w-[110px]">{tab.title}</span>
                <span className="text-[9px] text-slate-500 uppercase px-1 py-0.2 bg-slate-950 rounded">
                  {tab.context === 'msf-module' ? 'msf:mod' : tab.context}
                </span>

                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="p-0.5 hover:bg-slate-750 text-slate-500 hover:text-slate-200 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCreateTab();
            }}
            title="Abrir nueva pestaña"
            className="p-1.5 bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-sky-300 rounded border border-slate-750 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toolbar: Split Toggle, Copy, Clear */}
        <div className="flex items-center gap-2 text-slate-400">
          {/* Split Screen Mode Toggle */}
          <button
            onClick={() => setIsSplitMode(!isSplitMode)}
            title="Activar/Desactivar pantalla dividida (Terminator / Tmux)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans font-medium transition-colors border ${
              isSplitMode
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-850 hover:bg-slate-750 text-slate-300 border-slate-750'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSplitMode ? 'Split Activo' : 'Dividir'}</span>
          </button>

          <button
            onClick={() => handleCopyHistory(activeTab)}
            title="Copiar texto de la terminal"
            className="flex items-center gap-1 px-2 py-1 bg-slate-850 hover:bg-slate-750 hover:text-slate-200 rounded text-[11px] transition-colors border border-slate-750 font-sans"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={() => handleClearTerminal(activeTabId)}
            title="Limpiar pantalla (Ctrl+L)"
            className="flex items-center gap-1 px-2 py-1 bg-slate-850 hover:bg-slate-750 hover:text-slate-200 rounded text-[11px] transition-colors border border-slate-750 font-sans"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Viewport (Single or Split) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Panel 1 */}
        <div className="flex-1 flex flex-col min-h-0">
          {isSplitMode && (
            <div className="bg-[#0b101c] px-3 py-1 border-b border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
              <span className="text-sky-300 font-semibold flex items-center gap-1">
                Panel 1: {activeTab.title}
              </span>
              <span className="font-mono text-slate-500">[{activeTab.context}]</span>
            </div>
          )}
          {renderTerminalWindow(
            activeTab,
            inputVal1,
            setInputVal1,
            completions1,
            setCompletions1,
            inputRef1,
            endRef1,
            false
          )}
        </div>

        {/* Panel 2 (when split mode active) */}
        {isSplitMode && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-[#0b101c] px-3 py-1 border-b border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-semibold">Panel 2:</span>
                <select
                  value={splitTabId}
                  onChange={(e) => setSplitTabId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                >
                  {tabs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.context})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleClearTerminal(splitTab.id)}
                className="text-slate-500 hover:text-slate-300"
                title="Limpiar Panel 2"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {renderTerminalWindow(
              splitTab,
              inputVal2,
              setInputVal2,
              completions2,
              setCompletions2,
              inputRef2,
              endRef2,
              true
            )}
          </div>
        )}
      </div>
    </div>
  );
};

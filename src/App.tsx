/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SCENARIOS } from './data/scenarios';
import {
  ScenarioConfig,
  ScenarioId,
  LearningMode,
  PivotingSession,
  NetworkRoute,
  PortForwardRule,
  MachineInfo,
} from './types';
import { Header } from './components/Header';
import { NetworkTopology } from './components/NetworkTopology';
import { TerminalHub } from './components/TerminalHub';
import { ScenarioGuide } from './components/ScenarioGuide';
import { CheatsheetModal } from './components/CheatsheetModal';
import { Scratchpad } from './components/Scratchpad';
import { AuditReportModal } from './components/AuditReportModal';
import { EventLog, PivotingEvent } from './components/EventLog';
import { Shield, Sparkles, AlertTriangle, Layers } from 'lucide-react';

export default function App() {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>(() => {
    const saved = localStorage.getItem('ejpt_active_scenario');
    return (saved as ScenarioId) || 'windows-portproxy-zorin';
  });

  const [learningMode, setLearningMode] = useState<LearningMode>(() => {
    const saved = localStorage.getItem('ejpt_learning_mode');
    return (saved as LearningMode) || 'guided';
  });

  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('ejpt_completed_steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [sessions, setSessions] = useState<PivotingSession[]>([]);
  const [routes, setRoutes] = useState<NetworkRoute[]>([]);
  const [portForwards, setPortForwards] = useState<PortForwardRule[]>([]);
  const [discoveredHosts, setDiscoveredHosts] = useState<string[]>([]);
  const [compromisedMachineIds, setCompromisedMachineIds] = useState<string[]>([]);

  // Real-time Event Log for actions like session opened, route added, port forwarded, etc.
  const [events, setEvents] = useState<PivotingEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`ejpt_events_${activeScenarioId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const sc = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
    return [
      {
        id: `ev-init-${Date.now()}`,
        type: 'milestone',
        title: 'Entorno de Laboratorio Inicializado',
        detail: `Topología cargada para ${sc.title}. Kali Linux (192.168.1.100). Subred interna: ${sc.isolatedSubnet}.`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'READY',
      },
    ];
  });

  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState<boolean>(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState<boolean>(false);
  const [examSeconds, setExamSeconds] = useState<number>(0);

  // Sync events to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`ejpt_events_${activeScenarioId}`, JSON.stringify(events.slice(0, 50)));
    } catch {}
  }, [events, activeScenarioId]);

  // Exam timer
  useEffect(() => {
    let interval: any = null;
    if (learningMode === 'exam') {
      interval = setInterval(() => {
        setExamSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setExamSeconds(0);
    }
    return () => clearInterval(interval);
  }, [learningMode]);

  // Current active scenario config
  const activeScenario: ScenarioConfig =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const completedStepIds = completedStepsMap[activeScenarioId] || [];

  // Find next uncompleted step
  const currentStepIndex = activeScenario.steps.findIndex(
    (s) => !completedStepIds.includes(s.id)
  );
  const effectiveStepIndex =
    currentStepIndex === -1 ? activeScenario.steps.length - 1 : currentStepIndex;
  const currentStep =
    currentStepIndex === -1 ? undefined : activeScenario.steps[currentStepIndex];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ejpt_active_scenario', activeScenarioId);
  }, [activeScenarioId]);

  useEffect(() => {
    localStorage.setItem('ejpt_learning_mode', learningMode);
  }, [learningMode]);

  useEffect(() => {
    localStorage.setItem('ejpt_completed_steps', JSON.stringify(completedStepsMap));
  }, [completedStepsMap]);

  // Handle switching scenarios
  const handleSelectScenario = (id: ScenarioId) => {
    setActiveScenarioId(id);
    // Reset transient session/tunnel state for the new scenario
    setSessions([]);
    setRoutes([]);
    setPortForwards([]);
    setDiscoveredHosts([]);
    setCompromisedMachineIds([]);

    try {
      const saved = localStorage.getItem(`ejpt_events_${id}`);
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        const nextSc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
        setEvents([
          {
            id: `ev-init-${Date.now()}`,
            type: 'milestone',
            title: `Escenario Cargado: ${nextSc.title}`,
            detail: `Subred interna: ${nextSc.isolatedSubnet}. Inicia el pivoting siguiendo los objetivos.`,
            timestamp: new Date().toLocaleTimeString(),
            badge: 'READY',
          },
        ]);
      }
    } catch {
      setEvents([]);
    }
  };

  const handleStepCompleted = (stepId: string) => {
    setCompletedStepsMap((prev) => {
      const currentList = prev[activeScenarioId] || [];
      if (!currentList.includes(stepId)) {
        return {
          ...prev,
          [activeScenarioId]: [...currentList, stepId],
        };
      }
      return prev;
    });

    const stepObj = activeScenario.steps.find((s) => s.id === stepId);
    if (stepObj) {
      setEvents((prev) => [
        {
          id: `ev-${Date.now()}-${Math.random()}`,
          type: 'milestone',
          title: `Hito Alcanzado: ${stepObj.title}`,
          detail: stepObj.description,
          timestamp: new Date().toLocaleTimeString(),
          badge: 'OBJETIVO',
        },
        ...prev,
      ]);
    }
  };

  const handleNewSession = (session: PivotingSession) => {
    setSessions((prev) => [...prev, session]);
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: 'session',
        title: 'Sesión Establecida',
        detail: `Sesión #${session.id} establecida en ${session.remoteIp} (${session.platform === 'windows' ? 'Windows' : 'Linux'}) con usuario ${session.user}`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'SESIÓN ACTIVA',
      },
      ...prev,
    ]);
  };

  const handleNewRoute = (route: NetworkRoute) => {
    setRoutes((prev) => [...prev, route]);
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: 'route',
        title: 'Ruta Añadida al Enrutador',
        detail: `Tráfico hacia subred ${route.subnet}/${route.netmask} enrutado vía Sesión #${route.sessionId}`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'ENRUTAMIENTO',
      },
      ...prev,
    ]);
  };

  const handleNewPortForward = (rule: PortForwardRule) => {
    setPortForwards((prev) => [...prev, rule]);
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: 'portforward',
        title: 'Puerto Redirigido (Port Forward)',
        detail: `Local ${rule.localAddress}:${rule.localPort} redirigido hacia ${rule.targetAddress}:${rule.targetPort} (${rule.type.toUpperCase()})`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'PORT FORWARD',
      },
      ...prev,
    ]);
  };

  const handleHostDiscovered = (host: { ip: string; mac?: string }) => {
    setDiscoveredHosts((prev) => [...prev, host.ip]);
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: 'discovery',
        title: 'Host Descubierto en Red Aislada',
        detail: `Host detectado: ${host.ip} ${host.mac ? `(MAC: ${host.mac})` : ''}`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'DISCOVERY',
      },
      ...prev,
    ]);
  };

  const handleTargetCompromised = (machineId: string) => {
    setCompromisedMachineIds((prev) => [...prev, machineId]);
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: 'compromise',
        title: '¡Máquina Objetivo Comprometida!',
        detail: `Acceso remoto obtenido a la máquina aislada ${machineId}`,
        timestamp: new Date().toLocaleTimeString(),
        badge: 'PWNED / ROOT',
      },
      ...prev,
    ]);
  };

  const handleResetProgress = () => {
    setCompletedStepsMap((prev) => ({
      ...prev,
      [activeScenarioId]: [],
    }));
    setSessions([]);
    setRoutes([]);
    setPortForwards([]);
    setDiscoveredHosts([]);
    setCompromisedMachineIds([]);
    setEvents([
      {
        id: `ev-reset-${Date.now()}`,
        type: 'milestone',
        title: 'Progreso Reiniciado',
        detail: 'El laboratorio se ha restablecido a su estado inicial.',
        timestamp: new Date().toLocaleTimeString(),
        badge: 'REINICIO',
      },
    ]);
    try {
      localStorage.removeItem(`ejpt_events_${activeScenarioId}`);
    } catch {}
  };

  const handleResetAll = () => {
    if (window.confirm('¿Deseas reiniciar el progreso de todos los escenarios de pivoting, el historial de comandos y los eventos?')) {
      setCompletedStepsMap({});
      setSessions([]);
      setRoutes([]);
      setPortForwards([]);
      setDiscoveredHosts([]);
      setCompromisedMachineIds([]);
      setEvents([]);
      localStorage.removeItem('ejpt_completed_steps');
      localStorage.removeItem('ejpt_terminal_persistent_history');
      SCENARIOS.forEach((s) => {
        try {
          localStorage.removeItem(`ejpt_events_${s.id}`);
        } catch {}
      });
      window.location.reload();
    }
  };

  // Derive dynamic machine statuses
  const dynamicMachines: MachineInfo[] = activeScenario.machines.map((m) => {
    const isCompromised =
      compromisedMachineIds.includes(m.id) ||
      (m.role === 'intermediate' && sessions.length > 0);
    return {
      ...m,
      isCompromised,
    };
  });

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Bar Contract Navigation */}
      <Header
        scenarios={SCENARIOS}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenCheatsheet={() => setIsCheatsheetOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        onResetLab={handleResetAll}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Scenario Banner / Sub-Header */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-sky-400 font-semibold uppercase tracking-wider bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                {activeScenario.badge}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-medium">Subred Aislada: {activeScenario.isolatedSubnet}</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-100">
              {activeScenario.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-4xl">
              {activeScenario.description}
            </p>
          </div>

          {/* Quick Mobile Scenario Selector (shown when navigation wrapped) */}
          <div className="lg:hidden flex items-center gap-2 pt-2 border-t border-slate-800 md:border-t-0 md:pt-0">
            <label htmlFor="scenario-select" className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Cambiar Escenario:
            </label>
            <select
              id="scenario-select"
              value={activeScenarioId}
              onChange={(e) => handleSelectScenario(e.target.value as ScenarioId)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {SCENARIOS.map((sc, i) => (
                <option key={sc.id} value={sc.id}>
                  Escenario {i + 1}: {sc.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Column Split: Left Terminal Hub | Right Topology & Objectives */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Multi-Tab Terminal (7 of 12 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <TerminalHub
              key={activeScenarioId}
              scenario={activeScenario}
              currentStep={currentStep}
              sessions={sessions}
              routes={routes}
              portForwards={portForwards}
              discoveredHosts={discoveredHosts}
              onStepCompleted={handleStepCompleted}
              onNewSession={handleNewSession}
              onNewRoute={handleNewRoute}
              onNewPortForward={handleNewPortForward}
              onHostDiscovered={handleHostDiscovered}
              onTargetCompromised={handleTargetCompromised}
            />

            {/* Terminal Tips Bar */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Pulsa <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">Tab</kbd> para autocompletar</span>
                <span>·</span>
                <span>Usa <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">↑</kbd> <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">↓</kbd> para historial</span>
              </div>
              <span className="font-mono text-slate-500">100% Client-Side (GitHub Pages Ready)</span>
            </div>

            {/* Real-time Event Log (Registro táctil y visual en tiempo real) */}
            <EventLog
              events={events}
              onClearEvents={() => setEvents([])}
            />
          </div>

          {/* Right Column: Dynamic Network Topology & Scenario Guide (5 of 12 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Network Topology */}
            <NetworkTopology
              machines={dynamicMachines}
              portForwards={portForwards}
              routes={routes}
              sessions={sessions}
              isolatedSubnet={activeScenario.isolatedSubnet}
            />

            {/* Step-by-Step Objectives & Exam Roadmap */}
            <ScenarioGuide
              scenario={activeScenario}
              currentStepIndex={effectiveStepIndex}
              completedStepIds={completedStepIds}
              learningMode={learningMode}
              onSetLearningMode={setLearningMode}
              onResetProgress={handleResetProgress}
              onOpenAuditReport={() => setIsAuditReportOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Footer with Author Branding */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#070b14] py-6 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group"
            >
              <img
                src="./icono.png"
                alt="Un Fantasma en el Sistema"
                className="w-8 h-8 object-contain rounded-md bg-slate-900 border border-slate-800 p-0.5 group-hover:border-sky-500 transition-colors"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://www.unfantasmaenelsistema.com/wp-content/uploads/2026/09/icono.png';
                }}
              />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200 group-hover:text-sky-300 transition-colors flex items-center gap-1">
                  Un Fantasma en el Sistema
                  <span className="text-[10px] text-sky-400">↗</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Ciberseguridad, Hacking Ético y Formación Práctica
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              https://www.unfantasmaenelsistema.com/
            </a>
            <span className="text-slate-600">·</span>
            <span>Simulador de Examen eJPTv2 (Pivoting)</span>
          </div>
        </div>
      </footer>

      {/* Cheatsheet and VirtualBox Reference Modal */}
      <CheatsheetModal
        isOpen={isCheatsheetOpen}
        onClose={() => setIsCheatsheetOpen(false)}
      />

      {/* Pentest Scratchpad & Loot Vault Modal */}
      <Scratchpad
        scenario={activeScenario}
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        discoveredHosts={discoveredHosts}
        compromisedMachineIds={compromisedMachineIds}
      />

      {/* Audit Performance & Certification Report Modal */}
      <AuditReportModal
        scenario={activeScenario}
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        completedStepIds={completedStepIds}
        secondsElapsed={examSeconds}
      />
    </div>
  );
}

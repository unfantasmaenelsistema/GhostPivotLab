/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MachineInfo,
  PortForwardRule,
  NetworkRoute,
  PivotingSession,
} from '../types';
import {
  Shield,
  Server,
  Laptop,
  Lock,
  Unlock,
  CheckCircle2,
  Info,
  Network,
  Radio,
  Zap,
} from 'lucide-react';

interface NetworkTopologyProps {
  machines: MachineInfo[];
  portForwards: PortForwardRule[];
  routes: NetworkRoute[];
  sessions: PivotingSession[];
  isolatedSubnet: string;
  onSelectMachine?: (machine: MachineInfo) => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  machines,
  portForwards,
  routes,
  sessions,
  isolatedSubnet,
}) => {
  const [selectedMachine, setSelectedMachine] = useState<MachineInfo | null>(null);

  const attacker = machines.find((m) => m.role === 'attacker');
  const intermediate = machines.find((m) => m.role === 'intermediate');
  const target = machines.find((m) => m.role === 'target');

  const hasActiveTunnel = portForwards.some((pf) => pf.isActive);
  const hasActiveRoute = routes.length > 0;
  const isIntermediateCompromised = intermediate?.isCompromised || sessions.length > 0;
  const isTargetCompromised = target?.isCompromised;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-100 shadow-xl">
      {/* Topology Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Topología de Red del Laboratorio
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Túnel Activo:</span>
          {hasActiveTunnel ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
              PORT FORWARDING ON
            </span>
          ) : hasActiveRoute ? (
            <span className="inline-flex items-center gap-1 text-sky-400 font-medium bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
              <Radio className="w-3 h-3 text-sky-400" />
              AUTOROUTE ON
            </span>
          ) : (
            <span className="text-slate-500 font-medium">AISLADO</span>
          )}
        </div>
      </div>

      {/* Visual Network Architecture Diagram */}
      <div className="relative bg-[#090d16] border border-slate-800/80 rounded-lg p-5 overflow-hidden">
        {/* Background Network Subnets Representation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {/* Subnet 1: Bridged Network */}
          <div className="border border-sky-900/40 bg-sky-950/10 rounded-lg p-3 relative">
            <div className="text-[11px] font-mono font-medium text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Red Puente (LAN Atacante)</span>
              <span className="text-slate-400 font-normal">192.168.1.0/24</span>
            </div>
            <div className="text-xs text-slate-400">
              Conexión directa entre Kali Linux y Adaptador 1 de la Intermedia.
            </div>
          </div>

          {/* Subnet 2: Isolated NAT Network */}
          <div className="border border-amber-900/40 bg-amber-950/10 rounded-lg p-3 relative">
            <div className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Red NAT Aislada (Objetivo)
              </span>
              <span className="text-slate-400 font-normal">{isolatedSubnet}</span>
            </div>
            <div className="text-xs text-slate-400">
              Subred privada sin salida a Kali. Solo accesible haciendo pivoting vía Intermedia.
            </div>
          </div>
        </div>

        {/* Nodes Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-2">
          {/* 1. Kali Linux (Attacker) */}
          <div
            onClick={() => attacker && setSelectedMachine(attacker)}
            className="cursor-pointer group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-sky-500 transition-all rounded-lg p-3.5 shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-950 text-sky-400 border border-sky-800 rounded">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Kali Linux</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Atacante</span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-sky-900/40 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                eth0
              </span>
            </div>

            <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">IP Puente:</span>
                <span className="text-sky-300 font-semibold">{attacker?.interfaces[0]?.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payload LPORT:</span>
                <span className="text-slate-300">4444 / 5555</span>
              </div>
            </div>
          </div>

          {/* 2. Intermediate Host (Pivot Dual-NIC) */}
          <div
            onClick={() => intermediate && setSelectedMachine(intermediate)}
            className={`cursor-pointer group relative bg-slate-900/90 hover:bg-slate-850 border transition-all rounded-lg p-3.5 shadow-md flex flex-col justify-between ${
              isIntermediateCompromised
                ? 'border-emerald-600/80 ring-1 ring-emerald-500/30'
                : 'border-slate-700/80 hover:border-amber-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded border ${
                    isIntermediateCompromised
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">{intermediate?.name}</h3>
                  <span className="text-[10px] text-amber-400 font-mono">Punto de Pivote (Dual NIC)</span>
                </div>
              </div>
              {isIntermediateCompromised ? (
                <span className="text-[10px] font-mono bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  PWNED
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  2 NICs
                </span>
              )}
            </div>

            <div className="mt-2 space-y-1 font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-sky-400 text-[10px]">NIC 1 (Puente):</span>
                <span className="text-sky-300">{intermediate?.interfaces[0]?.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400 text-[10px]">NIC 2 (NAT):</span>
                <span className="text-amber-300">{intermediate?.interfaces[1]?.ip}</span>
              </div>
            </div>
          </div>

          {/* 3. Target Host (Isolated in NAT Subnet) */}
          <div
            onClick={() => target && setSelectedMachine(target)}
            className={`cursor-pointer group relative bg-slate-900/90 hover:bg-slate-850 border transition-all rounded-lg p-3.5 shadow-md flex flex-col justify-between ${
              isTargetCompromised
                ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                : 'border-slate-700/80 hover:border-red-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded border ${
                    isTargetCompromised
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-red-950 text-red-400 border-red-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">{target?.name}</h3>
                  <span className="text-[10px] text-red-400 font-mono">Objetivo Aislado</span>
                </div>
              </div>
              {isTargetCompromised ? (
                <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  ACCESO OK
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-red-950/60 text-red-400 px-1.5 py-0.5 rounded border border-red-800 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  SIN RUTA
                </span>
              )}
            </div>

            <div className="mt-2 space-y-1 font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">IP Interna:</span>
                <span className="text-amber-300 font-semibold">{target?.interfaces[0]?.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Servicios:</span>
                <span className="text-slate-300">
                  {target?.services.map((s) => `${s.service}:${s.port}`).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tunnel Routing Visual Indicator */}
        <div className="mt-5 border-t border-slate-800 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Estado de Enrutamiento:</span>
              {hasActiveTunnel ? (
                <div className="flex items-center gap-2 font-mono text-emerald-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    Túnel Activo:{' '}
                    {portForwards.map((pf) => (
                      <strong key={pf.id} className="text-slate-100 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 mr-2">
                        {pf.localAddress}:{pf.localPort} ➔ {pf.targetAddress}:{pf.targetPort}
                      </strong>
                    ))}
                  </span>
                </div>
              ) : hasActiveRoute ? (
                <div className="flex items-center gap-2 font-mono text-sky-400">
                  <span>Ruta Metasploit añadida: 10.10.10.0/24 vía Sesión {routes[0]?.sessionId}</span>
                </div>
              ) : (
                <span className="text-slate-500">
                  Ningún túnel activo. Sigue los pasos para configurar portproxy o portfwd.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Sesiones activas: {sessions.length}</span>
              <span>·</span>
              <span>Rutas: {routes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Details Inspector Drawer / Modal */}
      {selectedMachine && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-100">{selectedMachine.name}</span>
              <span className="text-slate-400">({selectedMachine.os})</span>
            </div>
            <button
              onClick={() => setSelectedMachine(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 hover:bg-slate-800 rounded"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Interfaces de Red
              </h4>
              <div className="space-y-1 font-mono text-[11px]">
                {selectedMachine.interfaces.map((iface, idx) => (
                  <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-sky-300 font-semibold">{iface.name}</div>
                    <div className="text-slate-400">IP: {iface.ip} / {iface.netmask}</div>
                    <div className="text-slate-500 text-[10px]">Modo: {iface.type === 'bridge' ? 'Adaptador Puente' : 'Red NAT Interna'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Servicios y Puertos
              </h4>
              <div className="space-y-1 font-mono text-[11px]">
                {selectedMachine.services.map((svc, idx) => (
                  <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-slate-300 font-semibold">{svc.service}</span>
                      <span className="text-slate-500 ml-2">puerto {svc.port}/{svc.protocol}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                      {svc.isOpen ? 'OPEN' : 'STANDBY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VIRTUALBOX_LAB_GUIDE } from '../data/scenarios';
import {
  X,
  BookOpen,
  Terminal,
  Settings,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface CheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'virtualbox' | 'commands' | 'rules'>('commands');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#090e1a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 p-0.5 hover:border-sky-500 transition-colors shrink-0"
              title="Un Fantasma en el Sistema"
            >
              <img
                src="./icono.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://www.unfantasmaenelsistema.com/wp-content/uploads/2026/09/icono.png';
                }}
              />
            </a>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Manual de Pivoting & Guía de Laboratorio eJPTv2
              </h2>
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
              >
                por Un Fantasma en el Sistema ↗
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0d1424] px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'commands'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Comandos de Pivoting (Cheat Sheet)
          </button>

          <button
            onClick={() => setActiveTab('virtualbox')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'virtualbox'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuración VirtualBox
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Reglas de Oro del Examen
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Resumen de sintaxis de las tres técnicas fundamentales evaluadas en el examen eJPTv2:
              </p>

              <div className="space-y-3">
                {VIRTUALBOX_LAB_GUIDE.commandsSummary.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sky-300 text-sm">{item.technique}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.module}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{item.description}</p>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between font-mono text-[11px] text-emerald-300">
                      <span className="overflow-x-auto select-all">{item.syntax}</span>
                      <button
                        onClick={() => handleCopy(item.syntax)}
                        className="ml-2 text-slate-400 hover:text-slate-200 shrink-0"
                        title="Copiar sintaxis"
                      >
                        {copiedText === item.syntax ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'virtualbox' && (
            <div className="space-y-4">
              <div className="bg-sky-950/40 border border-sky-800/80 rounded-lg p-3 text-sky-200">
                Para replicar este laboratorio localmente en tu ordenador con VirtualBox, sigue la topología de 3 máquinas:
              </div>

              <div className="space-y-3">
                {VIRTUALBOX_LAB_GUIDE.subnets.map((net, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                    <h3 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      {net.name}
                    </h3>
                    <p className="text-slate-400 text-xs">{net.description}</p>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
                      {net.adapterSetting}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <h4 className="font-semibold text-slate-200">Comprobación del Aislamiento (Ping Test):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Desde Kali a Máquina Intermedia (192.168.1.X) ➔ <span className="text-emerald-400">RESPONDE</span></li>
                  <li>Desde Máquina Intermedia a Objetivo (10.10.10.X) ➔ <span className="text-emerald-400">RESPONDE</span></li>
                  <li>Desde Kali a Objetivo Aislado (10.10.10.X) ➔ <span className="text-rose-400 font-bold">FALLA / UNREACHABLE</span></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="bg-rose-950/40 border border-rose-900/80 rounded-lg p-3.5 space-y-1.5">
                <h4 className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  1. Conflicto de LPORT en Metasploit
                </h4>
                <p className="text-slate-300 text-xs">
                  Si ya tienes una sesión de Meterpreter abierta recibiendo conexiones en el puerto <strong>4444</strong>, NUNCA lances un segundo payload o handler hacia el mismo puerto. Cámbialo siempre a <strong>5555</strong> u otro puerto libre con <code className="bg-slate-900 px-1 text-emerald-300">set LPORT 5555</code>.
                </p>
              </div>

              <div className="bg-amber-950/40 border border-amber-900/80 rounded-lg p-3.5 space-y-1.5">
                <h4 className="font-semibold text-amber-300">
                  2. ¿Cuándo usar Portproxy vs Portfwd vs Route Add?
                </h4>
                <p className="text-slate-300 text-xs">
                  - <strong>portproxy</strong>: Cuando la máquina intermedia es <em>Windows</em> y queremos que exponga un puerto TCP en su tarjeta de red accesible para herramientas externas (SSH, navegador, nmap).<br />
                  - <strong>route add / autoroute</strong>: Hace que <em>los módulos internos de Metasploit</em> alcancen la subred remota.<br />
                  - <strong>portfwd</strong>: Se ejecuta dentro de una sesión Meterpreter de <em>Linux</em> para traer un puerto a 127.0.0.1 de tu Kali.
                </p>
              </div>

              <div className="bg-sky-950/40 border border-sky-900/80 rounded-lg p-3.5 space-y-1.5">
                <h4 className="font-semibold text-sky-300">
                  3. Descubrimiento Sigiloso con ARP Scanner
                </h4>
                <p className="text-slate-300 text-xs">
                  En entornos Windows corporativos, usar un ping sweep tradicional suele ser bloqueado por el firewall de Windows. El módulo <code className="bg-slate-900 px-1 text-emerald-300">post/windows/gather/arp_scanner</code> utiliza paquetes ARP de capa 2 a través de la máquina comprometida, esquivando el firewall y revelando todos los equipos vivos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#090e1a] border-t border-slate-800 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Entendido, volver al simulador
          </button>
        </div>
      </div>
    </div>
  );
};

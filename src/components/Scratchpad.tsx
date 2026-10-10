/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Trash2,
  Key,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { ScenarioConfig } from '../types';

interface ScratchpadProps {
  scenario: ScenarioConfig;
  isOpen: boolean;
  onClose: () => void;
  discoveredHosts: string[];
  compromisedMachineIds: string[];
}

export const Scratchpad: React.FC<ScratchpadProps> = ({
  scenario,
  isOpen,
  onClose,
  discoveredHosts,
  compromisedMachineIds,
}) => {
  const storageKey = `ejpt_notes_${scenario.id}`;
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(storageKey) || '';
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'loot'>('notes');

  useEffect(() => {
    localStorage.setItem(storageKey, notes);
  }, [notes, storageKey]);

  useEffect(() => {
    // When scenario changes, reload notes for that scenario
    setNotes(localStorage.getItem(storageKey) || '');
  }, [scenario.id]);

  if (!isOpen) return null;

  const insertTemplate = () => {
    const template = 
`========================================
NOTAS DE AUDITORÍA eJPTv2 - ${scenario.title}
Fecha: ${new Date().toLocaleDateString()}
========================================

1. TOPOLOGÍA & INTERFACES:
- Atacante (Kali): 192.168.1.100 (eth0 Puente)
- Intermedia: ${scenario.machines.find(m => m.role === 'intermediate')?.interfaces.map(i => `${i.name} (${i.ip})`).join(', ')}
- Subred Aislada: ${scenario.isolatedSubnet}
- Objetivo Final: ${scenario.machines.find(m => m.role === 'target')?.interfaces[0]?.ip || 'Por descubrir'}

2. DESCUBRIMIENTO & PUERTOS:
- Puertos abiertos descubiertos: 
- Servicios encontrados: 

3. TÉCNICA DE PIVOTING UTILIZADA:
- Tipo: [ ] Portproxy (Netsh)  [ ] Route Add (Metasploit)  [ ] Portfwd (Meterpreter)
- Parámetros del túnel:
  * Puerto Local (Kali / Intermedia): 
  * Puerto Remoto (Objetivo): 

4. CREDENCIALES & ACCESO:
- Usuario: 
- Contraseña / Hash: 
- Sesión / Flag: 

5. OBSERVACIONES & RECOMENDACIONES:
`;
    setNotes((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas_ejptv2_${scenario.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Loot data according to scenario
  const getScenarioLoot = () => {
    if (scenario.id === 'windows-portproxy-zorin') {
      return [
        {
          type: 'Credential',
          target: 'Zorin OS (10.10.10.15:22)',
          value: 'usuario_zorin : password123',
          obtained: compromisedMachineIds.includes('zorin-target'),
        },
        {
          type: 'Flag',
          target: 'SSH Tunnel 192.168.1.50:2222',
          value: 'FLAG{eJPTv2_PORTPROXY_TUNNEL_SUCCESS_ZORIN_PWNED}',
          obtained: compromisedMachineIds.includes('zorin-target'),
        },
      ];
    } else if (scenario.id === 'linux-autoroute-portfwd') {
      return [
        {
          type: 'Credential',
          target: 'Metasploitable 2 FTP (127.0.0.1:4000)',
          value: 'msfadmin : msfadmin',
          obtained: compromisedMachineIds.includes('metasploitable-target'),
        },
        {
          type: 'Web Service',
          target: 'Metasploitable 2 Web (127.0.0.1:5000)',
          value: 'Apache/2.2.8 (Ubuntu) DAV/2 / Mutillidae / DVWA',
          obtained: compromisedMachineIds.includes('metasploitable-target'),
        },
      ];
    } else {
      return [
        {
          type: 'Discovered Host',
          target: 'Red NAT 10.10.10.0/24',
          value: `10.10.10.11 (MAC: 08:00:27:fa:4a:91)`,
          obtained: discoveredHosts.includes('10.10.10.11'),
        },
        {
          type: 'Session SYSTEM',
          target: 'Windows 7 Target (10.10.10.11)',
          value: 'NT AUTHORITY\\SYSTEM (Sesión 2 en LPORT 5555)',
          obtained: compromisedMachineIds.includes('win7-target'),
        },
        {
          type: 'Flag',
          target: 'MS17-010 Double Pivot',
          value: 'FLAG{eJPTv2_ETERNALBLUE_DOUBLE_PIVOT_EXPLOIT_SUCCESS}',
          obtained: compromisedMachineIds.includes('win7-target'),
        },
      ];
    }
  };

  const lootItems = getScenarioLoot();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#090e1a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Pentest Scratchpad & Registro de Evidencias (eJPTv2)
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {scenario.title} · Guardado automático en el navegador
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-800 text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0d1424] px-6 text-xs font-medium justify-between items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Bloc de Notas Libre
            </button>
            <button
              onClick={() => setActiveTab('loot')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'loot'
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" />
              Loot & Flags Capturadas ({lootItems.filter(l => l.obtained).length}/{lootItems.length})
            </button>
          </div>

          {activeTab === 'notes' && (
            <div className="flex items-center gap-2 py-1">
              <button
                onClick={insertTemplate}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                title="Insertar plantilla predefinida de auditoría"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Plantilla eJPTv2</span>
              </button>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                title="Descargar notas como archivo .txt"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Exportar .txt</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto font-mono text-xs">
          {activeTab === 'notes' ? (
            <div className="h-full flex flex-col space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Apunta aquí tus comandos ejecutados, puertos abiertos, credenciales encontradas y notas para el examen eJPTv2..."
                rows={16}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs leading-relaxed resize-none scrollbar-thin scrollbar-thumb-slate-800"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
                <span>{notes.length} caracteres · {notes.split(/\s+/).filter(Boolean).length} palabras</span>
                <button
                  onClick={() => {
                    if (window.confirm('¿Borrar todas las notas de este escenario?')) setNotes('');
                  }}
                  className="text-slate-500 hover:text-rose-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Limpiar notas
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-300 text-xs">
                Las banderas y credenciales se desbloquean automáticamente en este baúl a medida que ejecutas con éxito los pasos de pivote y explotación en la terminal.
              </div>

              <div className="space-y-2.5">
                {lootItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border transition-all ${
                      item.obtained
                        ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.obtained ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-xs text-slate-300">{item.target}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {item.obtained ? 'DESBLOQUEADO' : 'PENDIENTE DE EXPLOTAR'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800/80 flex items-center justify-between font-mono text-xs">
                      <span className={item.obtained ? 'text-emerald-300 select-all' : 'text-slate-600 blur-[2px] select-none'}>
                        {item.value}
                      </span>
                      {item.obtained && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.value);
                            alert('Copiado al portapapeles');
                          }}
                          className="text-slate-400 hover:text-slate-200 ml-2"
                          title="Copiar evidencia"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#090e1a] border-t border-slate-800 px-6 py-3 flex justify-between items-center text-xs text-slate-400">
          <span>Un Fantasma en el Sistema · www.unfantasmaenelsistema.com</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Listo, volver a la terminal
          </button>
        </div>
      </div>
    </div>
  );
};

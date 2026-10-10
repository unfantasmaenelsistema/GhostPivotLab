/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Shield,
  Copy,
  Check,
  Download,
  X,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { ScenarioConfig } from '../types';

interface AuditReportModalProps {
  scenario: ScenarioConfig;
  isOpen: boolean;
  onClose: () => void;
  completedStepIds: string[];
  secondsElapsed: number;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  scenario,
  isOpen,
  onClose,
  completedStepIds,
  secondsElapsed,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalSteps = scenario.steps.length;
  const completedCount = completedStepIds.length;
  const scorePct = Math.round((completedCount / totalSteps) * 100);
  const isPassed = scorePct === 100;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateMarkdownReport = () => {
    return `# INFORME DE AUDITORÍA PRÁCTICA - GHOST PIVOT LAB
Emitido por: Un Fantasma en el Sistema (https://www.unfantasmaenelsistema.com/)
Fecha de Evaluación: ${new Date().toLocaleString()}

============================================================
RESUMEN DE RENDIMIENTO DEL ESTUDIANTE
============================================================
* Escenario Evaluado: ${scenario.title}
* Subred Aislada Objetivo: ${scenario.isolatedSubnet}
* Resultado Final: ${isPassed ? 'APROBADO (PASSED)' : 'EN PROGRESO (IN PROGRESS)'}
* Puntuación de Objetivos: ${completedCount} / ${totalSteps} (${scorePct}%)
* Tiempo Total de Ejecución: ${formatTimer(secondsElapsed)}

============================================================
TÉCNICAS DEMOSTRADAS (MITRE ATT&CK FRAMEWORK)
============================================================
1. [T1090.001] Internal Proxy & Port Forwarding
   - Capacidad comprobada para redirigir tráfico TCP entre segmentos aislados usando Portproxy o Portfwd.
2. [T1018] Remote System Discovery
   - Capacidad para identificar interfaces internas y descubrir equipos vecinos mediante ARP / ICMP.
3. [T1210] Exploitation of Remote Services
   - Despliegue de listeners (multi/handler), generación de payloads con MSFvenom o explotación transversal con MS17-010.
4. [T1021.004] Remote Services: SSH & Protocol Access
   - Consumo de servicios aislados a través de interfaces intermedias o puertos mapeados en localhost.

============================================================
DETALLE DE PASOS Y OBJETIVOS EVALUADOS
============================================================
${scenario.steps
  .map(
    (s) =>
      `- [${completedStepIds.includes(s.id) ? 'X' : ' '}] Paso ${s.stepNumber}: ${s.title} (${
        completedStepIds.includes(s.id) ? 'SUPERADO' : 'PENDIENTE'
      })\n  Relevancia práctica: ${s.whyInExam}`
  )
  .join('\n')}

============================================================
RECOMENDACIONES PARA EXÁMENES PRÁCTICOS DE PENTESTING
============================================================
- Recuerda siempre documentar las dos tarjetas de red de cada host comprometido (ifconfig / ipconfig).
- No olvides enviar las sesiones a segundo plano ('background') antes de gestionar rutas estáticas con 'route add'.
- En caso de segundas reverse shells hacia la misma IP de Kali, modifica obligatoriamente el LPORT para evitar colisiones.
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const reportText = generateMarkdownReport();
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_ghost_pivot_lab_${scenario.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-[#090e1a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Informe de Auditoría — Ghost Pivot Lab
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Evaluación de Técnicas de Pivoting & Port Forwarding
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-800 text-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          {/* Result Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              isPassed
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-full border ${
                  isPassed
                    ? 'bg-emerald-900 border-emerald-600 text-emerald-300'
                    : 'bg-amber-900 border-amber-600 text-amber-300'
                }`}
              >
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {isPassed ? '¡LABORATORIO SUPERADO!' : 'EVALUACIÓN EN PROCESO'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isPassed
                    ? 'Has completado satisfactoriamente todos los objetivos del escenario de pivoting.'
                    : `Has completado ${completedCount} de ${totalSteps} objetivos requeridos.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center">
              <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 font-mono">
                <div className="text-[10px] text-slate-400 uppercase">Puntuación</div>
                <div className={`text-lg font-bold ${isPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {scorePct}%
                </div>
              </div>
              <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 font-mono">
                <div className="text-[10px] text-slate-400 uppercase">Tiempo</div>
                <div className="text-lg font-bold text-sky-400">
                  {formatTimer(secondsElapsed)}
                </div>
              </div>
            </div>
          </div>

          {/* MITRE ATT&CK Matrix Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Mapeo de Técnicas MITRE ATT&CK Demostradas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-[11px]">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-sky-300 font-semibold">[T1090.001] Internal Proxy</span>
                <p className="text-slate-400 text-[10px] mt-1 font-sans">
                  Port forwarding mediante netsh portproxy o Meterpreter portfwd hacia servicios aislados.
                </p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-sky-300 font-semibold">[T1018] Remote System Discovery</span>
                <p className="text-slate-400 text-[10px] mt-1 font-sans">
                  Descubrimiento de hosts y subredes internas mediante ifconfig, arp_scanner y nmap.
                </p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-sky-300 font-semibold">[T1210] Exploitation of Remote Services</span>
                <p className="text-slate-400 text-[10px] mt-1 font-sans">
                  Explotación con MS17-010 EternalBlue y gestión de sesiones Meterpreter multi/handler.
                </p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-sky-300 font-semibold">[T1021.004] Remote Services: SSH/SMB</span>
                <p className="text-slate-400 text-[10px] mt-1 font-sans">
                  Acceso a consolas remotas autenticadas a través de túneles locales cifrados.
                </p>
              </div>
            </div>
          </div>

          {/* Steps Evaluation Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Desglose de Pasos Auditados
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              {scenario.steps.map((step) => {
                const isStepPassed = completedStepIds.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      isStepPassed
                        ? 'bg-slate-900/80 border-emerald-900/60 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isStepPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span>
                        Paso {step.stepNumber}: {step.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isStepPassed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {isStepPassed ? 'COMPLETADO' : 'NO EJECUTADO'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="bg-[#090e1a] border-t border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Emitido por</span>
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              Un Fantasma en el Sistema ↗
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Informe .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

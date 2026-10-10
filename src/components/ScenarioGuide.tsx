/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScenarioConfig, ScenarioStep, LearningMode } from '../types';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ScenarioGuideProps {
  scenario: ScenarioConfig;
  currentStepIndex: number;
  completedStepIds: string[];
  learningMode: LearningMode;
  onSetLearningMode: (mode: LearningMode) => void;
  onResetProgress: () => void;
  onOpenAuditReport?: () => void;
  onSelectStepIndex?: (index: number) => void;
}

export const ScenarioGuide: React.FC<ScenarioGuideProps> = ({
  scenario,
  currentStepIndex,
  completedStepIds,
  learningMode,
  onSetLearningMode,
  onResetProgress,
  onOpenAuditReport,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [examFinished, setExamFinished] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (learningMode === 'exam' && !examFinished) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [learningMode, examFinished]);

  const currentStep = scenario.steps[currentStepIndex];
  const allCompleted = scenario.steps.every((s) => completedStepIds.includes(s.id));
  const progressPct = scenario.steps.length > 0 ? Math.round((completedStepIds.length / scenario.steps.length) * 100) : 0;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-slate-100 shadow-xl">
      {/* Mode Switcher & Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Guía de Objetivos eJPTv2
          </h2>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-850 p-1 rounded-lg text-xs">
          <button
            onClick={() => onSetLearningMode('guided')}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              learningMode === 'guided'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modo Guiado
          </button>
          <button
            onClick={() => onSetLearningMode('exam')}
            className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              learningMode === 'exam'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Modo Examen
          </button>
        </div>
      </div>

      {/* Visual Hack Completion & Progress Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md border ${
              allCompleted 
                ? 'bg-emerald-950 border-emerald-850 text-emerald-400' 
                : progressPct >= 50 
                ? 'bg-sky-950 border-sky-850 text-sky-400' 
                : 'bg-slate-850 border-slate-750 text-slate-400'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Hack Completion
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {completedStepIds.length} de {scenario.steps.length} objetivos completados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            {learningMode === 'exam' && (
              <div className="flex items-center gap-1 font-mono text-[11px] text-amber-300 bg-amber-950/60 border border-amber-900/60 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>{formatTimer(secondsElapsed)}</span>
              </div>
            )}
            <div className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded border tabular-nums ${
              allCompleted
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : progressPct >= 60
                ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                : 'bg-slate-950 text-slate-300 border-slate-800'
            }`}>
              {progressPct}%
            </div>
          </div>
        </div>

        {/* Visual Multi-Segment / Gradient Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            {/* Active Progress Fill */}
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full relative ${
                allCompleted
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
                  : progressPct >= 60
                  ? 'bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400'
                  : 'bg-gradient-to-r from-sky-600 to-sky-400'
              }`}
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            >
              {/* Subtle animated shimmer highlight */}
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Step Tick Marks */}
          <div className="flex justify-between items-center px-0.5 pt-0.5">
            {scenario.steps.map((step, idx) => {
              const isDone = completedStepIds.includes(step.id);
              const isCurrent = idx === currentStepIndex && !allCompleted;
              return (
                <div
                  key={step.id}
                  title={`Paso ${step.stepNumber}: ${step.title} (${isDone ? 'Completado' : isCurrent ? 'Paso actual' : 'Pendiente'})`}
                  className="flex flex-col items-center group cursor-default"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isDone
                        ? 'bg-emerald-400 ring-2 ring-emerald-500/30'
                        : isCurrent
                        ? 'bg-sky-400 ring-2 ring-sky-500/40 animate-ping'
                        : 'bg-slate-700'
                    }`}
                  />
                  <span className={`text-[9px] font-mono mt-0.5 ${
                    isDone ? 'text-emerald-400' : isCurrent ? 'text-sky-300 font-bold' : 'text-slate-600'
                  }`}>
                    P{step.stepNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Status Text */}
        <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-400 font-mono">
          <span className="text-slate-500 text-[10px]">
            {allCompleted
              ? 'OBJETIVO CONQUISTADO: 100% PWNED'
              : progressPct === 0
              ? 'FASE 1: RECONOCIMIENTO & ACCESO INICIAL'
              : progressPct < 60
              ? 'FASE 2: DESCUBRIMIENTO DE SUBRED & RUTAS'
              : 'FASE 3: PORT FORWARDING & EXPLOTACIÓN FINAL'}
          </span>
          <span className={`text-[10px] uppercase font-semibold ${
            allCompleted ? 'text-emerald-400' : 'text-sky-400'
          }`}>
            {allCompleted ? '✓ EXAMEN LISTO' : `${scenario.steps.length - completedStepIds.length} PENDIENTES`}
          </span>
        </div>
      </div>

      {/* Current Objective Details Card */}
      {currentStep && !allCompleted ? (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-xs flex items-center justify-center font-bold border border-sky-500/40">
                {currentStep.stepNumber}
              </span>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                {currentStep.title}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
              Paso Activo
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Theoretical explanation: Why it's tested in eJPTv2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              Relevancia para la certificación eJPTv2:
            </div>
            <p className="leading-normal">{currentStep.whyInExam}</p>
          </div>

          {/* Hint and Quick Copy Section (in Guided mode or when requested) */}
          <div className="pt-1">
            {learningMode === 'guided' || showHint ? (
              <div className="space-y-2">
                <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
                    <span>Comando o Sintaxis Esperada:</span>
                    <button
                      onClick={() => handleCopy(currentStep.hint)}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[10px] lowercase"
                    >
                      {copiedCmd === currentStep.hint ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> copiar comando
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-emerald-300 block select-all break-all">
                    {currentStep.hint}
                  </code>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 py-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Atascado? Revelar Pista del Examen</span>
              </button>
            )}
          </div>
        </div>
      ) : allCompleted ? (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-5 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-200">
            ¡Escenario eJPTv2 Superado con Éxito!
          </h3>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            {scenario.successFlagMessage}
          </p>
          {learningMode === 'exam' && (
            <div className="text-xs font-mono text-amber-300 bg-amber-950/60 p-2 rounded border border-amber-900 inline-block">
              Tiempo total invertido: {formatTimer(secondsElapsed)}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {onOpenAuditReport && (
              <button
                onClick={onOpenAuditReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold transition-colors shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                Ver Informe Oficial eJPTv2
              </button>
            )}
            <button
              onClick={onResetProgress}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Repetir Escenario
            </button>
          </div>
        </div>
      ) : null}

      {/* Step Roadmap Checklist */}
      <div className="space-y-1.5 border-t border-slate-800 pt-3">
        <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          Checklist de Pasos del Laboratorio
        </h4>
        <div className="space-y-1 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {scenario.steps.map((s, idx) => {
            const isCompleted = completedStepIds.includes(s.id);
            const isCurrent = idx === currentStepIndex && !allCompleted;
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                  isCurrent
                    ? 'bg-sky-950/60 border border-sky-800/80 text-sky-200 font-medium'
                    : isCompleted
                    ? 'bg-slate-900/60 text-emerald-300'
                    : 'bg-slate-950/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-sky-400' : 'text-slate-600'}`} />
                  )}
                  <span className="truncate">
                    {s.stepNumber}. {s.title}
                  </span>
                </div>
                {isCompleted && (
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                    DONE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

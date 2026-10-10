/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScenarioId = 'windows-portproxy-zorin' | 'linux-autoroute-portfwd' | 'windows-eternalblue-arp';

export type LearningMode = 'guided' | 'exam';

export interface MachineInfo {
  id: string;
  name: string;
  os: 'Kali Linux' | 'Windows' | 'Ubuntu Linux' | 'Zorin OS' | 'Metasploitable 2' | 'Windows 7';
  role: 'attacker' | 'intermediate' | 'target';
  interfaces: {
    name: string;
    type: 'bridge' | 'nat_isolated';
    ip: string;
    netmask: string;
    mac?: string;
  }[];
  services: {
    port: number;
    protocol: string;
    service: string;
    isOpen: boolean;
    isCompromised?: boolean;
  }[];
  isCompromised: boolean;
  compromiseMethod?: string;
}

export interface ScenarioStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  whyInExam: string;
  hint: string;
  expectedCommands: string[];
  alternativeCommands?: string[];
  tabRequired?: string;
  autoActionOnSuccess?: {
    type: 'create_session' | 'add_route' | 'add_portproxy' | 'add_portfwd' | 'discover_host' | 'compromise_target';
    details: Record<string, any>;
  };
}

export interface ScenarioConfig {
  id: ScenarioId;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  topologySummary: string;
  machines: MachineInfo[];
  isolatedSubnet: string;
  steps: ScenarioStep[];
  successFlagMessage: string;
}

export type LineType = 
  | 'stdout' 
  | 'stderr' 
  | 'prompt' 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'banner';

export interface TerminalLine {
  id: string;
  type: LineType;
  text: string;
  timestamp?: number;
}

export type TerminalContext = 'bash' | 'msf-root' | 'msf-module' | 'meterpreter';

export interface TerminalTab {
  id: string;
  title: string;
  context: TerminalContext;
  cwd: string;
  activeModule?: string;
  moduleOptions: Record<string, string>;
  activeSessionId?: number;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
}

export interface PivotingSession {
  id: number;
  type: 'meterpreter';
  platform: 'windows' | 'linux';
  remoteIp: string;
  localIp: string;
  user: string;
  machineId: string;
  openedAt: string;
}

export interface NetworkRoute {
  subnet: string;
  netmask: string;
  sessionId: number;
}

export interface PortForwardRule {
  id: string;
  type: 'portproxy' | 'portfwd';
  localAddress: string;
  localPort: number;
  targetAddress: string;
  targetPort: number;
  viaSessionId?: number;
  isActive: boolean;
}

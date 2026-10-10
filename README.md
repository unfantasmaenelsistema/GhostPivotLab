# 🛡️ Ghost Pivot Lab

<p align="center">
  <img src="docs/screenshots/banner.svg" alt="Ghost Pivot Lab Banner" width="100%">
</p>

<p align="center">
  <a href="https://unfantasmaenelsistema.github.io/GhostPivotLab/"><img src="https://img.shields.io/badge/Demo%20en%20Vivo-GitHub%20Pages-10b981?style=for-the-badge&logo=githubpages&logoColor=white" alt="Demo en Vivo"></a>
  <a href="https://www.unfantasmaenelsistema.com/"><img src="https://img.shields.io/badge/Comunidad-Un%20Fantasma%20En%20El%20Sistema-0284c7?style=for-the-badge&logo=firefox-browser&logoColor=white" alt="Un Fantasma En El Sistema"></a>
  <img src="https://img.shields.io/badge/Pivoting-Metasploit%20%2B%20SSH-10b981?style=for-the-badge&logo=shield&logoColor=white" alt="Pivoting & Port Forwarding">
  <img src="https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-MIT-f59e0b?style=for-the-badge" alt="License MIT"></a>
</p>

---

## 🎯 Descripción General

**Ghost Pivot Lab** es un simulador interactivo de ciberseguridad pensado para practicar las técnicas de **pivoting** y **redirección de puertos (port forwarding)** que cualquier pentester necesita dominar para alcanzar máquinas en subredes privadas sin acceso directo desde la máquina atacante.

Cubre los tres pilares de esta disciplina:
- **Salto de red (pivoting)** a través de una máquina intermedia con doble tarjeta de red (Dual-NIC).
- **Enrutamiento interno** con `route add` / el módulo `autoroute` de Metasploit.
- **Redirección de puertos** con `portproxy` (Windows/netsh), `portfwd` (Meterpreter) y túneles SSH (`-L` / `-D`).

Esta aplicación replica la experiencia táctica con:
- Una **terminal multi-pestaña interactiva** que simula Bash, `msfconsole`, Meterpreter y SSH.
- Una **topología de red gráfica y reactiva en tiempo real** que muestra interfaces Dual-NIC, estados de máquinas comprometidas y túneles activos.
- Un **Event Log en tiempo real** que monitoriza y alerta sobre cada hito táctico (sesiones, rutas, túneles y hosts descubiertos).
- Una **guía estructurada paso a paso con barra de progreso** y explicaciones de por qué cada técnica importa en un pentest real.

---

## 📸 Capturas de Pantalla

### 🖥️ Vista General del Laboratorio en Acción
<p align="center">
  <img src="docs/screenshots/app-dashboard.svg" alt="Panel Principal de Ghost Pivot Lab" width="100%">
</p>

### 🗺️ Arquitectura de Red y Métodos de Pivoting Simulados
<p align="center">
  <img src="docs/screenshots/topology-detail.svg" alt="Diagrama de Topología y Métodos de Pivoting" width="100%">
</p>

---

## ⚡ Características Principales

### 1. 🧭 Topología de Red Dinámica y Reactiva
- **Doble tarjeta de red (Dual-NIC)**: Representación visual clara de la máquina Pivot con interfaces en la red puente y en la red aislada (`10.10.10.0/24`).
- **Estados Visuales**: Indicadores de máquinas comprometidas (**PWNED**), puertos abiertos (SSH 22, HTTP 80, FTP 21, SMB 445), y túneles de retransmisión activados.
- **Túneles en tiempo real**: Líneas de enrutamiento que se iluminan al ejecutar `autoroute`, `portproxy` o `portfwd`.

### 2. 💻 Terminal Multitarea Profesional (Bash / Metasploit / Meterpreter)
- **Multi-Pestaña y Pantalla Dividida (Split View)**: Abre sesiones simultáneas de Bash (Kali), consola de Metasploit (`msfconsole`) y shells Meterpreter para trabajar en paralelo.
- **Persistencia en `localStorage`**: Todos los comandos introducidos se sincronizan automáticamente. Puedes navegar con <kbd>↑</kbd> y <kbd>↓</kbd> en el historial incluso tras recargar la página o cambiar de escenario.
- **Autocompletado Inteligente (<kbd>Tab</kbd>)**: Asistente de comandos contextual para agilizar la práctica.
- **Sintaxis y Flags Reales**: Soporte para comandos auténticos (`portfwd add -l 5000 -p 80 -r 10.10.10.5`, `run autoroute -s ...`, `post/windows/manage/portproxy`, `ssh -p 2222`, etc.).

### 3. 📡 Event Log en Tiempo Real
- Componente inferior con telemetría en vivo que registra:
  - 🟢 **Sesiones Establecidas**: Meterpreter y shells inversas.
  - 🔵 **Rutas Inyectadas**: Subredes agregadas a la tabla de enrutamiento interna.
  - 🟡 **Puertos Redirigidos**: Creación de relays locales y remotos.
  - 🟣 **Descubrimiento de Red**: IPs y MACs detectadas con escaneos ARP.
  - 🔴 **Compromiso de Objetivos**: Alertas visuales con efectos táctiles de pwned.
- Filtros por categoría y controles para limpiar eventos.

### 4. 📊 Guía de Escenario con Barra de Progreso
- **Porcentaje de Completitud**: Barra visual animada que calcula el progreso exacto según los objetivos superados.
- **Instrucciones Didácticas**: Objetivos ordenados, comandos recomendados y la relevancia práctica de cada paso.

### 5. 📋 Cheatsheet, Bloc de Notas & Reporte de Auditoría
- **Cheatsheet Modal**: Chuleta completa con comandos rápidos para Metasploit, SSH y Netsh Windows.
- **Bloc de Notas (Scratchpad)**: Área para apuntar credenciales y flags descubiertos, con autoguardado en `localStorage`.
- **Generador de Informe**: Exportación de resumen de auditoría en formato profesional.

---

## 🧪 Escenarios de Laboratorio Disponibles

| Escenario | Vector de Ataque | Herramientas Clave | Topología |
|:---|:---|:---|:---|
| **1. Portproxy en Windows Intermedio** | Ejecución de payload MSFvenom en un equipo Windows Dual-NIC y redirección nativa (`netsh`/`portproxy`) hacia un host Linux aislado por SSH. | `msfvenom`, `exploit/multi/handler`, `post/windows/manage/portproxy` | `192.168.1.0/24` ➔ `10.10.10.0/24` |
| **2. Route Add + Portfwd en Linux** | Pivoting nativo de Metasploit a través de una máquina Ubuntu intermedia hasta un Metasploitable 2 aislado (HTTP/FTP). | `route add`, `portfwd add -l -p -r` | `192.168.1.0/24` ➔ `10.10.10.0/24` |
| **3. EternalBlue + ARP Scanner** | Doble explotación MS17-010: compromiso del intermedio, `autoroute`, descubrimiento sigiloso con `arp_scanner` y segundo pivote vía `portproxy` hasta el objetivo final. | `exploit/windows/smb/ms17_010_eternalblue`, `post/multi/manage/autoroute`, `post/windows/gather/arp_scanner`, `post/windows/manage/portproxy` | `192.168.1.0/24` ➔ `10.10.10.0/24` |

---

## ⌨️ Tabla de Comandos Más Usados en el Simulador

### Metasploit & Meterpreter
```bash
# Ver información de interfaces y arquitectura
meterpreter > sysinfo
meterpreter > ipconfig

# Añadir ruta hacia la red interna aislada
meterpreter > run autoroute -s 10.10.10.0/24
msf6 > route print

# Redirigir puerto local 5000 hacia el puerto 80 del objetivo interno
meterpreter > portfwd add -l 5000 -p 80 -r 10.10.10.5
meterpreter > portfwd list

# Enviar sesión a segundo plano
meterpreter > background
```

### Portproxy (Windows) & SSH Tunneling
```bash
# Redirección nativa de puerto en Windows vía módulo post de Metasploit
msf6 > use post/windows/manage/portproxy
msf6 > set CONNECT_ADDRESS 10.10.10.15
msf6 > set CONNECT_PORT 22
msf6 > set LOCAL_PORT 2222
msf6 > run

# Verificar el túnel desde Kali
kali$ ssh usuario_zorin@192.168.1.50 -p 2222

# Redirección de puerto nativa en Windows (Cmd Administrador)
C:\> netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=22 connectaddress=10.10.10.15
C:\> netsh interface portproxy show all
```

---

## 🚀 Puesta en Marcha (Instalación Local)

### Requisitos Previos
- [Node.js](https://nodejs.org/) v18.0 o superior
- [npm](https://www.npmjs.com/) v9.0 o superior

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/unfantasmaenelsistema/GhostPivotLab.git
   cd GhostPivotLab
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para comenzar a practicar.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

---

## 📁 Estructura del Proyecto

```text
├── .github/
│   └── workflows/
│       ├── ci.yml               # Integración continua (build y lint en GitHub Actions)
│       └── deploy.yml           # Despliegue a GitHub Pages
├── docs/
│   └── screenshots/
│       ├── banner.svg           # Banner de cabecera en alta resolución
│       ├── app-dashboard.svg    # Mockup completo de la interfaz del simulador
│       └── topology-detail.svg  # Diagrama de topología y vectores de pivoting
├── public/
│   └── icono.png                # Favicon y logotipo oficial
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Cabecera con logo y enlace a Un Fantasma En El Sistema
│   │   ├── NetworkTopology.tsx  # Lienzo interactivo de topología y subredes
│   │   ├── TerminalHub.tsx      # Terminal multi-pestaña, split screen y parser
│   │   ├── EventLog.tsx         # Telemetría de eventos en tiempo real
│   │   ├── ScenarioGuide.tsx    # Guía paso a paso y barra de progreso
│   │   ├── CheatsheetModal.tsx  # Chuleta rápida con sintaxis de comandos
│   │   ├── Scratchpad.tsx       # Bloc de notas persistente
│   │   └── AuditReportModal.tsx # Generador de informe de auditoría
│   ├── data/
│   │   └── scenarios.ts         # Datos de los escenarios y máquinas
│   ├── utils/
│   │   └── terminalParser.ts    # Motor de comandos y respuestas tácticas
│   ├── types/
│   │   └── index.ts             # Definiciones TypeScript de datos
│   ├── App.tsx                  # Componente principal y gestor de estado
│   └── main.tsx                 # Entrada React Vite
├── package.json                 # Dependencias y scripts del proyecto
├── tsconfig.json                # Configuración de TypeScript
└── vite.config.ts               # Configuración de compilación Vite
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas para expandir este simulador. Puedes consultar la [Guía de Contribución](CONTRIBUTING.md) para proponer nuevos escenarios, comandos adicionales o herramientas como `ligolo-ng` o `chisel`.

---

## 🌐 Autor y Agradecimientos

Creado con pasión para la comunidad de ciberseguridad por **Un Fantasma En El Sistema**, como herramienta complementaria del Módulo 15 (Redirección de puertos y túneles SSH) del curso **GhostOffensive** en [Ghost Academy](https://ghostacademy.unfantasmaenelsistema.com/).

- 🔗 **Sitio Web Oficial:** [https://www.unfantasmaenelsistema.com/](https://www.unfantasmaenelsistema.com/)
- 📖 **Artículos y Tutoriales:** Visita el blog para acceder a guías completas de pentesting y Red Team.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

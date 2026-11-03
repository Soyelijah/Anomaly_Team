# ANOMALY — Portal Oficial & Centro de Operaciones Táctico (Smash MU)

Portal web integral para el clan **Anomaly** en Smash MU (`smashmu.com`), diseñado con datos 100% reales extraídos de las APIs oficiales del servidor, sin ningún dato placeholder. Integra el Roster oficial de Anomaly, cruce con 5,000 jugadores en GearScore, visor de equipamiento real con 12 slots e ítems animados, radar de eventos, organizador de Castle Siege y el **Panel Personal de Miembro** con login interactivo para revisar ítems, asistencias y eventos.

---

### Decisiones e Integración de Datos Reales de Smash MU

> [!IMPORTANT]
> - **Nombre del Clan / Team**: `ANOMALY` en el reino `smash` de Smash MU.
> - **Líderes Reales Detectados**:
>   - **`UlmerMG`**: Guild Master oficial (Magic Gladiator, 105 Resets, 874 GearScore, armado con *Thunder Blade +2 Exc*, *Hurricane Armor Exc*, *Legendary Gloves +15 Exc*, *Wings of Magic*).
>   - **`UlmerDL`**: Vanguard / Asistente (Lord Emperor, 181 Resets, 935 GearScore, armado con *Battle Scepter +9 Legendario* con opción Harmony de daño de habilidad +12, *Adamantine Set Exc +9*, *Cloak of Death +9*, *Dark Raven*).
> - **Cero Datos Ficticios**: Se eliminaron por completo nombres de plantilla o ficticios. Todo personaje mostrado proviene del clan Anomaly o del cruce en vivo con la API oficial de Smash MU.
> - **Login y Panel Personal de Miembro ("Mi Panel")**:
>   - Acceso inmediato con 1 clic para miembros (`UlmerMG`, `UlmerDL` o cualquier personaje del roster).
>   - Inspección en vivo de los 12 slots de equipamiento con imágenes originales `.gif`, niveles (+0 a +15), Luck, Skill, Opciones Excellent y Opciones Harmony.
>   - Marcador interactivo de asistencia para Castle Siege (Confirmado, Pendiente, Ausente) que sincroniza con el roster global.
>   - Radar de eventos con check-in personal y solicitud de suministros al alijo del clan.
> - **Cruce de APIs Oficiales de Smash MU**:
>   - `https://www.smashmu.com/api/guild-leagues`: Ligas actuales (`current[]`), tablas de posiciones (`standings[]`), integrantes (`roster[]`) e historial (`history[]`).
>   - `https://www.smashmu.com/api/ranking/gearscore?realm=smash&page=1&pageSize=5000`: 5,000 jugadores con GearScore y Guild cruzados con los personajes del roster.
>   - `https://www.smashmu.com/api/profile/{name}?realm=smash`: Inspección de ítems y estadísticas de personaje.

---

## 1. Concepto y Arquitectura de Experiencia

### Audiencia & Propósito
- **Público externo / Visitantes del Servidor**: Descubrir la trayectoria de **Anomaly**, sus líderes, alineación estelar, alianzas, logros de asedio y formulario de postulación al clan.
- **Miembros & Guild Masters**: Coordinar parties para Castle Siege, monitorear los horarios de eventos competitivos, revisar las builds del equipo, consultar cuentas de buff compartidas y sincronizar las estadísticas directamente desde la API oficial de Smash MU.

---

## 2. Experiencia de Usuario & Diseño Visual

### Identidad Visual "Anomaly Cosmos & Dark Obsidian"
- **Paleta de Colores**:
  - *Lienzo Base (60%)*: Obsidiana profunda (`#060911` y `#0b0f19`) con sutil textura de malla metálica de fantasía oscura.
  - *Estructuras & Superficies (30%)*: Contenedores pulidos en grafito oscuro (`#111827` / `#161f33`) con líneas de división ultrafinas (`border-slate-800`).
  - *Acentos Tácticos (10%)*: 
    - Púrpura Anomaly (`#8b5cf6` / `#a855f7`) para identidad de clan y roles maestros.
    - Oro Forja (`#f59e0b` / `#fbbf24`) para resets, coronas de asedio y liderazgo.
    - Cian Glacial (`#06b6d4`) para temporizadores de eventos, telemetría y magia.
    - Rojo Sangre (`#ef4444`) para combate, Blade Knights y frontline.
- **Tipografía**:
  - Títulos de exhibición con carácter y peso definido (`Plus Jakarta Sans` / `Outfit`), evitando mayúsculas saturadas artificiales.
  - Cifras, contadores regresivos, resets y atributos estrictamente alineados con números tabulares (`font-mono tabular-nums`).
- **Navegación Limpia (Top Bar Contract de 3 Zonas)**:
  - **Zona 1**: Identidad del clan `ANOMALY` con escudo de armas y servidor de origen.
  - **Zona 2**: Pestañas funcionales de una sola línea: `Vista Pública`, `Roster & Ranking`, `Eventos en Vivo`, `Castle Siege`, `Cuentas & Vault`, `Calculadora de Builds`.
  - **Zona 3**: Estado de autenticación / botón de acceso de miembros (`Modo Táctico`).

---

## 3. Diagrama de Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PORTAL CLAN ANOMALY                             │
├───────────────────────────────────┬────────────────────────────────────┤
│         VISTA PÚBLICA             │        PANEL DE OPERACIONES        │
│  - Hero del Clan & Trayectoria    │  - Sincronizador API Smash MU      │
│  - Salón de Logros & Castle Siege │  - Editor de Roster & Builds       │
│  - Requisitos & Reclutamiento     │  - Planificador de Castle Siege    │
│  - Alianzas & Rivals              │  - Bóveda de Cuentas Compartidas   │
└─────────────────┬─────────────────┴─────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      RADAR DE EVENTOS EN VIVO     │ │   CALCULADORA DE ATRIBUTOS       │
│  - Reloj del Servidor GMT         │ │  - BK / SM / ELF / DL / MG / SUM │
│  - Blood Castle / Devil Square    │ │  - Distribución de Fuerza/Agi/   │
│  - Cuenta regresiva automática    │ │    Vit/Ene/Comando por Resets    │
└─────────────────┬─────────────────┘ └──────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│     FUENTE DE DATOS: API Smash MU (`/api/rankings`) + LocalStorage     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Componentes y Funcionalidades

1. **Barra de Navegación & Control de Modo**:
   - Selector entre Vista Pública y Panel de Operaciones.
   - Indicador de sincronización en vivo con botón para refrescar datos.
   - Acceso de seguridad para administradores y oficiales (desbloquea edición de notas, asignación de squads y gestión de cuentas).

2. **Módulo 1: Vista Pública del Clan Anomaly**:
   - Presentación de honor del clan: Guild Master, estadísticas agregadas (miembros, poder de asedio, promedio de resets).
   - Sala de Trofeos: Victorias en Castle Siege, control del Valle de Loren y récords.
   - Formulario interactivo de Reclutamiento con previsualización de solicitud en Discord/WhatsApp.

3. **Módulo 2: Radar de Eventos y Horarios del Servidor**:
   - Reloj del servidor sincronizado con hora oficial de juego.
   - Tarjetas de eventos con temporizador regresivo dinámico que cambia de estado al activarse (Abierto, Próximo, Finalizado).
   - Eventos cubiertos: Blood Castle (cada 2h), Devil Square (cada 2h), Chaos Castle (cada 4h), Invasión Dorada (cada 3h), Maya & Nightmare, Crywolf e información del próximo Castle Siege con fecha y cuenta regresiva semanal.

4. **Módulo 3: Roster Dinámico & Estadísticas en Vivo**:
   - Tabla interactiva completa con filtros por clase (BK, SM, ELF, DL, MG, SUM), búsqueda por nombre de jugador, ordenamiento por Resets, Nivel y Estado.
   - Fusión inteligente de datos: extrae nivel y resets de `smash-mu-nu.vercel.app/api/rankings`, combinándolos con las builds y notas privadas del equipo.
   - Modal de edición individual de miembros y formulario para agregar personajes manualmente.

5. **Módulo 4: Estrategia de Castle Siege & Asistencia**:
   - Tablero táctico interactivo con 3 escuadrones de asedio:
     - *Frontline / Rompelíneas*: Tanques BK y MG de alto impacto físico.
     - *Soporte & Bendiciones*: Muse Elfs de energía, Soul Masters con teleportación defensiva y Summoners de control.
     - *Pedestal / Sello*: Dark Lords de vitalidad y liderazgo para captura de la corona y activación de interruptores.
   - Función de auto-organización por clase y control de asistencia (Confirmado, En Duda, Ausente).

6. **Módulo 5: Cuentas Compartidas y Personajes de Apoyo**:
   - Registro seguro de personajes utilitarios del clan (buffer elfs de guild, DL summoners, baúles comunitarios con suministros de potas de vida, signos del lord y joyas).
   - Estado de disponibilidad para miembros autorizados.

7. **Módulo 6: Calculadora de Puntos & Simulador de Builds**:
   - Simulador de stats por clase según la cantidad de resets y nivel.
   - Distribución visual de Fuerza, Agilidad, Vitalidad, Energía y Comando con cálculo de vida estimada, daño y velocidad de ataque recomendada.

---

## 5. Plan de Ejecución Paso a Paso

1. **Configuración de Metadatos y Estilos**:
   - Actualizar `metadata.json` con el nombre oficial del clan (`ANOMALY - Portal de Clan MU Online`).
   - Sincronizar `index.html` con título, metadatos y fuentes tipográficas optimizadas.

2. **Desarrollo del Core React (`src/App.tsx` y subcomponentes)**:
   - Implementar el estado global persistente (LocalStorage con datos precargados del clan Anomaly).
   - Desarrollar la integración con la API de Smash MU (`https://smash-mu-nu.vercel.app/api/rankings`) con manejo de errores y simulación fluida en caso de restricciones de CORS.
   - Construir los componentes:
     - `Navigation`: Encabezado unificado de 3 zonas con autenticación de oficial.
     - `PublicView`: Vista comunitaria, logros y formulario de ingreso.
     - `EventsRadar`: Reloj global del servidor y temporizadores regresivos en tiempo real.
     - `RosterTable`: Nómina interactiva con filtros, tags de clase e indicadores numéricos tabulares.
     - `SiegePlanner`: Asignador visual de escuadrones de asedio con asistencia.
     - `GuildAccounts`: Bóveda de cuentas secundarias y alijos comunes.
     - `BuildCalculator`: Optimizador de atributos por clase y cantidad de resets.

3. **Verificación & Calidad**:
   - Ejecutar `compile_applet` para garantizar cero errores de TypeScript y compilación perfecta en Vite.
   - Comprobar que ningún texto de placeholder o guía genérica quede en la aplicación.

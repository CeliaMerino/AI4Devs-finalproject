## Índice

0. [Ficha del proyecto](#0-ficha-del-proyecto)
1. [Descripción general del producto](#1-descripción-general-del-producto)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Especificación de la API](#4-especificación-de-la-api)
5. [Historias de usuario](#5-historias-de-usuario)
6. [Tickets de trabajo](#6-tickets-de-trabajo)
7. [Pull requests](#7-pull-requests)

---

## 0. Ficha del proyecto

### **0.1. Tu nombre completo:**
Celia Merino Valladolid

### **0.2. Nombre del proyecto:**

### **0.3. Descripción breve del proyecto:**

### **0.4. URL del proyecto:**

> Puede ser pública o privada, en cuyo caso deberás compartir los accesos de manera segura. Puedes enviarlos a [alvaro@lidr.co](mailto:alvaro@lidr.co) usando algún servicio como [onetimesecret](https://onetimesecret.com/).

### 0.5. URL o archivo comprimido del repositorio

> Puedes tenerlo alojado en público o en privado, en cuyo caso deberás compartir los accesos de manera segura. Puedes enviarlos a [alvaro@lidr.co](mailto:alvaro@lidr.co) usando algún servicio como [onetimesecret](https://onetimesecret.com/). También puedes compartir por correo un archivo zip con el contenido


---

## 1. Descripción general del producto

**Reading Analytics Platform** es una aplicación web orientada a escritorio (desktop-first) para lectoras intensivas que quieren registrar lecturas y obtener estadísticas avanzadas de forma visual, sencilla y automatizada. Sustituye el uso de Excel como herramienta de seguimiento, elimina fórmulas manuales y reduce la entrada repetitiva de datos. El foco es la **analítica de libros leídos**: no es una red social, sino un espacio personal con dashboards, comparativas y objetivos.

### **1.1. Objetivo:**

**Propósito:** permitir que lectoras orientadas a datos registren lecturas con poca fricción, gestionen TBR mensuales, analicen métricas mensuales y anuales, sigan una meta anual, exporten visuales atractivos y descubran patrones en sus hábitos.

**Valor y problema que resuelve:** centraliza el tracking lector y la analítica en un solo producto, con captura de metadatos automatizada (frente a hojas de cálculo) y estadísticas pensadas para quienes ya disfrutan analizando patrones.

**Para quién:** lectoras que leen varios libros al mes y suelen usar Excel o Notion; como caso secundario, perfiles que quieren wrap-ups y estadísticas visuales para contenido (por ejemplo Instagram o TikTok).

### **1.2. Características y funcionalidades principales:**

- **Registro y seguimiento de lecturas:** añadir libros con búsqueda que enriquece metadatos (con fallback entre fuentes: Open Library, Google Books, Goodreads y entrada manual); progreso por página o porcentaje; lecturas simultáneas.
- **Home:** vista con libros en curso, progreso, meta anual, KPIs del mes y TBR actual.
- **Book Tracker:** tabla visual, filtros, búsqueda interna, edición y altas.
- **Reading Stats:** dashboards, gráficos, comparativas e insights.
- **Listas y TBR:** TBR mensual, listas personalizadas, favoritos y retos; apoyo a flujos tipo drag and drop (según diseño).
- **Goals:** meta anual, forecast y evolución.
- **Biblioteca (Library):** histórico completo con búsqueda avanzada y filtros (autora, género, trope, saga, año, formato, rating, etc.).
- **Recap / Insights:** resúmenes mensuales y anuales; exportación.
- **Import / Export:** Excel, CSV, export de Goodreads; export en PNG, PDF y formato story 9:16.
- **Tags personalizados:** etiquetas propias (por ejemplo géneros de nicho o book club).
- **Perfil y ajustes:** preferencias, temas visuales, fuentes de datos y objetivos.

**Prioridades de producto (referencia PRD):** MVP centrado en alta automática de libros, listas TBR, meta anual e insights automáticos; en evolución, comparativas, export story, búsqueda avanzada y tags.

### **1.3. Diseño y experiencia de usuario:**

**Estilo:** línea visual *soft feminine / coquette*: elegante, suave, cálida y limpia, más cercana a una app de journaling o *reading planner* que a un SaaS corporativo.

**Navegación:** barra lateral fija a la izquierda que da acceso a Home, Book Tracker, Reading Stats, Listas, Goals, Library, Recap/Insights, Import/Export y Perfil/Ajustes.

**Principios de interfaz:** tarjetas con bordes redondeados, tipografía editorial, dashboards y gráficos claros, microinteracciones y edición inline, modales y filtros persistentes donde aplique.

**Paleta (referencia):** Veranda blue `#6BB1AD` (primarios y navegación), Sky cloud `#A7BCBD` (secundarios), blanco `#FFFFFF` (fondo), Lychee `#ECECDB` (cards/modales), Melon `#E5A9A9` (highlights), Cupid pink `#E6748E` (KPIs y acentos).

**Accesibilidad:** cumplimiento orientado a la normativa española (Ley 11/2023, RD 193/2023) y estándar UNE-EN 301 549 alineado con WCAG 2.1/2.2 nivel AA.


### **1.4. Instrucciones de instalación:**

Stack previsto: **frontend** React y TypeScript; **backend** Node.js con NestJS; **base de datos** PostgreSQL. Los pasos concretos (`package.json`, scripts, migraciones y semillas) dependerán del repositorio cuando el código esté en el árbol; como guía típica en local:

1. **Requisitos:** Node.js (LTS), npm o pnpm, PostgreSQL instalado o vía Docker, y Git.
2. **Base de datos:** crear una base y un usuario; configurar la URL en un archivo `.env` del backend (por ejemplo `DATABASE_URL` o variables que use TypeORM/Prisma según se elija).
3. **Backend:** clonar el repositorio, entrar en la carpeta del API, instalar dependencias, ejecutar migraciones y, si existen, semillas (`npm install`, `npm run migration:run`, `npm run seed`, u homólogos).
4. **Frontend:** en la carpeta del cliente, instalar dependencias y arrancar en desarrollo (`npm install`, `npm run dev` o `npm start`), apuntando la URL del API en variables de entorno (por ejemplo `VITE_*` o `REACT_APP_*`).
5. **Servicios externos (opcional):** claves para Open Library / Google Books si el backend las requiere para cuotas o configuración.

---

## 2. Arquitectura del Sistema

### **2.1. Diagrama de arquitectura:**
> Usa el formato que consideres más adecuado para representar los componentes principales de la aplicación y las tecnologías utilizadas. Explica si sigue algún patrón predefinido, justifica por qué se ha elegido esta arquitectura, y destaca los beneficios principales que aportan al proyecto y justifican su uso, así como sacrificios o déficits que implica.


### **2.2. Descripción de componentes principales:**

> Describe los componentes más importantes, incluyendo la tecnología utilizada

### **2.3. Descripción de alto nivel del proyecto y estructura de ficheros**

> Representa la estructura del proyecto y explica brevemente el propósito de las carpetas principales, así como si obedece a algún patrón o arquitectura específica.

### **2.4. Infraestructura y despliegue**

> Detalla la infraestructura del proyecto, incluyendo un diagrama en el formato que creas conveniente, y explica el proceso de despliegue que se sigue

### **2.5. Seguridad**

> Enumera y describe las prácticas de seguridad principales que se han implementado en el proyecto, añadiendo ejemplos si procede

### **2.6. Tests**

> Describe brevemente algunos de los tests realizados

---

## 3. Modelo de Datos

### **3.1. Diagrama del modelo de datos:**

> Recomendamos usar mermaid para el modelo de datos, y utilizar todos los parámetros que permite la sintaxis para dar el máximo detalle, por ejemplo las claves primarias y foráneas.


### **3.2. Descripción de entidades principales:**

> Recuerda incluir el máximo detalle de cada entidad, como el nombre y tipo de cada atributo, descripción breve si procede, claves primarias y foráneas, relaciones y tipo de relación, restricciones (unique, not null…), etc.

---

## 4. Especificación de la API

> Si tu backend se comunica a través de API, describe los endpoints principales (máximo 3) en formato OpenAPI. Opcionalmente puedes añadir un ejemplo de petición y de respuesta para mayor claridad

---

## 5. Historias de Usuario

Las historias de usuario del **Reading Analytics Platform** están redactadas en formato **Como / Quiero / Para**, con **criterios de aceptación en estilo BDD** (Dado–Cuando–Entonces), **estimación** (S/M/L) y **revisión INVEST**, alineadas con el [PRD](PRD.md) y con los casos de uso técnicos de [`documents/use-cases.md`](documents/use-cases.md).

**Documento fuente:** el listado completo (cinco historias) vive en [`documents/user-stories.md`](documents/user-stories.md).

A continuación se documentan **tres historias principales** del MVP: alta de libros con metadatos automáticos, organización mensual mediante TBR y seguimiento del objetivo anual.

### Historia de usuario 1 · Añadir libro mediante búsqueda automática

| Campo | Contenido |
| --- | --- |
| **ID / nombre** | User Story 1 — Añadir libro con autocompletado y selección de edición |
| **Módulo** | Book Tracker |
| **Prioridad** | MVP (crítico para activación y sustitución de Excel) |

**Historia**

| Rol | Necesidad | Beneficio |
| --- | --- | --- |
| Como **lectora orientada a datos** | quiero **buscar un libro por título o autora y añadirlo automáticamente a mi tracker** | para **evitar introducir manualmente todos los datos**. |

**Criterios de aceptación (resumen BDD)**

- Desde *Book Tracker*, al pulsar **«Añadir libro»**, se abre un modal con buscador por título o autora.
- Si hay varias ediciones, la usuaria puede elegir la edición concreta.
- Tras confirmar, el libro aparece en el tracker con portada, autora, páginas y género.

**Estimación:** M · **INVEST:** independiente respecto a estadísticas y listas; negociable (fuente de datos); alto valor; estimable y acotado a sprint; testable con BDD.

---

### Historia de usuario 2 · Gestión de TBR mensual

| Campo | Contenido |
| --- | --- |
| **ID / nombre** | User Story 2 — Crear y gestionar TBR mensual automático |
| **Módulo** | Lists |
| **Prioridad** | MVP (organización lectora recurrente) |

**Historia**

| Rol | Necesidad | Beneficio |
| --- | --- | --- |
| Como **lectora frecuente** | quiero **tener una lista TBR mensual creada automáticamente** | para **organizar qué libros quiero leer cada mes**. |

**Criterios de aceptación (resumen BDD)**

- Al entrar en *Lists*, existe una lista TBR del mes creada automáticamente (convención de nombre según producto, p. ej. «TBR [mes]»).
- Si la lista está vacía, el sistema invita a añadir libros.
- Al marcar un libro del TBR del mes como **leído**, se marca como completado en la checklist del TBR.

**Estimación:** M · **INVEST:** acotada al modelo de listas; copy negociable; caso core; reglas claras y estados verificables.

---

### Historia de usuario 3 · Meta anual de lectura

| Campo | Contenido |
| --- | --- |
| **ID / nombre** | User Story 3 — Definir y visualizar objetivo anual |
| **Módulo** | Goals / Home |
| **Prioridad** | MVP (retención y sensación de progreso) |

**Historia**

| Rol | Necesidad | Beneficio |
| --- | --- | --- |
| Como **lectora que sigue su progreso** | quiero **establecer una meta anual de libros** | para **medir si voy cumpliendo mi objetivo lector**. |

**Criterios de aceptación (resumen BDD)**

- Desde Home (o flujo equivalente), la meta anual se guarda correctamente.
- La card de objetivo muestra progreso numérico (p. ej. «20 / 50») y el porcentaje.
- Con datos suficientes del año, se muestra una **predicción de cumplimiento** coherente con el ritmo actual.

**Estimación:** S · **INVEST:** apoyada en el conteo de lecturas; forecast evolucionable; alta relevancia para retención; cálculo determinista y testable.

---

### Más historias en el repositorio

En [`documents/user-stories.md`](documents/user-stories.md) están además, con el mismo nivel de detalle (escenarios BDD completos y tablas INVEST):

- **User Story 4** — Visualización de estadísticas mensuales (*Reading Stats*, estimación L).
- **User Story 5** — Insights automáticos (generación de mensajes analíticos sobre el periodo, estimación M).

---

## 6. Tickets de Trabajo

> Documenta 3 de los tickets de trabajo principales del desarrollo, uno de backend, uno de frontend, y uno de bases de datos. Da todo el detalle requerido para desarrollar la tarea de inicio a fin teniendo en cuenta las buenas prácticas al respecto. 

**Ticket 1**

**Ticket 2**

**Ticket 3**

---

## 7. Pull Requests

> Documenta 3 de las Pull Requests realizadas durante la ejecución del proyecto

**Pull Request 1**

**Pull Request 2**

**Pull Request 3**


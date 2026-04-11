> Detalla en esta sección los prompts principales utilizados durante la creación del proyecto, que justifiquen el uso de asistentes de código en todas las fases del ciclo de vida del desarrollo. Esperamos un máximo de 3 por sección, principalmente los de creación inicial o  los de corrección o adición de funcionalidades que consideres más relevantes.
Puedes añadir adicionalmente la conversación completa como link o archivo adjunto si así lo consideras


## Índice

1. [Descripción general del producto](#1-descripción-general-del-producto)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Especificación de la API](#4-especificación-de-la-api)
5. [Historias de usuario](#5-historias-de-usuario)
6. [Tickets de trabajo](#6-tickets-de-trabajo)
7. [Pull requests](#7-pull-requests)

---

## 1. Descripción general del producto

**Prompt 1:**

Ayúdame a redactar un PRD en Markdown para una aplicación web **desktop-first** llamada *Reading Analytics Platform*: usuarias son lectoras intensivas que hoy usan Excel para trackear libros; el producto debe centrarse en **analítica** (dashboards, metas, TBR, wrap-ups), no en red social. Incluye objetivos funcionales, de experiencia y de negocio sin monetización en esta fase. Idioma del documento: español.
Documentación actual del proyecto:

Estilo visual:
Paleta de colores:
- veranda blue: #6BB1AD
- Sky cloud: #A7BCBD
- Lychee #ECECDB
- Melon: #E5A9A9
- Cupid pink: #E6748E
Los colores deberemos asignarlos a diferentes elementos visuales de forma coherente y cohesiva. Importante tener en cuenta el contraste entre los diferentes colores de forma que se cumplan los estándares de accesibilidad
Nnormativa de accesibilidad web en España, impulsada por la Ley 11/2023 y el Real Decreto 193/2023: estándar UNE-EN 301 549 (WCAG 2.1/2.2 nivel AA) 

Pagina inicio
- te muestra los libros que estás leyendo en este momento
- debajo el nº de libros que llevas leídos este mes y el nº de páginas
- debajo la lista de “TBR de febrero” en modo checklist mostrando cuales han sido leidos y cuales quedan por leer

Página book Tracker
- se puede filtrar por años o mostrar todos los datos. Por defecto aparecen solo los del año actual.
- Arriba del todo hay un boton para añadir un nuevo libro. Esto abre un modal que pide al usuario los datos. Se buscará por titulo y/o autor/a y se busacrá el libro para recuperar los datos. Si existen varias ediciones se le permite al usuario elegir cuál está leyendo. Si no se encuentra el libro habrá una opción para añadir a mano los datos. Se puede marcar como ya leído, en cuyo caso pedirá fecha de inicio, fecha de fin y puntuación o como leyendo actualmente, de forma que la fecha de inicio se autocompleta a la fecha de hoy, la fecha de fin queda vacía y la puntuacion también.
- vista tipo “excel”, de todos los libros. Cada fila representa un libro y tiene:
    - titulo
    - autor
    - imagen de portada
    - genero
    - etiquetas (subgeneros, tropes…)
    - formato leído (físico, audio, ebook)
    - audiencia (Young Adult, New Adult, Adult)
    - puntuación (si se ha puntuado por el usuario)
    - fecha inicio
    - fecha fin
- cada fila tiene un lápiz al final que al hacer click se abre un modal para editar los datos del libro

Página my reading stats
- se puede filtrar por años o mostrar todos los datos. Por defecto aparecen solo los del año actual
- vista con gráficos que representan los datos de los libros
    - generos: grafico tipo “quesito” de los géneros de los libros leídos
    - formato: grafico tipo “quesito” de los formatos de los libros leídos
    - audiencia: grafico tipo “quesito” de la audiencia de los libros leídos
    - puntuaciones: grafico tipo “quesito” de las puntuaciones dadas a los libros leídos
    - año en libros: gráfico de barras, eje Y es el número de libros y el eje X el mes. 
        - si estamos en vista global, en el eje X en vez de mes se representa el año
    - año en páginas: igual que el anterior pero de nº de páginas

Página listas
- permite al usuario crear listas de libros 
- con un mes de antelación (es decir, el 1 de enero se crea la de febrero) por defecto se crea una lista para cada mes del año llamada “TBR enero/febrero etc dependiendo del mes”
    - si esta lista esta vacia anima al usuario a incluir que libros querrá leer ese mes
- la lista del TBR del mes en curso se ve la primera y debajo la del mes siguiente. El resto de meses a pasado y futuro están ocultas, un boton permite mostrarlas
- debajo esta la funcionalidad para crear mas listas, se permite al usuario cambiar el nombre y añadir o eliminar libros en cualquier momento de cualquier lista

**Prompt 2:**

A partir del PRD, genera el apartado de **características principales** para el README: lista con viñetas (Book Tracker, Reading Stats, TBR, Goals, Library, import/export, etc.) y enlázalo con prioridades MVP vs evolución.

**Prompt 3:**

Define en el README la sección **1.3 Diseño y experiencia de usuario**: navegación por sidebar alineada con el PRD, principios de interfaz (tarjetas, tipografía editorial, accesibilidad orientada a WCAG 2.1 AA y normativa española de accesibilidad). Sé concreto pero sin inventar pantallas que contradigan el PRD.

---

## 2. Arquitectura del Sistema
**Prompt 1:**
Para la Reading Analytics Platform (React + NestJS + PostgreSQL, aplicación 
desktop-first sin app móvil nativa, sin red social, con cumplimiento WCAG 
2.1/2.2 AA y normativa española Ley 11/2023), documenta en tres bloques:

BLOQUE 1 — Infraestructura y despliegue:
- Propón una infraestructura cloud sencilla y adecuada al tamaño del proyecto 
  (una sola fundadora, fase MVP).
- Genera un diagrama Mermaid del pipeline de despliegue (desde push en git 
  hasta producción).
- Describe el proceso paso a paso.

BLOQUE 2 — Seguridad:
- Lista las prácticas de seguridad esenciales para este tipo de aplicación 
  (autenticación, autorización, protección de datos personales de lectura, 
  CORS, rate limiting en llamadas a APIs externas, validación de imports CSV).
- Para cada práctica, añade una línea de ejemplo concreto o referencia 
  a un módulo del sistema.

BLOQUE 3 — Tests:
- Propón la estrategia de testing adecuada al stack (Jest para backend, 
  Vitest o Jest + Testing Library para frontend, Cypress o Playwright para E2E).
- Describe 4-5 tests representativos: al menos uno por capa (unitario de 
  servicio, integración de API, componente UI, E2E de flujo crítico).
- Prioriza los flujos más críticos según el PRD: alta de libro (UC-01), 
  cambio de estado (UC-02) y cálculo de estadísticas (UC-07).

El resultado debe poder copiarse directamente en el README, sin placeholders.

---

**Prompt 2:**
Para la Reading Analytics Platform (React + NestJS + PostgreSQL, aplicación 
desktop-first sin app móvil nativa, sin red social, con cumplimiento WCAG 
2.1/2.2 AA y normativa española Ley 11/2023), documenta en tres bloques:

BLOQUE 1 — Infraestructura y despliegue:
- Propón una infraestructura cloud sencilla y adecuada al tamaño del proyecto 
  (una sola fundadora, fase MVP).
- Genera un diagrama Mermaid del pipeline de despliegue (desde push en git 
  hasta producción).
- Describe el proceso paso a paso.

BLOQUE 2 — Seguridad:
- Lista las prácticas de seguridad esenciales para este tipo de aplicación 
  (autenticación, autorización, protección de datos personales de lectura, 
  CORS, rate limiting en llamadas a APIs externas, validación de imports CSV).
- Para cada práctica, añade una línea de ejemplo concreto o referencia 
  a un módulo del sistema.

BLOQUE 3 — Tests:
- Propón la estrategia de testing adecuada al stack (Jest para backend, 
  Vitest o Jest + Testing Library para frontend, Cypress o Playwright para E2E).
- Describe 4-5 tests representativos: al menos uno por capa (unitario de 
  servicio, integración de API, componente UI, E2E de flujo crítico).
- Prioriza los flujos más críticos según el PRD: alta de libro (UC-01), 
  cambio de estado (UC-02) y cálculo de estadísticas (UC-07).

El resultado debe poder copiarse directamente en el README, sin placeholders.
---
### 3. Modelo de Datos

**Prompt 1:**
Eres un arquitecto de bases de datos senior. A partir del PRD, los casos de 
uso UC-01 a UC-10 y las historias de usuario adjuntas, diseña el modelo de 
datos completo para la Reading Analytics Platform.

Stack: PostgreSQL como base de datos relacional.

Entidades que debes cubrir obligatoriamente, inferidas de la documentación:
- Usuario / perfil (con preferencias y objetivos)
- Libro (metadatos: título, autora, ISBN, portada, páginas, género, fuente 
  de datos)
- Registro de lectura (estado: Leyendo / Leído / DNF / Pendiente; progreso; 
  rating; formato; fecha inicio / fin)
- Tag (etiquetas personalizadas por usuaria)
- Relación libro ↔ tag
- Lista TBR mensual (con mes/año, estado de cada entrada)
- Entrada TBR (libro + orden + completado)
- Meta anual (año, objetivo numérico)
- Sesión de lectura (página actual, timestamp, para histórico de progreso)

Genera un diagrama en sintaxis Mermaid (erDiagram) con el máximo detalle 
posible:
- Claves primarias (PK) y foráneas (FK) explícitas
- Tipos de dato de cada atributo (UUID, VARCHAR, INTEGER, DATE, etc.)
- Cardinalidad de todas las relaciones (||--o{, etc.)
- Restricciones relevantes indicadas como comentarios o en nombres de campo

El diagrama debe poder copiarse directamente en el README.md.

**Prompt 2:**
A partir del modelo de datos que acabas de generar (o del diagrama Mermaid 
adjunto) y de la documentación del proyecto —PRD, casos de uso y user 
stories—, documenta en detalle cada entidad del modelo.

Para cada entidad, genera una tabla con las siguientes columnas:
| Atributo | Tipo | Restricciones | Descripción |

Y debajo de la tabla, una sección breve con:
- Clave primaria y estrategia de generación (UUID v4, autoincremental…)
- Claves foráneas y entidad a la que referencian
- Relaciones y su tipo (1:1, 1:N, N:M)
- Índices recomendados para las consultas más frecuentes del producto

Entidades a documentar (en este orden):
1. User
2. Book
3. ReadingEntry (registro de lectura de una usuaria sobre un libro)
4. Tag y BookTag (tabla pivote)
5. MonthlyTBR y TBREntry
6. AnnualGoal
7. ReadingSession (historial de progreso por página)

Condiciones:
- Los atributos deben ser coherentes con los flujos UC-01 a UC-10 
  (por ejemplo, ReadingEntry necesita: status, current_page, rating, 
  format, start_date, end_date).
- Indica qué campos son obligatorios (NOT NULL) y cuáles opcionales, 
  justificando brevemente los opcionales clave (por ejemplo, rating es 
  opcional porque UC-04 permite cerrar el modal sin puntuar).
- El resultado debe poder copiarse directamente en el README.md.
---

### 4. Especificación de la API

**Prompt 1:**
Basándote en el UC-01 de documents/use-cases.md, la entidad Book del modelo 
de datos de readme.md (sección 3.2) y el stack técnico definido en el PRD, 
genera la especificación OpenAPI 3.1 del endpoint POST /books.

Incluye DTO de request con validaciones, respuestas 201/400/401/409, y un 
ejemplo real de request y response body en JSON.
**Prompt 2:**
Basándote en los UC-02 y UC-03 de documents/use-cases.md y la entidad 
ReadingRecord (tabla reading_records) descrita en readme.md sección 3.2,
genera la especificación OpenAPI 3.1 del endpoint 
PATCH /books/{bookId}/reading-record.

Ten en cuenta las reglas de negocio del UC-02 (efectos al pasar a "leido") 
y las validaciones del UC-03 (current_page vs page_count). Incluye dos 
ejemplos de request/response: uno para actualizar página y otro para 
marcar como "leido".
**Prompt 3:**
Basándote en el UC-07 de documents/use-cases.md, los KPIs descritos en 
la User Story 4 de documents/user-stories.md y la arquitectura del 
StatsService en readme.md sección 2.2, genera la especificación OpenAPI 3.1 
del endpoint GET /stats.

El endpoint debe soportar los tres tipos de periodo del UC-07 (mes, año y 
rango personalizado). Usa schemas reutilizables para los objetos de 
distribución e incluye un ejemplo de request y response con los insights 
automáticos rellenos.

---

### 5. Historias de Usuario

**Prompt 1:**

Actúa como product owner (perfil técnico). A partir de **`documents/use-cases.md` · UC-01** (flujo principal: Book Tracker → «Añadir libro» → búsqueda por título o autora → Open Library como fuente principal → selección de edición → guardado en biblioteca → visibilidad en tracker con estado **Pendiente**) y del [PRD](PRD.md), redacta **solo la User Story 1** para el fichero **`documents/user-stories.md`**.

Requisitos del entregable (deben coincidir con lo ya publicado en el repo):

- Cabecera del documento si es la primera historia del fichero: título *User stories · Reading Analytics Platform*, versión 1.0, Owner Celia, fecha abril 2026.
- Bloque **User Story 1 · Añadir libro mediante búsqueda automática** con tabla de campo **Título** = «Añadir libro con autocompletado y selección de edición».
- Historia en formato **Como / quiero / para** con rol **lectora orientada a datos**.
- **Exactamente tres escenarios BDD** etiquetados «Escenario 1…3», con redacción equivalente a: (1) en *Book Tracker*, al pulsar «Añadir libro», modal con buscador por título o autora; (2) si hay varias ediciones, selección de la edición concreta; (3) tras confirmar, el libro aparece en el tracker con **portada, autora, páginas y género**.
- **Estimación:** M.
- Tabla **INVEST** con criterios Independent, Negotiable, Valuable, Estimable, Small, Testable y valoraciones alineadas al tono del documento (p. ej. fuente de datos negociable, alto valor).

**Importante:** no añadas en esta historia escenarios de **entrada manual** ni de error de APIs; esos flujos alternativos de UC-01 deben quedar **solo** en `use-cases.md`, no duplicados en la user story.

---

**Prompt 2:**

Usando **`documents/use-cases.md` · UC-05** solo como **comprobación de coherencia** (módulo Lists, completado automático al pasar a `Leído`), genera **la User Story 2 · Gestión de TBR mensual** para **`documents/user-stories.md`**.

El contenido debe reflejar fielmente el documento existente, sin exigir en la historia detalles que **no** aparecen en las user stories (por ejemplo **no** incluyas drag & drop ni la regla del «día anterior al mes» en los escenarios BDD de esta historia; eso vive en UC-05 para diseño técnico).

Incluye:

- Tabla con **Título** = «Crear y gestionar TBR mensual automático».
- Historia **Como lectora frecuente / quiero tener una lista TBR mensual creada automáticamente / para organizar qué libros quiero leer cada mes**.
- **Tres escenarios BDD** equivalentes a: (1) al comenzar un nuevo mes, al acceder a *Lists*, lista «TBR [mes siguiente]» ya creada; (2) si la lista está vacía, mensaje que anima a añadir libros; (3) al marcar un libro del TBR del mes como leído, se marca como completado en la checklist.
- **Estimación:** M y tabla **INVEST** (p. ej. dependencia solo del modelo de listas; copy negociable).

---

**Prompt 3:**

Genera en **`documents/user-stories.md`** las **User Stories 3, 4 y 5** y el **índice markdown** numerado con anclas a cada historia (como en el fichero del repositorio). Alineación obligatoria con **`documents/use-cases.md`**:

- **User Story 3 · Meta anual de lectura** (UC-06, Goals/Home): título «Definir y visualizar objetivo anual»; historia como **lectora que sigue su progreso**; tres escenarios: configurar meta desde Home (p. ej. 50 libros), card «20 / 50» y porcentaje, **predicción de cumplimiento** con datos suficientes; estimación **S**; INVEST.
- **User Story 4 · Visualización de estadísticas mensuales** (UC-07, Reading Stats): título «Consultar dashboard de estadísticas mensuales»; historia como **lectora apasionada por los datos**; tres escenarios: libros y **páginas** leídas en el mes en *Reading Stats*, **gráfico de distribución por géneros**, **cambio de filtro de mes** que actualiza gráficos; estimación **L**; INVEST (p. ej. complejidad alta pero clara).
- **User Story 5 · Insights automáticos** (UC-07 criterio «al menos 3 insights»): título «Generación automática de insights de lectura»; historia como **lectora que disfruta analizando patrones**; tres escenarios: en *Reading Stats*, **al menos 3 insights**; si el mes actual supera al anterior, un insight con **incremento porcentual**; si un género domina, insight que lo **destaca como tendencia**; estimación **M**; INVEST.

Cierra el documento con la línea de cierre *Documento alineado con el PRD · Reading Analytics Platform*.

**Salida adicional:** prepara el texto para **`readme.md` sección 5**: párrafo introductorio (formato BDD, INVEST, enlace a PRD y `use-cases.md`), mención de que el listado completo de **cinco** historias está en `documents/user-stories.md`, y **resumen** de las historias 1–3 en tablas como en el README (sin contradecir el documento largo).

---

### 6. Tickets de Trabajo

**Prompt 1:**

Redacta un **ticket de trabajo backend** listo para pegar en **`readme.md` · sección 6 · Tickets de Trabajo** (Ticket 1). Debe describir de principio a fin la implementación en **NestJS** del **UC-01** según `documents/use-cases.md`: cliente a **Open Library API** como fuente principal, **fallback automático** a **Google Books** si no hay resultados o error, normalización de metadatos (portada, título, autora, género, páginas, ISBN), persistencia en **PostgreSQL** alineada con las entidades **`books`** y registro de lectura con estado inicial coherente con **UC-02** (`pendiente`), **aislamiento por `userId`**, DTOs con **class-validator**, tests **Jest + Supertest** del endpoint de alta (p. ej. `POST /books` o ruta equivalente descrita en el README §4).

Incluye: contexto, alcance fuera de alcance (no UI), criterios de aceptación verificables, definición de hecho, riesgos (cuotas APIs externas), dependencias (migraciones, contrato OpenAPI si aplica).

---

**Prompt 2:**

Redacta un **ticket de trabajo frontend** para **`readme.md` §6 · Ticket 2**: implementación en **React + TypeScript** de la **User Story 1** (`documents/user-stories.md`), consumiendo la API documentada en **README §4**.

Detalla: vista **Book Tracker**, botón **«Añadir libro»**, **modal** con campo de búsqueda por título o autora (**debounce**), lista de resultados con **metadatos visibles** (portada, título, autora, género, páginas, ISBN si viene del backend), flujo de **selección de edición** cuando hay varias coincidencias, confirmación y actualización optimista o invalidación de caché (**TanStack Query** u patrón equivalente del README §2.2), manejo de vacíos y errores de red sin contradecir UC-01 (mensajes genéricos si el backend agrega entrada manual en otra iteración).

Incluye: mocks o contrato de API a respetar, criterios de aceptación enlazados a los tres escenarios BDD de la US1, accesibilidad básica (foco en modal, etiquetas), definición de hecho.

---

**Prompt 3:**

Redacta un **ticket de trabajo de bases de datos** para **`readme.md` §6 · Ticket 3**: **PostgreSQL** + **TypeORM** (o el ORM indicado en el README), **solo** tablas y relaciones que ya figuran en **`readme.md` §3** (diagrama Mermaid y tablas de atributos).

Propón un alcance acotado al **MVP de UC-01 + UC-02**: migraciones que creen **`users`** (o reutilicen esquema auth existente), **`books`** con `user_id` FK, **`reading_records`** 1:1 con `book_id` PK/FK, restricciones `CHECK` de `status` (`leyendo|leido|dnf|pendiente`), índices por **`user_id`** en `books`, semilla o script de rollback, orden de migraciones y comprobaciones (`UNIQUE` email si aplica).

No inventes entidades extra (p. ej. TBR o goals) en este ticket si no son necesarias para cerrar UC-01; si las mencionas, márcalas como **fuera de alcance** o ticket futuro enlazado a UC-05/UC-06.

Incluye: criterios de aceptación (migración up/down, datos de prueba mínimos), riesgos (pérdida de datos en entornos compartidos), definición de hecho.

---

### 7. Pull Requests

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

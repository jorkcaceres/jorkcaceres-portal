-- Configuración privada y administrable del modelo de decisión del diagnóstico.
create table if not exists public.diagnostic_settings (
  id text primary key check (id = 'principal'),
  guidance_version text not null default '1.0.0'
    check (char_length(guidance_version) between 1 and 40),
  analysis_guide text not null default ''
    check (char_length(analysis_guide) <= 30000),
  response_guide text not null default ''
    check (char_length(response_guide) <= 12000),
  updated_at timestamptz not null default now()
);

insert into public.diagnostic_settings (id, guidance_version, analysis_guide, response_guide)
values (
  'principal',
  '1.0.0',
  $jcguide$
# Modelo de Madurez Digital Jorkcáceres

## 1. Propósito

El Modelo de Madurez Digital Jorkcáceres busca identificar cómo una persona, emprendimiento o empresa utiliza prácticas, información y herramientas digitales para gestionar su negocio.

El diagnóstico debe:

- Adaptarse al contexto del negocio sin cambiar las reglas de evaluación.
- Analizar prácticas actuales, no solamente herramientas adquiridas.
- Diferenciar ausencia de una práctica, falta de información y baja confianza.
- Entregar un perfil por dimensiones, no solo una calificación general.
- Proponer acciones realistas para avanzar al siguiente nivel.
- Mantener resultados comparables entre evaluaciones realizadas con la misma versión del modelo.

Mientras no haya sido validado con una muestra diversa de negocios, debe presentarse como una **autoevaluación orientativa**, no como una auditoría o certificación.

---

## 2. Fundamentos metodológicos

El modelo combina elementos de diferentes marcos reconocidos:

- El instrumento europeo de madurez digital para pymes evalúa estrategia, preparación digital, personas, datos, automatización y sostenibilidad. Su construcción incluyó revisión de otros instrumentos y pruebas con pymes. [European Digital Innovation Hubs – Digital Maturity Assessment](https://european-digital-innovation-hubs.ec.europa.eu/dma-tool)
- El Chequeo Digital del BID fue diseñado para mipymes latinoamericanas y considera estrategia, canales, personas, procesos, tecnologías y datos. [BID – Chequeo Digital](https://publications.iadb.org/es/chequeo-digital-como-acelerar-la-transformacion-digital-de-las-mipyme-en-america-latina-y-el-caribe)
- Los niveles 0 a 5 se inspiran en la progresión de capacidad de CMMI: incompleto, inicial, gestionado, definido, medido y optimizado. [CMMI Institute – Maturity Levels](https://dev.cmmiinstitute.com/learning/appraisals/levels)
- La construcción, ponderación y validación de los resultados debe seguir principios de indicadores compuestos: marco conceptual, normalización, sensibilidad de las ponderaciones y comprobación de robustez. [OECD/JRC – Handbook on Constructing Composite Indicators](https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html)
- La dimensión de cuidado digital incorpora principios de gobernanza, protección, detección, respuesta y recuperación del NIST, además de continuidad del negocio. [NIST Cybersecurity Framework 2.0](https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20) e [ISO 22301](https://www.iso.org/standard/75106.html)

Estos marcos sirven como fundamento, pero el instrumento deberá validarse específicamente con emprendedores y empresas de Colombia y Latinoamérica.

---

## 3. Arquitectura del modelo

El diagnóstico debe separar seis procesos:

1. **Conversación:** formula preguntas en lenguaje natural.
2. **Extracción:** identifica hechos y evidencias dentro de todas las respuestas.
3. **Validación:** detecta información faltante, ambigua o contradictoria.
4. **Puntuación:** aplica una rúbrica fija a las evidencias.
5. **Priorización:** selecciona las oportunidades de mejora más valiosas.
6. **Redacción:** convierte el resultado en un informe claro y breve.

El componente que redacta el informe no debe cambiar las puntuaciones calculadas.

---

## 4. Contexto del negocio

Antes de evaluar la madurez se debe conocer:

- Tamaño: independiente, emprendimiento, microempresa, pequeña o mediana empresa.
- Sector o actividad.
- Antigüedad del negocio.
- Número aproximado de personas.
- Tipo de cliente: personas, empresas o ambos.
- Dependencia de herramientas digitales.
- Rol de quien responde.
- Principal prioridad actual.

El contexto adapta los ejemplos y las recomendaciones, pero no modifica el significado de los niveles.

Un emprendedor individual no debe perder puntos por no tener un equipo. Él mismo puede ser el responsable de una práctica. Del mismo modo, una hoja de cálculo puede soportar una práctica madura si es confiable, está actualizada y se utiliza consistentemente.

---

## 5. Dimensiones y prácticas evaluadas

Cada dimensión contiene dos prácticas. En total se califican doce prácticas independientes.

| Dimensión | Práctica 1 | Práctica 2 |
|---|---|---|
| Dirección y prioridades | Definición y alineación de prioridades | Seguimiento de mejoras y resultados |
| Presencia y captación | Canales, propuesta y facilidad de contacto | Registro y medición del origen de oportunidades |
| Clientes y fidelización | Seguimiento de oportunidades y pendientes | Satisfacción, posventa y aprendizaje del cliente |
| Operación y herramientas | Procesos, registros y control operativo | Integración, automatización y reducción de errores |
| Datos y decisiones | Calidad, consistencia y disponibilidad de datos | Indicadores, revisiones y decisiones |
| Personas y cuidado digital | Aprendizaje, documentación y conocimiento | Accesos, copias, recuperación y continuidad |

La tecnología utilizada es una evidencia, pero no constituye por sí sola una práctica madura.

---

## 6. Escala de madurez de 0 a 5

Cada una de las doce prácticas recibe inicialmente un **número entero**.

### Nivel 0 — No establecido

Se asigna cuando:

- La persona confirma que no realiza la práctica.
- No existe un proceso, registro o acción relacionada.
- La actividad necesaria nunca se ha considerado o realizado.

Ejemplo: “No registro de dónde llegan los clientes y nunca lo he revisado”.

No se debe asignar 0 solamente porque la respuesta no mencione el tema.

### Nivel 1 — Inicial o reactivo

La práctica existe de manera ocasional, informal o dependiente de la memoria.

Características:

- Se realiza cuando aparece una necesidad.
- Depende principalmente de una persona.
- No existe un método constante.
- Los registros son inexistentes o esporádicos.
- El resultado puede variar considerablemente.

Ejemplo: “Normalmente recuerdo por WhatsApp quién me contactó”.

### Nivel 2 — Repetible

La práctica se repite y cuenta con algún apoyo, pero todavía es inconsistente.

Características:

- Existe un registro, herramienta o forma habitual de trabajar.
- Se aplica a algunos casos, pero no a todos.
- La información puede estar fragmentada.
- La frecuencia o el responsable no están claramente definidos.
- Se producen olvidos, duplicaciones o diferencias entre casos.

Ejemplo: “Registro algunas oportunidades en una hoja, pero no siempre la actualizo”.

### Nivel 3 — Definido

La práctica cuenta con una forma estable y conocida de realizarse.

Características mínimas:

- Existe un procedimiento o criterio definido.
- Hay una fuente principal de información.
- Se conoce quién debe realizarlo, aunque sea el propio emprendedor.
- Existe una frecuencia o momento de ejecución.
- La práctica se aplica de manera consistente.

Ejemplo: “Toda oportunidad se registra en la misma hoja, con estado y próxima acción, desde el primer contacto”.

### Nivel 4 — Medido

Además de estar definida, la práctica se revisa mediante información confiable.

Características mínimas:

- Cumple todos los requisitos del nivel 3.
- Tiene uno o más indicadores o criterios de cumplimiento.
- Existe una frecuencia de revisión.
- Los resultados generan decisiones o correcciones.
- La calidad de la información permite comparar periodos.

Ejemplo: “Cada mes reviso oportunidades y conversiones por canal, y con esos resultados decido dónde concentrar el esfuerzo”.

### Nivel 5 — Optimizado

La práctica se mejora continuamente y existe evidencia de aprendizaje.

Características mínimas:

- Cumple todos los requisitos del nivel 4.
- Se han realizado mejoras a partir de resultados anteriores.
- Existe evidencia de dos o más ciclos de revisión y ajuste.
- La práctica puede continuar ante cambios o ausencias.
- Se integra o automatiza cuando esto genera valor.
- El negocio aprende de los resultados y ajusta metas o procesos.

Ejemplo: “Comparamos trimestralmente la conversión por canal, probamos cambios, medimos su resultado y mantenemos las mejoras que funcionan”.

La automatización no es obligatoria para alcanzar el nivel 5 si no aporta valor al contexto del negocio.

---

## 7. Reglas obligatorias de puntuación

1. **Evaluar prácticas actuales.** Las intenciones futuras no cuentan como madurez actual.

2. **No confundir herramientas con capacidad.** Tener CRM, inteligencia artificial o un tablero no aumenta automáticamente la calificación.

3. **Aceptar procesos manuales maduros.** Una práctica manual puede alcanzar un nivel alto si es consistente, medible, confiable y mejorada.

4. **Aplicar niveles acumulativos.** No se puede obtener nivel 4 sin cumplir primero las condiciones del nivel 3.

5. **No interpretar una omisión como ausencia.** Si no hay evidencia suficiente, la práctica queda como “información insuficiente”, no en nivel 0.

6. **Distinguir evidencia de opinión.** “Creo que funciona bien” tiene menos peso que un ejemplo, registro, indicador o frecuencia concreta.

7. **Separar intención y ejecución.** “Voy a comenzar a medirlo” no demuestra que actualmente se mida.

8. **Usar toda la conversación.** Una respuesta puede aportar evidencia para varias dimensiones, aunque la pregunta estuviera asociada a una sola.

9. **Priorizar la evidencia específica.** Ante una afirmación general y otra concreta, debe prevalecer la concreta.

10. **Resolver contradicciones.** Si una persona afirma que siempre registra las ventas, pero después dice que algunas quedan únicamente en WhatsApp, se debe aclarar o calificar según la práctica realmente demostrada.

11. **No castigar el tamaño del negocio.** Responsable puede significar persona, cargo o el mismo propietario.

12. **No premiar complejidad innecesaria.** Utilizar más herramientas no implica mayor madurez.

---

## 8. Evidencia que debe extraerse

Por cada respuesta, el sistema debe identificar:

- Práctica relacionada.
- Comportamiento actual.
- Frecuencia.
- Responsable o rol.
- Herramienta o fuente de información.
- Existencia de registros.
- Ejemplo concreto.
- Indicador utilizado.
- Decisión tomada.
- Problema o riesgo mencionado.
- Intención futura.
- Posible contradicción.
- Información faltante.
- Nivel de confianza de la evidencia.

Ejemplo estructurado:

```json
{
  "practica": "medicion_origen_oportunidades",
  "comportamiento_actual": "identifica el canal por conversación y memoria",
  "frecuencia": "sin frecuencia establecida",
  "registro": "no sistemático",
  "indicador": null,
  "decision_demostrada": null,
  "intencion_futura": "quiere centralizar el registro",
  "confianza": "alta",
  "nivel_propuesto": 1
}
```

Cada puntuación debe conservar la evidencia que la justifica.

---

## 9. Diferencia entre puntuación, cobertura y confianza

El resultado debe mostrar tres conceptos separados.

### Madurez

Indica el nivel alcanzado por la práctica.

### Cobertura

Indica cuántas prácticas pudieron evaluarse:

> Prácticas con información suficiente ÷ 12 × 100

Un resultado de 83 % de cobertura no significa 83 % de madurez.

### Confianza

Indica la solidez de la evidencia:

- **Alta:** respuesta concreta, consistente y con ejemplo o frecuencia.
- **Media:** práctica identificable, pero faltan detalles.
- **Baja:** respuesta ambigua, contradictoria o basada solamente en percepciones.

Si una práctica no puede evaluarse, debe mostrarse como **Información insuficiente**, no como cero.

---

## 10. Cálculo del resultado

- Cada práctica recibe un número entero entre 0 y 5.
- La puntuación de una dimensión es el promedio de sus dos prácticas.
- Por eso una dimensión puede tener resultados como 1,0; 1,5; 2,0 o 2,5.
- No se deben asignar medios puntos directamente a una práctica.
- Si una de las dos prácticas no tiene información suficiente, la dimensión queda pendiente de confirmación.
- Inicialmente todas las dimensiones deben tener el mismo peso.
- No deben introducirse ponderaciones diferentes hasta contar con evidencia de validación.

Se recomienda privilegiar el perfil de las seis dimensiones sobre una única calificación global. Si se presenta un resultado general, solo debe calcularse cuando exista cobertura suficiente en todas las dimensiones.

---

## 11. Diseño de la conversación

La conversación puede mantenerse corta y natural mediante seis preguntas integradoras:

1. **Dirección:** ¿Qué te gustaría mejorar primero y cómo decides quién lo hace y cuándo revisar si funcionó?
2. **Presencia:** Si alguien necesita lo que ofreces, ¿cómo te encuentra, cómo te contacta y cómo sabes si ese canal te trae clientes?
3. **Clientes:** Desde que alguien pregunta hasta después de comprar, ¿cómo recuerdas los pendientes y sabes si quedó satisfecho?
4. **Operación:** ¿Cómo llevas las ventas, los pagos y las entregas? ¿Dónde se repite trabajo o aparecen errores?
5. **Datos:** ¿Qué cifras revisas para saber cómo va el negocio, de dónde salen, cada cuánto las revisas y qué decisión reciente tomaste?
6. **Personas y cuidado digital:** ¿Cómo aprenden a usar las herramientas y cómo continuarían si se pierde un equipo, una cuenta o falta quien más sabe?

Después de cada respuesta, el modelo debe buscar evidencia para las doce prácticas, no únicamente para la dimensión asociada a la pregunta.

### Preguntas adicionales

Solo se formula una pregunta adicional cuando:

- Falta una evidencia necesaria para diferenciar dos niveles.
- Existe una contradicción relevante.
- Una práctica prioritaria quedó sin evaluar.
- La respuesta fue demasiado general.

La pregunta debe solicitar un hecho concreto, por ejemplo:

> Mencionas que revisas las ventas. ¿Cada cuánto lo haces y puedes contarme una decisión reciente que hayas tomado con esa información?

Para conservar una experiencia fluida, se recomienda un máximo de dos preguntas adicionales en la versión breve. Si continúa faltando información, el informe debe reconocerlo sin obligar al usuario a responder más.

---

## 12. Priorización de las recomendaciones

La prioridad no debe definirse solamente por la calificación más baja. Una práctica puede estar poco desarrollada y no ser urgente para el negocio.

Cada oportunidad puede evaluarse internamente mediante:

- Prioridad declarada por el usuario: 30 %.
- Impacto esperado en el negocio: 25 %.
- Brecha de madurez: 20 %.
- Riesgo o urgencia: 15 %.
- Facilidad de ejecución: 10 %.

Esta ponderación es una hipótesis inicial y deberá ajustarse durante la validación.

El sistema debe seleccionar un máximo de tres recomendaciones y dirigirlas al **siguiente nivel alcanzable**, no directamente al nivel 5.

Ejemplo:

- Si una práctica está en nivel 1, la recomendación debe ayudar a volverla repetible.
- Si está en nivel 2, debe ayudar a definirla y aplicarla consistentemente.
- Si está en nivel 3, debe introducir medición y revisión.
- Si está en nivel 4, debe promover aprendizaje, resiliencia y mejora continua.

---

## 13. Formato de las recomendaciones

La evaluación interna puede ser detallada, pero el cliente debe recibir únicamente:

### Qué hacer

Una acción específica y realizable.

### Por qué

El problema o beneficio relacionado con su contexto.

### Cómo darle seguimiento

Un indicador sencillo, una frecuencia o una evidencia observable.

Ejemplo:

**Registra el origen de cada oportunidad**

**Qué hacer:** agrega un campo obligatorio para indicar si el contacto llegó por recomendación, LinkedIn, sitio web, WhatsApp u otro canal.

**Por qué:** actualmente identificas el origen por memoria, lo que dificulta reconocer cuáles canales generan mejores oportunidades.

**Cómo darle seguimiento:** cada mes cuenta las oportunidades recibidas por canal y compáralas con el mes anterior.

---

## 14. Biblioteca de acciones

Las recomendaciones no deberían generarse completamente desde cero. Se debe construir una biblioteca por:

- Práctica.
- Nivel actual.
- Nivel siguiente.
- Tipo de negocio.
- Nivel de esfuerzo.
- Herramientas disponibles.
- Riesgos que busca reducir.

El modelo selecciona una acción base y la adapta con las evidencias de la conversación. Esto reduce recomendaciones genéricas o excesivamente complejas.

---

## 15. Validación del instrumento

### Etapa 1: validez de contenido

- Mapear cada práctica con los marcos de referencia.
- Solicitar a entre cinco y ocho especialistas que evalúen relevancia, claridad y aplicabilidad.
- Revisar preguntas que puedan tener interpretaciones diferentes.
- Realizar entrevistas cognitivas con emprendedores y empresas para conocer cómo entienden cada pregunta.

### Etapa 2: prueba piloto

Aplicar el diagnóstico a una muestra diversa:

- Trabajadores independientes.
- Emprendedores.
- Microempresas.
- Pequeñas y medianas empresas.
- Diferentes sectores y niveles de dependencia digital.

Una prueba inicial puede realizarse con 50 a 100 negocios. Para análisis estadísticos más avanzados conviene aumentar posteriormente la muestra.

### Etapa 3: confiabilidad

Una muestra de respuestas debe ser puntuada independientemente por dos evaluadores.

Objetivos operativos sugeridos:

- Concordancia exacta entre evaluadores.
- Concordancia dentro de un nivel.
- Kappa ponderado cercano o superior a 0,70.
- Estabilidad temporal cuando el negocio no haya cambiado.
- Resultados equivalentes ante respuestas con el mismo significado redactadas de manera diferente.

Estos valores son metas de diseño, no garantías estadísticas previas a la validación.

### Etapa 4: validez y equidad

Comprobar que:

- El resultado diferencia negocios con prácticas realmente distintas.
- Empresas pequeñas no reciben puntuaciones menores solo por usar herramientas sencillas.
- El sector económico no introduce sesgos injustificados.
- Cambiar la forma de redactar una respuesta no cambia sustancialmente el resultado.
- Las recomendaciones son útiles, comprensibles y ejecutables.

### Etapa 5: sensibilidad

Probar diferentes ponderaciones y reglas de agregación para verificar que pequeños cambios no alteren de manera injustificada el diagnóstico, siguiendo las recomendaciones del [manual OECD/JRC sobre indicadores compuestos](https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html).

---

## 16. Trazabilidad y control de versiones

Cada evaluación debe guardar:

- Versión del modelo.
- Versión de las preguntas.
- Versión de la rúbrica.
- Respuestas originales.
- Evidencias extraídas.
- Prácticas relacionadas con cada evidencia.
- Puntuación calculada.
- Confianza de la puntuación.
- Información insuficiente.
- Contradicciones detectadas.
- Recomendaciones seleccionadas.

Las comparaciones históricas solo deben realizarse con la misma versión o aplicando una regla documentada de equivalencia.

---

## 17. Principios que el modelo nunca debe incumplir

- No inventar información que el cliente no entregó.
- No asumir que algo no existe simplemente porque no fue mencionado.
- No calificar una intención como una práctica implementada.
- No considerar que una herramienta costosa equivale a mayor madurez.
- No penalizar a un negocio por ser pequeño.
- No asignar niveles sin conservar su evidencia.
- No recomendar más tecnología cuando el problema puede resolverse organizando mejor una práctica existente.
- No comparar evaluaciones realizadas con versiones incompatibles.
- No convertir la autoevaluación en una auditoría o certificación sin un proceso independiente de validación.
$jcguide$,
  $jcresponse$
## Forma de responder al cliente

- Escribe en español claro, cercano y en segunda persona.
- Presenta el resultado como una autoevaluación orientativa, nunca como auditoría, certificación ni garantía.
- Separa siempre lo que se observa hoy, lo que se desconoce y lo que la persona planea hacer.
- No inventes hechos, causas, frecuencias, responsables, herramientas, resultados ni cifras.
- No recomiendes servicios de Jorkcáceres ni vendas dentro del diagnóstico.
- Explica cada práctica con evidencia concreta de la conversación y, cuando no exista, usa “Información insuficiente”.
- No cambies las puntuaciones calculadas por la rúbrica.
- Propón máximo tres próximos pasos. Cada uno debe incluir: qué hacer, por qué y cómo darle seguimiento.
- Recomienda el siguiente nivel alcanzable, no soluciones complejas ni tecnología innecesaria.
- Reconoce procesos manuales consistentes como válidos.
- Mantén los textos breves, específicos y accionables.
$jcresponse$
)
on conflict (id) do nothing;

alter table public.diagnostic_settings enable row level security;
grant select, insert, update on public.diagnostic_settings to authenticated;

drop policy if exists "Administradores pueden ver configuración del diagnóstico" on public.diagnostic_settings;
create policy "Administradores pueden ver configuración del diagnóstico"
on public.diagnostic_settings for select to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores pueden insertar configuración del diagnóstico" on public.diagnostic_settings;
create policy "Administradores pueden insertar configuración del diagnóstico"
on public.diagnostic_settings for insert to authenticated
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores pueden actualizar configuración del diagnóstico" on public.diagnostic_settings;
create policy "Administradores pueden actualizar configuración del diagnóstico"
on public.diagnostic_settings for update to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);
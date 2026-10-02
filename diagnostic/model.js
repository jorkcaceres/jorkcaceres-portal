export const VERSION = '1.4.2';
export const LEVELS = ['No establecido', 'Inicial', 'Repetible', 'Definido', 'Medido', 'Optimizado'];
const criterion = (id, name, steps) => ({ id, name, steps });
export const AXES = [
  { id: 'direction', name: 'Dirección y prioridades', question: '¿Qué te gustaría mejorar primero en tu negocio y cómo decides quién lo hace y cuándo revisar si funcionó?', criteria: [
    criterion('priorities', '¿Tienes claro qué mejorar primero?' , ['Identifica una mejora digital ligada a una necesidad', 'Revisa prioridades de forma repetida', 'Tiene prioridades explícitas, responsable y recursos definidos', 'Mide resultados de esas prioridades', 'Describe ajustes sostenidos de prioridades basados en resultados']),
    criterion('followup', '¿Compruebas si las mejoras funcionan?' , ['Realiza alguna revisión de una mejora', 'Repite la revisión aunque sea informal', 'Tiene responsable y frecuencia definida para revisar', 'Compara resultados con objetivos definidos', 'Describe varios ciclos de revisión y ajustes con aprendizaje'])] },
  { id: 'presence', name: 'Presencia y captación', question: 'Si alguien necesita lo que ofreces, ¿cómo te encuentra, cómo te contacta y cómo sabes si ese canal te trae clientes?', criteria: [
    criterion('channels', 'Canales pertinentes', ['Dispone de un canal donde encontrar información del negocio', 'Actualiza ese canal repetidamente', 'Mantiene información clara y contacto funcional con responsable', 'Mide consultas útiles generadas por el canal', 'Ajusta el canal en varios ciclos según resultados']),
    criterion('acquisition', 'Seguimiento de captación', ['Reconoce de dónde llegó alguna consulta', 'Registra repetidamente el origen de consultas', 'Revisa con regularidad el origen y seguimiento de oportunidades', 'Mide conversión o contribución de los canales', 'Describe mejoras repetidas de captación basadas en mediciones'])] },
  { id: 'customers', name: 'Clientes y fidelización', question: 'Desde que alguien pregunta hasta después de comprar, ¿cómo recuerdas los pendientes y sabes si quedó satisfecho?', criteria: [
    criterion('pipeline', 'Oportunidades y pendientes', ['Conserva alguna consulta o pendiente', 'Usa un registro repetidamente', 'Cada oportunidad tiene estado, responsable y próxima acción', 'Mide respuesta o resolución de pendientes', 'Mejora el seguimiento en varios ciclos según sus resultados']),
    criterion('relationship', 'Atención y relación posterior', ['Realiza algún contacto posterior o consulta de satisfacción', 'Repite el seguimiento posterior', 'Tiene rutina y responsable de atención y seguimiento pertinente', 'Mide satisfacción, resolución o recompra según su negocio', 'Ajusta la relación con clientes repetidamente según resultados'])] },
  { id: 'operations', name: 'Operación y herramientas', question: '¿Cómo llevas las ventas, las cuentas y la entrega de tus productos o servicios? ¿Dónde se repite trabajo o aparecen errores?', criteria: [
    criterion('records', 'Registros operativos', ['Registra ventas, cuentas o entregas en alguna herramienta', 'Mantiene esos registros de forma repetida', 'Los procesos principales tienen registros actualizados y responsables', 'Controla exactitud, tiempos o errores de esos registros', 'Mejora repetidamente la calidad y uso de los registros']),
    criterion('workflow', 'Trabajo cotidiano', ['Utiliza alguna herramienta para realizar el trabajo', 'Repite una forma de trabajo con herramientas', 'Tiene una rutina clara y sostenible para los procesos principales', 'Mide tiempos o errores de la operación', 'Mejora procesos en varios ciclos; automatiza solo si aporta valor'])] },
  { id: 'data', name: 'Datos y decisiones', question: 'Para entender tus datos y decisiones: menciona los números que consultas (por ejemplo, ingresos, pagos, costos o margen), cada cuánto los revisas y una decisión reciente que hayas tomado con ellos.', criteria: [
    criterion('quality', 'Información confiable', ['Conoce alguna fuente de información del negocio', 'Actualiza información de forma repetida', 'Tiene fuentes, responsables y revisión de calidad definidos', 'Mide o verifica errores y consistencia periódicamente', 'Mejora de forma sostenida la calidad según verificaciones']),
    criterion('decisions', 'Indicadores y decisiones', ['Consulta alguna cifra del negocio', 'Revisa cifras repetidamente', 'Revisa indicadores relevantes con frecuencia y toma decisiones', 'Compara el resultado de decisiones con objetivos medibles', 'Describe varios ciclos de decisiones y aprendizaje basado en indicadores'])] },
  { id: 'people', name: 'Personas y cuidado digital', question: '¿Cómo aprenden a usar las herramientas y cómo continuarían si se pierde un equipo, una cuenta o falta quien más sabe?', criteria: [
    criterion('skills', 'Uso y continuidad', ['Una persona sabe usar las herramientas principales', 'Se comparte o refuerza ese conocimiento repetidamente', 'Hay instrucciones y responsables o un plan de continuidad si trabaja solo', 'Se comprueba que pueden trabajar siguiendo esas instrucciones', 'Se mejoran instrucciones y habilidades según comprobaciones repetidas']),
    criterion('protection', 'Accesos y recuperación', ['Existe alguna práctica de protección de cuentas o información', 'Repite respaldos o revisiones de accesos', 'Controla accesos, protege cuentas y tiene recuperación definida', 'Comprueba recuperación y revisa accesos periódicamente', 'Mejora protección y recuperación a partir de pruebas repetidas'])] },
];

// Each initial question covers one whole axis. The review asks only for a clarification when evidence is missing.
export const QUESTIONS = AXES.map(axis => ({
  id: axis.id,
  axis_id: axis.id,
  practice_ids: axis.criteria.map(criterion => criterion.id),
  question: axis.question,
}));

export const ACTIONS = [
  ['Elige una mejora y una fecha de revisión', 'Anota el objetivo, quién lo hará y qué cambio esperas observar. Revisa el avance en dos semanas.', 'Una prioridad con responsable y revisión realizada.', 'Puedes hacerlo con tu equipo.'],
  ['Revisa cómo te encuentran y contactan', 'Comprueba que el canal más relevante explica lo que ofreces y permite contactarte. Registra el origen de las próximas consultas.', 'Consultas con origen identificado.', 'Puedes empezar por revisar tu canal principal con información clara, contacto visible y seguimiento de consultas.'],
  ['Reúne los pendientes de tus clientes', 'Usa tu registro actual, si ya tienes uno, para reunir cliente, estado y próxima acción. Revísalo cada semana.', 'Pendientes sin próxima acción.', 'Aprovecha las herramientas que ya tienes. Cualquier CRM o campaña adicional requiere validar la necesidad y el alcance.'],
  ['Ordena un proceso cotidiano', 'Elige una tarea repetida, escribe sus pasos y evita registrar dos veces la misma información antes de buscar otra herramienta.', 'Errores o repeticiones por semana.', 'Puedes organizarlo internamente y decidir después si realmente necesitas una herramienta adicional.'],
  ['Define un indicador que te ayude a decidir', 'Elige una pregunta de negocio, identifica una fuente confiable y revisa el indicador semanalmente.', 'Revisiones que terminan en una decisión.', 'Puedes empezar con los registros que ya tienes y comprobar que la información sea suficiente para decidir.'],
  ['Comprueba cómo continuarías trabajando', 'Identifica quién controla las cuentas y cómo recuperar información. Acuerda un responsable para revisar los accesos y la recuperación.', 'Cuentas con responsable y recuperación comprobada.', 'Puedes organizar la revisión. Una evaluación especializada de seguridad requiere un especialista.'],
];
const COMMERCIAL_ACTIONS = {
  presence: ['Crea un registro comercial único', 'Durante un mes, registra cada consulta en la herramienta que ya usas: canal de origen, necesidad, estado y próxima acción.', 'Consultas con origen y próxima acción registrados.', 'No necesitas otra herramienta: empieza con un único registro que puedas revisar.'],
  customers: ['Revisa los pendientes comerciales cada semana', 'Una vez por semana, revisa las consultas y clientes activos para definir qué conversación necesita respuesta o próximo paso.', 'Pendientes comerciales sin próxima acción.', 'Usa el registro comercial que ya creaste para no depender de la memoria o mensajes dispersos.'],
  direction: ['Decide qué ajustar al cierre de mes', 'Al final del mes, compara las consultas, propuestas y clientes logrados. Elige un ajuste concreto para el siguiente mes.', 'Una decisión mensual basada en consultas, propuestas y clientes.', 'Aprovecha la información que ya registras para convertirla en una rutina de decisión.'],
};

const MEASURED_ACTIONS = [
  ['Comprueba el resultado de una prioridad', 'Toma una mejora que ya esté en marcha y compara un indicador antes y después de aplicarla.', 'Mejoras con resultado revisado frente al objetivo.'],
  ['Mide qué canal aporta oportunidades', 'Durante un mes, relaciona consultas, oportunidades y ventas con su canal de origen para decidir dónde concentrarte.', 'Conversión de consultas en oportunidades por canal.'],
  ['Mide la calidad del seguimiento', 'Usa tu registro actual para revisar tiempo de respuesta y pendientes vencidos. Elige un ajuste y comprueba su efecto.', 'Tiempo de respuesta y pendientes vencidos.'],
  ['Mide un proceso antes de cambiarlo', 'Registra tiempo y errores de una tarea frecuente durante dos semanas. Usa esa referencia para evaluar una mejora.', 'Tiempo y errores por ejecución del proceso.'],
  ['Comprueba una decisión con tus indicadores', 'Documenta una decisión reciente, el resultado esperado y la fecha de revisión. Contrasta después lo ocurrido con la expectativa.', 'Decisiones con resultado comprobado.'],
  ['Prueba la continuidad del negocio', 'Comprueba con el responsable que puedan recuperar información y continuar una tarea siguiendo sus instrucciones. Registra lo que deben mejorar.', 'Pruebas de recuperación y continuidad completadas.'],
];
export function scoreCriterion(fact) {
  if (!fact || fact.status === 'unknown' || fact.status === 'not_applicable') return null;
  if (fact.status === 'absent') return fact.evidence?.trim() ? 0 : null;
  if (fact.status !== 'observed' || !fact.evidence?.trim() || !Array.isArray(fact.steps)) return null;
  let score = 0;
  for (const step of fact.steps.slice(0, 5)) { if (typeof step !== 'string' || !step.trim()) break; score++; }
  return score || null;
}
export function evaluate(facts = {}, context = '') {
  const axes = AXES.map(axis => {
    const criteria = axis.criteria.map(c => ({ id: c.id, name: c.name, score: scoreCriterion(facts[c.id]), ...{ fact: facts[c.id] || { status: 'unknown', evidence: '', steps: [] } } }));
    const applicable = criteria.filter(c => c.fact.status !== 'not_applicable');
    const rawScore = applicable.length && applicable.every(c => c.score !== null) ? applicable.reduce((n, c) => n + c.score, 0) / applicable.length : null;
    const score = rawScore === null ? null : Math.round(rawScore * 2) / 2;
    return { id: axis.id, name: axis.name, score, sufficient: criteria.every(c => c.score !== null), criteria };
  });
  const candidates = axes.map((a, index) => ({ ...a, index })).filter(a => a.score !== null && a.score < 4)
    .sort((a, b) => a.score - b.score);
  // The stated business objective guides the order; no axis is promoted by a hidden rule.
  const commercialGoal = /modelo comercial|oferta|ventas|captar|captaci[oó]n|clientes potenciales|nuevos clientes/i.test(context);
  const goalAxes = commercialGoal
    ? ['presence', 'customers', 'direction']
    : /pedidos|responder|seguimiento/i.test(context) ? ['customers', 'operations'] : [];
  const rank = a => {
    const position = goalAxes.indexOf(a.id);
    return position === -1 ? 10 : position;
  };
  candidates.sort((a, b) => rank(a) - rank(b) || a.score - b.score);
  return { version: VERSION, axes, coverage: axes.filter(a => a.score !== null).length,
    actions: candidates.slice(0, 3).map(a => {
      const action = commercialGoal && COMMERCIAL_ACTIONS[a.id] ? COMMERCIAL_ACTIONS[a.id] : a.score >= 3 ? MEASURED_ACTIONS[a.index] : ACTIONS[a.index];
      return { axis: a.name, evidence: [...new Set(a.criteria.map(c => c.fact.evidence).filter(Boolean))].join(' '), title: action[0], step: action[1], indicator: action[2], support: action[3] || ACTIONS[a.index][3] };
    }) };
}


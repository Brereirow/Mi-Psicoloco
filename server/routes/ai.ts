import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { GoogleGenAI } from '@google/genai';

const router = Router();
router.use(authMiddleware);

const SYSTEM_INSTRUCTION = `
Eres "Mi Psicoloco IA", el asistente personal académico y de bienestar de la plataforma "MI PSICOLOCO" ("Tu asistente académico y de bienestar").
Tu objetivo es acompañar al estudiante en su organización escolar, ayudarle a estructurar su tiempo de estudio y brindarle apoyo de bienestar general.

REGLAS CRÍTICAS DE ÉTICA Y SEGURIDAD:
1. NUNCA afirmes ser un psicólogo profesional, psiquiatra o terapeuta humano.
2. NUNCA realices diagnósticos médicos o clínicos (por ejemplo, nunca digas: "Tienes depresión clínica", "Sufres de TDAH", etc.). En su lugar usa términos descriptivos de acompañamiento como: "Parece que has estado sintiendo mucho estrés acumulado últimamente".
3. NUNCA prescribas ni recomiendes medicamentos, fármacos o suplementos.
4. NUNCA sustituyas la atención profesional o médica. Recomienda acudir con los orientadores de la institución cuando sea conveniente.
5. PROTOCOLO DE CRISIS: Si el usuario expresa ideas de autolesión, desesperanza extrema o peligro inminente, muestra empatía inmediata, valida su dolor y RECOMIENDA con absoluta claridad contactar las líneas de emergencia (Línea de la Vida 800 911 2000, 911, o el Módulo de Orientación Escolar) y presionar el botón "🆘 Necesito ayuda inmediata" en la aplicación.

TONO Y PERSONALIDAD:
- Empático, juvenil, claro, profesional, respetuoso y estructurado.
- Ofrece pasos accionables concretos (técnicas de respiración, división de tareas con Pomodoro, agendas).
- Al final de tus respuestas, cuando sea pertinente, sugiere 2 a 4 botones o acciones breves que el estudiante puede tomar.
`;

// POST /api/ai/chat
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  const { message, history = [] } = req.body;
  const user = req.user!;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Debes enviar un mensaje válido.' });
  }

  // Get student context (tasks and recent mood)
  const raw = db.getRaw();
  const pendingTasks = raw.tasks.filter((t) => t.studentId === user.id && t.status !== 'completada').slice(0, 3);
  const recentMood = raw.emotionalRecords.find((r) => r.studentId === user.id);

  const contextPrompt = `
Contexto del usuario actual:
- Nombre: ${user.name}
- Rol: ${user.role}
- Último estado de ánimo registrado: ${recentMood ? recentMood.mood + (recentMood.note ? ` ("${recentMood.note}")` : '') : 'Sin registro reciente'}
- Tareas/exámenes pendientes: ${pendingTasks.map((t) => `${t.title} (vence: ${t.dueDate})`).join(', ') || 'Ninguna registrada'}
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Intelligent supportive fallback when API key is not yet set
      const lower = message.toLowerCase();
      let reply = `Hola ${user.name}, te escucho atentamente. `;
      let quickActions = [
        'Organizar mis exámenes',
        'Ejercicio de respiración',
        'Hablar sobre cómo me siento',
        'Solicitar orientación',
      ];

      if (lower.includes('estres') || lower.includes('examen') || lower.includes('presion') || lower.includes('miedo')) {
        reply +=
          'Entiendo que tengas mucha presión en estos momentos. Es completamente normal sentir agobio cuando se juntan varias entregas y exámenes. Te sugiero que dividamos tus actividades en bloques pequeños de 25 minutos y nos tomemos 3 minutos para un ejercicio de respiración. ¿Te gustaría que armemos un plan de estudio paso a paso?';
      } else if (lower.includes('triste') || lower.includes('solo') || lower.includes('mal')) {
        reply +=
          'Lamento mucho que te sientas así hoy. Recuerda que no tienes que cargar con todo tú solo. En Mi Psicoloco contamos con recursos guiados de bienestar y también puedes agendar una sesión de orientación con el área de psicología del instituto sin ningún costo.';
      } else {
        reply +=
          '¿Cómo te has sentido con tus materias hoy? Podemos revisar tus pendientes, programar tiempos de estudio o hacer una pausa breve para despejar la mente.';
      }

      return res.json({
        reply,
        quickActions,
        isCrisis: false,
      });
    }

    const ai = new GoogleGenAI();

    // Prepare contents
    const contents: any[] = [];
    contents.push({
      role: 'user',
      parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${contextPrompt}\n\nEl usuario dice: ${message}` }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const replyText = response.text || 'Entiendo. ¿En qué te gustaría que nos enfoquemos hoy?';

    // Extract quick action recommendations
    const quickActions = [
      'Organizar mis exámenes',
      'Ejercicio de respiración',
      'Hablar sobre cómo me siento',
      'Solicitar orientación',
    ];

    const isCrisis =
      message.toLowerCase().includes('morir') ||
      message.toLowerCase().includes('suicid') ||
      message.toLowerCase().includes('hacerme daño');

    return res.json({
      reply: replyText,
      quickActions,
      isCrisis,
    });
  } catch (err: any) {
    console.error('Error in AI chat:', err);
    return res.json({
      reply: `Hola ${user.name}, estoy aquí para acompañarte en tu organización y bienestar. Si te sientes abrumado, podemos revisar tus materias o realizar una respiración guiada.`,
      quickActions: ['Organizar mis exámenes', 'Ejercicio de respiración', 'Solicitar orientación'],
      isCrisis: false,
    });
  }
});

// POST /api/ai/study-plan
router.post('/study-plan', async (req: AuthenticatedRequest, res: Response) => {
  const { taskTitle, examDate, availableHoursPerDay = 2, focusTopics } = req.body;

  if (!taskTitle) {
    return res.status(400).json({ error: 'Debes indicar la materia o examen.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        studyPlan: {
          title: `Plan de estudio estructurado: ${taskTitle}`,
          totalDays: 3,
          sessions: [
            {
              day: 'Día 1: Comprensión Teórica',
              durationMinutes: 45,
              focus: 'Lectura de conceptos clave, elaboración de mapas mentales y fórmulas.',
            },
            {
              day: 'Día 2: Práctica y Ejercicios',
              durationMinutes: 60,
              focus: 'Resolución de problemas tipo examen utilizando la técnica Pomodoro (25m estudio / 5m descanso).',
            },
            {
              day: 'Día 3: Simulación y Cierre',
              durationMinutes: 30,
              focus: 'Simulacro cronometrado, repaso de dudas y descanso previo al examen.',
            },
          ],
          wellnessTip: 'Duerme al menos 7 horas la noche anterior. La memoria a largo plazo se consolida durante el sueño.',
        },
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `
Genera un plan de estudio óptimo y equilibrado para un estudiante que se prepara para: "${taskTitle}".
Fecha del examen o entrega: ${examDate || 'En 3 días'}.
Tiempo disponible diario: ${availableHoursPerDay} horas.
Temas de enfoque: ${focusTopics || 'Principales contenidos de la asignatura'}.

Devuelve exclusivamente un JSON estructurado con la siguiente estructura:
{
  "title": "Nombre del plan",
  "totalDays": número,
  "sessions": [
    {
      "day": "Nombre del día (ej. Día 1: Fundamentos)",
      "durationMinutes": número,
      "focus": "Descripción clara de las actividades específicas a realizar"
    }
  ],
  "wellnessTip": "Consejo de bienestar y descanso para no fatigarse"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ studyPlan: parsed });
  } catch (err: any) {
    console.error('Error generating study plan:', err);
    return res.json({
      studyPlan: {
        title: `Plan de estudio: ${taskTitle}`,
        totalDays: 2,
        sessions: [
          { day: 'Día 1', durationMinutes: 45, focus: 'Repaso conceptual y esquemas' },
          { day: 'Día 2', durationMinutes: 45, focus: 'Resolución de ejercicios prácticos' },
        ],
        wellnessTip: 'Toma agua e hidrátate entre bloques de estudio.',
      },
    });
  }
});

export default router;

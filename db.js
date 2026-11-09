/**
 * LEARNIX — Aprende, Gestiona, Crece
 * db.js — Módulo desacoplado de abstracción y persistencia (IndexedDB)
 * 
 * Diseñado con interfaz agnóstica para permitir sustituir fácilmente 
 * el almacenamiento local del navegador por llamadas a una API REST / Supabase.
 */

const DB_NAME = 'LearnixDB2';
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
    this._initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Almacén: Artículos (publicaciones)
        if (!db.objectStoreNames.contains('articles')) {
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('status', 'status', { unique: false });
          articleStore.createIndex('subject', 'subject', { unique: false });
          articleStore.createIndex('grade', 'grade', { unique: false });
          articleStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Comentarios
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('articleId', 'articleId', { unique: false });
          commentStore.createIndex('status', 'status', { unique: false }); // pending, approved, rejected, spam
          commentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Biblioteca Multimedia
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('category', 'category', { unique: false });
          mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Configuración y Sesión Demo
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this._seedInitialData();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error al inicializar IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ── Métodos internos sin await _initPromise (evitan deadlock en seed) ──
  _countRaw(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _putRaw(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async _seedInitialData() {
    const articlesCount = await this._countRaw('articles');
    if (articlesCount === 0) {
      // Sembrar datos educativos iniciales
      const defaultArticles = [
        {
          id: 'art-ciclo-agua',
          title: 'Inteligencia artificial en el aula: guía práctica para docentes',
          summary: 'Cómo usar la inteligencia artificial para planificar, evaluar y personalizar el aprendizaje, con criterio ético y ejemplos listos para aplicar mañana.',
          subject: 'Tecnología Educativa',
          grade: 'Todos los niveles',
          readTime: 8,
          status: 'published', // 'published', 'draft', 'scheduled'
          coverImage: 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20750%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27b%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%230B1F5C%27%2F%3E%3Cstop%20offset%3D%27.55%27%20stop-color%3D%27%231D4ED8%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%2338BDF8%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27n%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23fff%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%237DD3FC%27%2F%3E%3C%2FradialGradient%3E%3Cpattern%20id%3D%27g%27%20width%3D%2750%27%20height%3D%2750%27%20patternUnits%3D%27userSpaceOnUse%27%3E%3Cpath%20d%3D%27M50%200H0V50%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.07%27%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27750%27%20fill%3D%27url%28%23b%29%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27750%27%20fill%3D%27url%28%23g%29%27%2F%3E%3Ccircle%20cx%3D%27980%27%20cy%3D%27140%27%20r%3D%27260%27%20fill%3D%27%2338BDF8%27%20opacity%3D%27.18%27%2F%3E%3Ccircle%20cx%3D%27170%27%20cy%3D%27650%27%20r%3D%27220%27%20fill%3D%27%230B1F5C%27%20opacity%3D%27.35%27%2F%3E%3Cpath%20d%3D%27M60%20690H300L340%20650H520M60%20640H220L260%20600M1140%2090H940L900%20130H760M1140%20140H1000%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.3%27%20stroke-width%3D%273%27%2F%3E%3Cpath%20d%3D%27M260%20210L470%20155M260%20210L470%20265M260%20210L470%20375M260%20210L470%20485M260%20210L470%20595M260%20320L470%20155M260%20320L470%20265M260%20320L470%20375M260%20320L470%20485M260%20320L470%20595M260%20430L470%20155M260%20430L470%20265M260%20430L470%20375M260%20430L470%20485M260%20430L470%20595M260%20540L470%20155M260%20540L470%20265M260%20540L470%20375M260%20540L470%20485M260%20540L470%20595M470%20155L680%20155M470%20155L680%20265M470%20155L680%20375M470%20155L680%20485M470%20155L680%20595M470%20265L680%20155M470%20265L680%20265M470%20265L680%20375M470%20265L680%20485M470%20265L680%20595M470%20375L680%20155M470%20375L680%20265M470%20375L680%20375M470%20375L680%20485M470%20375L680%20595M470%20485L680%20155M470%20485L680%20265M470%20485L680%20375M470%20485L680%20485M470%20485L680%20595M470%20595L680%20155M470%20595L680%20265M470%20595L680%20375M470%20595L680%20485M470%20595L680%20595M680%20155L890%20265M680%20155L890%20375M680%20155L890%20485M680%20265L890%20265M680%20265L890%20375M680%20265L890%20485M680%20375L890%20265M680%20375L890%20375M680%20375L890%20485M680%20485L890%20265M680%20485L890%20375M680%20485L890%20485M680%20595L890%20265M680%20595L890%20375M680%20595L890%20485%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.28%27%20stroke-width%3D%272%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27210%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27320%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27430%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27540%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27155%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27265%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27375%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27595%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27155%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27265%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27375%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27595%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27265%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27375%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3C%2Fsvg%3E',
          coverAlt: 'Red neuronal luminosa sobre un fondo azul tecnológico que representa la inteligencia artificial en la educación',
          author: 'Lic. Johan Mendez',
          role: 'Docente de Tecnología Educativa',
          views: 2450,
          createdAt: new Date('2025-03-14T08:30:00Z').getTime(),
          content: `
            <div style="background:linear-gradient(135deg,#eff6ff,#e0f2fe);padding:20px 24px;border-radius:12px;margin-bottom:24px;border-left:4px solid #1D4ED8;">
              <p style="margin:0 0 6px;font-weight:700;color:#1E3A8A;">Indicador de logro</p>
              <p style="margin:0;">Utiliza herramientas de inteligencia artificial para apoyar la planificación y la evaluación, verificando siempre la información y protegiendo los datos del estudiantado.</p>
            </div>

            <h2>1. ¿Qué es la IA y por qué importa en el aula?</h2>
            <p>La inteligencia artificial generativa puede redactar, resumir, traducir y proponer ideas a partir de una instrucción escrita. No reemplaza al docente: <strong>amplía su tiempo y su creatividad</strong> para dedicarlo a lo que ninguna máquina hace, que es acompañar a cada estudiante.</p>

            <h2>2. Cuatro usos prácticos para empezar</h2>
            <ul>
              <li><strong>Planificar:</strong> generar borradores de secuencias didácticas y adaptarlos a tu grupo.</li>
              <li><strong>Personalizar:</strong> crear actividades de distinto nivel para un mismo contenido.</li>
              <li><strong>Evaluar:</strong> proponer rúbricas, bancos de preguntas y retroalimentación inicial.</li>
              <li><strong>Crear recursos:</strong> organizar glosarios, resúmenes, guiones y fichas de trabajo.</li>
            </ul>

            <h2>3. Cómo escribir un buen prompt</h2>
            <ol>
              <li><strong>Rol:</strong> «Actúa como docente de Tecnología Educativa de 8vo grado».</li>
              <li><strong>Contexto:</strong> tema, nivel, tiempo disponible y recursos del aula.</li>
              <li><strong>Tarea concreta:</strong> «Diseña una actividad de 40 minutos con una rúbrica de 4 criterios».</li>
              <li><strong>Formato:</strong> tabla, lista o texto breve.</li>
              <li><strong>Iteración:</strong> pide mejoras hasta que el resultado sirva para tu clase.</li>
            </ol>

            <div style="background:#f1f5f9;padding:16px 20px;border-radius:12px;margin:20px 0;border-left:4px solid #0284C7;">
              <p style="font-style:italic;margin:0 0 8px;">«La IA propone; el docente decide.»</p>
              <p style="margin:0;font-size:13px;">Revisa cada resultado antes de usarlo en clase.</p>
            </div>

            <h2>4. Uso ético y responsable</h2>
            <ul>
              <li>Verifica los datos y las fuentes: la IA puede equivocarse con total seguridad.</li>
              <li>No compartas nombres, fotos ni datos personales de estudiantes.</li>
              <li>Enseña a citar el apoyo de la IA y a distinguir el trabajo propio.</li>
              <li>Evalúa el proceso de aprendizaje, no solo el producto final.</li>
            </ul>

            <h2>5. Actividad para esta semana</h2>
            <ol>
              <li>Elige una clase que ya planificaste.</li>
              <li>Pide a una herramienta de IA tres ideas para mejorar su inicio y su cierre.</li>
              <li>Compara con tu plan, elige lo mejor y anota qué ajustaste.</li>
              <li>Comparte tu experiencia en los comentarios.</li>
            </ol>

            <h2>Referencias</h2>
            <ul>
              <li>UNESCO (2023). <em>Guía para el uso de la IA generativa en educación e investigación.</em></li>
            </ul>
          `,
          tags: ['IA', 'TecnologíaEducativa', 'Innovación', 'Prompts']
        },
        {
          id: 'art-fracciones-equiv',
          title: 'Comprendiendo las fracciones equivalentes: método visual para el aula y el hogar',
          summary: 'Estrategias gráficas paso a paso para desmitificar las fracciones y construir intuición matemática sólida.',
          subject: 'Matemáticas',
          grade: '6to Primaria',
          readTime: 7,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Regletas y círculos fraccionarios manipulativos',
          author: 'Lic. Marcos Peña',
          role: 'Docente de Matemáticas',
          views: 1890,
          createdAt: new Date('2025-03-11T10:15:00Z').getTime(),
          content: `
            <h2>¿Por qué 1/2 es igual a 2/4 y a 4/8?</h2>
            <p>El concepto de equivalencia en fracciones suele ser una de las principales barreras pedagógicas cuando se aborda de forma puramente abstracta. Utilizando el método Singapur (Concreto-Pictórico-Abstracto), los niños pueden ver y tocar las divisiones antes de operar con números.</p>
            <p>Presentar un pastel circular dividido en 2 mitades frente a otro dividido en 4 cuartos permite comprender de inmediato que la cantidad de superficie ocupada es idéntica.</p>
          `,
          tags: ['Matemáticas', 'MétodoCPA', 'GeometríaLúdica']
        },
        {
          id: 'art-oraciones-claras',
          title: 'Cómo construir oraciones claras y coherentes en la escuela primaria',
          summary: 'Guía de sintaxis lúdica para niños: identificación del sujeto y predicado mediante fichas manipulables.',
          subject: 'Lengua Española',
          grade: '4to Primaria',
          readTime: 4,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Cuaderno escolar con ejercicios caligráficos y gramaticales',
          author: 'Mtra. Altagracia Díaz',
          role: 'Docente de Letras',
          views: 940,
          createdAt: new Date('2025-03-08T12:00:00Z').getTime(),
          content: `
            <h2>El juego de los bloques sintácticos</h2>
            <p>Aprender la concordancia entre género y número es mucho más sencillo cuando los alumnos construyen oraciones como si fuesen trenes con vagones: ¿Quién realiza la acción? ¿Qué acción realiza? ¿Dónde o cómo ocurre?</p>
          `,
          tags: ['LenguaEspañola', 'RedacciónInicial', 'Gramática']
        },
        {
          id: 'art-manglares-borrador',
          title: 'Ecosistemas Costeros y Manglares de Samaná',
          summary: 'Una secuencia reflexiva y multidisciplinar diseñada para conectar a los alumnos de primaria con el patrimonio marino.',
          subject: 'Ciencias Naturales',
          grade: '5to Primaria',
          readTime: 6,
          status: 'draft',
          coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Paisaje de manglar rojo costero',
          author: 'Lic. Johan Mendez',
          role: 'Docente de Tecnología Educativa',
          views: 0,
          createdAt: new Date('2025-03-15T09:00:00Z').getTime(),
          content: `
            <h2>Guardianes del litoral dominicano</h2>
            <p>Borrador en construcción. Pendiente de anexar la rúbrica formativa y las preguntas de observación de campo.</p>
          `,
          tags: ['Biodiversidad', 'Samaná', 'EducaciónAmbiental']
        }
      ];

      for (const art of defaultArticles) {
        await this._putRaw('articles', art);
      }

      // Sembrar comentarios
      const defaultComments = [
        {
          id: 'comm-1',
          articleId: 'art-ciclo-agua',
          authorName: 'Prof. Manuel Grullón',
          authorType: 'teacher', // teacher, family, student, guest
          authorBadge: 'Docente Verificado',
          schoolInfo: 'Distrito Educativo 03-03 • San José de Ocoa',
          content: 'Excelente desglose. Realizamos hoy mismo el experimento de la bolsa con mis 28 alumnos de 5to grado y la emoción fue fantástica. ¿Tiene recomendaciones para adaptarlo con menos luz solar?',
          status: 'pending', // pending, approved, rejected, spam
          createdAt: new Date(Date.now() - 45 * 60 * 1000).getTime(),
          teacherReply: null
        },
        {
          id: 'comm-2',
          articleId: 'art-ciclo-agua',
          authorName: 'Estefanía Peña',
          authorType: 'family',
          authorBadge: 'Familia Comunidad',
          schoolInfo: 'Madre de estudiante de 5to A',
          content: 'Leí este recurso junto a mi hijo para su proyecto escolar de ciencias. Las preguntas finales nos sirvieron para debatir el consumo de agua en casa.',
          status: 'approved',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).getTime(),
          teacherReply: '¡Qué alegría inmensa, querida Estefanía! Ese asombro espontáneo en los ojos de los chicos es el corazón de la ciencia activa. ¡Un abrazo cálido a su grupo!'
        },
        {
          id: 'comm-3',
          articleId: 'art-fracciones-equiv',
          authorName: 'Visitante_982',
          authorType: 'guest',
          authorBadge: 'Anónimo',
          schoolInfo: 'IP: 179.53.*.* • Sin credenciales',
          content: 'Para resolver rápido sus tareas miren este link gratis en hxxp://descarga-examenes-rd.cc y ganen puntos sin estudiar.',
          status: 'pending', // flagged
          isSpamAlert: true,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).getTime(),
          teacherReply: null
        }
      ];

      for (const comm of defaultComments) {
        await this._putRaw('comments', comm);
      }

      // Sembrar biblioteca multimedia inicial
      const defaultMedia = [
        {
          id: 'media-esquema-ciclo',
          title: 'Infografía IA en el aula',
          category: 'infografias',
          url: 'data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20750%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27b%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%230B1F5C%27%2F%3E%3Cstop%20offset%3D%27.55%27%20stop-color%3D%27%231D4ED8%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%2338BDF8%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27n%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23fff%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%237DD3FC%27%2F%3E%3C%2FradialGradient%3E%3Cpattern%20id%3D%27g%27%20width%3D%2750%27%20height%3D%2750%27%20patternUnits%3D%27userSpaceOnUse%27%3E%3Cpath%20d%3D%27M50%200H0V50%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.07%27%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27750%27%20fill%3D%27url%28%23b%29%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27750%27%20fill%3D%27url%28%23g%29%27%2F%3E%3Ccircle%20cx%3D%27980%27%20cy%3D%27140%27%20r%3D%27260%27%20fill%3D%27%2338BDF8%27%20opacity%3D%27.18%27%2F%3E%3Ccircle%20cx%3D%27170%27%20cy%3D%27650%27%20r%3D%27220%27%20fill%3D%27%230B1F5C%27%20opacity%3D%27.35%27%2F%3E%3Cpath%20d%3D%27M60%20690H300L340%20650H520M60%20640H220L260%20600M1140%2090H940L900%20130H760M1140%20140H1000%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.3%27%20stroke-width%3D%273%27%2F%3E%3Cpath%20d%3D%27M260%20210L470%20155M260%20210L470%20265M260%20210L470%20375M260%20210L470%20485M260%20210L470%20595M260%20320L470%20155M260%20320L470%20265M260%20320L470%20375M260%20320L470%20485M260%20320L470%20595M260%20430L470%20155M260%20430L470%20265M260%20430L470%20375M260%20430L470%20485M260%20430L470%20595M260%20540L470%20155M260%20540L470%20265M260%20540L470%20375M260%20540L470%20485M260%20540L470%20595M470%20155L680%20155M470%20155L680%20265M470%20155L680%20375M470%20155L680%20485M470%20155L680%20595M470%20265L680%20155M470%20265L680%20265M470%20265L680%20375M470%20265L680%20485M470%20265L680%20595M470%20375L680%20155M470%20375L680%20265M470%20375L680%20375M470%20375L680%20485M470%20375L680%20595M470%20485L680%20155M470%20485L680%20265M470%20485L680%20375M470%20485L680%20485M470%20485L680%20595M470%20595L680%20155M470%20595L680%20265M470%20595L680%20375M470%20595L680%20485M470%20595L680%20595M680%20155L890%20265M680%20155L890%20375M680%20155L890%20485M680%20265L890%20265M680%20265L890%20375M680%20265L890%20485M680%20375L890%20265M680%20375L890%20375M680%20375L890%20485M680%20485L890%20265M680%20485L890%20375M680%20485L890%20485M680%20595L890%20265M680%20595L890%20375M680%20595L890%20485%27%20stroke%3D%27%23fff%27%20stroke-opacity%3D%27.28%27%20stroke-width%3D%272%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27210%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27320%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27430%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27260%27%20cy%3D%27540%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27155%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27265%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27375%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27470%27%20cy%3D%27595%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27155%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27265%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27375%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27680%27%20cy%3D%27595%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27265%27%20r%3D%2722%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27375%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3Ccircle%20cx%3D%27890%27%20cy%3D%27485%27%20r%3D%2715%27%20fill%3D%27url%28%23n%29%27%2F%3E%3C%2Fsvg%3E',
          sizeKB: 420,
          dimensions: '1200x800',
          altText: 'Infografía de una red neuronal sobre la inteligencia artificial en el aula',
          associatedArticle: 'Inteligencia artificial en el aula: guía práctica para docentes',
          createdAt: new Date('2024-10-14').getTime()
        },
        {
          id: 'media-manglares',
          title: 'Manglares costa norte Samaná',
          category: 'portadas',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 310,
          dimensions: '1200x800',
          altText: 'Vista de manglares y estuario tropical',
          associatedArticle: 'Ecosistemas Costeros y Manglares de Samaná',
          createdAt: new Date('2024-10-20').getTime()
        },
        {
          id: 'media-fracciones',
          title: 'Material didáctico fracciones',
          category: 'fichas',
          url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 280,
          dimensions: '1080x720',
          altText: 'Caja con regletas de madera fraccionarias',
          associatedArticle: 'Comprendiendo las fracciones equivalentes',
          createdAt: new Date('2024-11-02').getTime()
        }
      ];

      for (const med of defaultMedia) {
        await this._putRaw('media', med);
      }

      // Sembrar perfil docente por defecto (editable desde perfil.html)
      const settingsCount = await this._countRaw('settings');
      if (settingsCount === 0) {
        await this._putRaw('settings', {
          key: 'teacherProfile',
          name: 'Johan Mendez',
          title: 'Lic.',
          role: 'Docente de Tecnología Educativa',
          specialty: 'Tecnología Educativa',
          school: 'Distrito Educativo 03-03 • San José de Ocoa',
          yearsExperience: 0,
          bio: 'Aprende, gestiona, crece: la tecnología al servicio de una educación más organizada, innovadora y humana.',
          photoUrl: '',
          updatedAt: Date.now()
        });
      }
    }
  }

  // ── Método faltante: actualizar artículo (usado por lectura.html para vistas) ──
  async updateArticle(id, updates) {
    const article = await this.get('articles', id);
    if (!article) return null;
    Object.assign(article, updates, { updatedAt: Date.now() });
    await this.put('articles', article);
    return article;
  }

  // Operaciones CRUD genéricas sobre IndexedDB
  async get(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Métodos específicos de Dominio Educativo (Facade)
  async getPublishedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'published').sort((a, b) => b.createdAt - a.createdAt);
  }

  async getArticleById(id) {
    return await this.get('articles', id);
  }

  async saveArticle(articleData) {
    if (!articleData.id) {
      articleData.id = 'art-' + Date.now();
      articleData.createdAt = Date.now();
      articleData.views = 0;
    }
    articleData.updatedAt = Date.now();
    await this.put('articles', articleData);
    return articleData;
  }

  async deleteArticle(id) {
    // Soft-delete: mover a papelera (status = 'trash') en vez de borrar permanentemente
    const article = await this.get('articles', id);
    if (!article) return false;
    article.previousStatus = article.status;
    article.status = 'trash';
    article.trashedAt = Date.now();
    await this.put('articles', article);
    return true;
  }

  async restoreArticle(id) {
    const article = await this.get('articles', id);
    if (!article || article.status !== 'trash') return null;
    article.status = article.previousStatus || 'draft';
    delete article.trashedAt;
    delete article.previousStatus;
    await this.put('articles', article);
    return article;
  }

  async permanentDeleteArticle(id) {
    // Eliminación permanente real (solo para vaciar papelera)
    const comments = await this.getAll('comments');
    for (const c of comments) {
      if (c.articleId === id) {
        await this.delete('comments', c.id);
      }
    }
    return await this.delete('articles', id);
  }

  async getTrashedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'trash').sort((a, b) => b.trashedAt - a.trashedAt);
  }

  async getCommentsByArticle(articleId, onlyApproved = true) {
    const all = await this.getAll('comments');
    return all.filter(c => c.articleId === articleId && (!onlyApproved || c.status === 'approved'))
              .sort((a, b) => b.createdAt - a.createdAt);
  }

  async addComment(commentData) {
    if (!commentData.id) {
      commentData.id = 'comm-' + Date.now();
      commentData.createdAt = Date.now();
      commentData.status = 'pending'; // moderación requerida por defecto
    }
    await this.put('comments', commentData);
    return commentData;
  }

  async updateCommentStatus(id, newStatus, replyText = null) {
    const comm = await this.get('comments', id);
    if (!comm) return null;
    comm.status = newStatus;
    if (replyText !== null) {
      comm.teacherReply = replyText;
    }
    await this.put('comments', comm);
    return comm;
  }

  async deleteComment(id) {
    return await this.delete('comments', id);
  }

  async getAllMedia() {
    const items = await this.getAll('media');
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveMedia(mediaData) {
    if (!mediaData.id) {
      mediaData.id = 'media-' + Date.now();
      mediaData.createdAt = Date.now();
    }
    await this.put('media', mediaData);
    return mediaData;
  }

  async deleteMedia(id) {
    return await this.delete('media', id);
  }

  // ── Perfil Docente ──
  async getTeacherProfile() {
    const profile = await this.get('settings', 'teacherProfile');
    // Retornar defaults si no existe
    return profile || {
      key: 'teacherProfile',
      name: 'Docente',
      title: '',
      role: '',
      specialty: '',
      school: '',
      yearsExperience: 0,
      bio: '',
      photoUrl: '',
      updatedAt: Date.now()
    };
  }

  async updateTeacherProfile(updates) {
    const current = await this.getTeacherProfile();
    Object.assign(current, updates, { key: 'teacherProfile', updatedAt: Date.now() });
    await this.put('settings', current);
    return current;
  }
}

// Instancia global exportable
window.AulaAbiertaDB = new StorageService();

// === XSS Sanitization Utilities ===

// Sanitize rich HTML content — strips scripts, iframes, event handlers, dangerous tags
// Use for article body content that legitimately contains formatting (h2, p, strong, etc.)
function sanitizeHTML(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  // Remove dangerous tags
  div.querySelectorAll('script, iframe, object, embed, form, input').forEach(el => el.remove());
  // Remove event handlers and javascript: URLs
  div.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return div.innerHTML;
}
window.sanitizeHTML = sanitizeHTML;

// Escape plain text for safe insertion into HTML templates
// Use for author names, titles, summaries, comments — any user string in a template literal
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHTML = escapeHTML;

// === Non-blocking Toast Notification ===
window.showToast = function(message, type) {
  if (typeof type === 'string' && !['success','error','warning','info'].includes(type)) type = 'info';
  const toast = document.createElement('div');
  toast.className = 'toast-notification toast-' + (type || 'info');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;color:#fff;font-size:14px;z-index:9999;animation:fadeIn .3s ease;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
  toast.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
};

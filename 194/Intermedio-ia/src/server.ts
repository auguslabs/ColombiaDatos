import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'colombia-datos/1.0',
      }
    }
  });

  // Gemini Circuit Breaker Status
  let isGeminiCircuitBroken = false;
  let circuitBrokenUntil = 0;

  function triggerCircuitBreaker(cooldownMs = 180000) { // 3 minutes cooldown
    isGeminiCircuitBroken = true;
    circuitBrokenUntil = Date.now() + cooldownMs;
    console.warn(`[Gemini API] Circuit breaker triggered! Bypassing Gemini for background tasks until ${new Date(circuitBrokenUntil).toLocaleTimeString()}`);
  }

  function checkCircuitBreaker(): boolean {
    if (isGeminiCircuitBroken) {
      if (Date.now() > circuitBrokenUntil) {
        isGeminiCircuitBroken = false;
        return false;
      }
      return true;
    }
    return false;
  }

  // Intelligent retry wrapper for Gemini API to handle rate limits and resource exhaustion
  async function generateContentWithRetry(params: any, maxRetries = 2): Promise<any> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await ai.models.generateContent(params);
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        
        const isDailyLimit = 
          errorMsg.includes("exceeded your current quota") ||
          errorMsg.includes("GenerateRequestsPerDay") ||
          errorMsg.includes("free_tier_requests") ||
          errorMsg.includes("limit: 20") ||
          errorMsg.includes("Quota exceeded for metric");

        const isDepletedPrepay = 
          errorMsg.includes("prepayment") ||
          errorMsg.includes("depleted") ||
          errorMsg.includes("credits are depleted") ||
          errorMsg.includes("billing");
 
        const isRateLimit = 
          (error.status === 429 || 
          error.statusCode === 429 || 
          (error.error && error.error.code === 429) ||
          errorMsg.includes("RESOURCE_EXHAUSTED") || 
          errorMsg.includes("429") || 
          errorMsg.includes("quota") ||
          isDailyLimit) && !isDepletedPrepay;
        
        if (isDailyLimit || isDepletedPrepay) {
          // Trip the circuit breaker for 6 hours if we hit the daily quota or depleted prepayment limits
          triggerCircuitBreaker(6 * 60 * 60 * 1000); 
          console.warn(`[Gemini API] Daily/Prepay quota limit hit. Circuit breaker active for 6 hours. Throwing immediately without retry.`);
          throw error;
        }

        if (isRateLimit) {
          triggerCircuitBreaker(180000); // Trip the circuit breaker for 3 minutes
          if (attempt < maxRetries) {
            attempt++;
            // Weighted delay: 1.5s, 3s
            const delay = 1500 * attempt;
            console.warn(`[Gemini API] Rate limit (429/RESOURCE_EXHAUSTED) hit. Retrying attempt ${attempt}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
  }

  // Offline Heuristic Context Engine to generate smart objectives and shortcut recommendations without API hits
  function getOfflineContextAnalysis(messages: any[], sources: any[]) {
    const lastUserMsgEntry = [...(messages || [])].reverse().find((m: any) => m.role === 'user');
    const userText = (lastUserMsgEntry?.content || "").toLowerCase();

    let objective = "Búsqueda y análisis de Datos Abiertos";
    let shortcutChips = ["Explorar fuentes de datos", "Visualizar en tabla", "Verificar tendencias", "Filtros adicionales"];

    // ColombIA Datos Heuristic rules mapping
    if (userText.includes("contrat") || userText.includes("licit") || userText.includes("adjudic") || userText.includes("secop") || userText.includes("proveedor")) {
      objective = "Investigar contratación pública y SECOP";
      shortcutChips = ["Filtrar por mayor cuantía", "Ver contratos directos", "Agrupar por contratista", "Comparar por municipios"];
    } else if (userText.includes("presupuest") || userText.includes("gast") || userText.includes("invers") || userText.includes("hacienda") || userText.includes("pesos") || userText.includes("financ")) {
      objective = "Analizar presupuestos y gasto público";
      shortcutChips = ["Ver por sectores/rubros", "Histórico de variaciones", "Identificar gastos top", "Descargar datos fiscales"];
    } else if (userText.includes("turis") || userText.includes("viaje") || userText.includes("hotel") || userText.includes("extranjer") || userText.includes("marit") || userText.includes("vuelo")) {
      objective = "Consultar estadísticas de turismo";
      shortcutChips = ["Por origen de visitantes", "Ocupación de hoteles", "Evolución por trimestre", "Comparar departamentos"];
    } else if (userText.includes("salud") || userText.includes("hospit") || userText.includes("medic") || userText.includes("clin") || userText.includes("vacun") || userText.includes("enferm") || userText.includes("sisben")) {
      objective = "Revisar datos de salud pública colombiana";
      shortcutChips = ["Por departamentos", "Disponibilidad de camas", "Enfermedades comunes", "Presupuesto de salud"];
    } else if (userText.includes("educ") || userText.includes("coleg") || userText.includes("escuel") || userText.includes("univers") || userText.includes("matric") || userText.includes("icfes") || userText.includes("sena")) {
      objective = "Consultar el sistema educativo nacional";
      shortcutChips = ["Tasas de cobertura", "Colegios públicos vs privados", "Deserción escolar", "Estadísticas de pruebas"];
    } else if (userText.includes("transport") || userText.includes("via") || userText.includes("carreter") || userText.includes("peaj") || userText.includes("tránsito") || userText.includes("carro") || userText.includes("placa")) {
      objective = "Analizar infraestructura de transporte y vías";
      shortcutChips = ["Consultar proyectos viales", "Recaudo de peajes", "Accidentalidad vial", "Inversión departamental"];
    } else if (userText.includes("clima") || userText.includes("ambient") || userText.includes("lluv") || userText.includes("temperatur") || userText.includes("bosque") || userText.includes("deforesta") || userText.includes("rio") || userText.includes("agua")) {
      objective = "Monitorear datos ambientales y clima";
      shortcutChips = ["Niveles de lluvia", "Zonas protegidas", "Alertas ambientales", "Histórico de temperaturas"];
    } else if (userText.includes("demografia") || userText.includes("poblacion") || userText.includes("censo") || userText.includes("habit") || userText.includes("dane") || userText.includes("nacim")) {
      objective = "Analizar demografía y población (DANE)";
      shortcutChips = ["Pirámide poblacional", "Por cabeceras municipales", "Por géneros y edades", "Comparación de censos"];
    } else if (userText.includes("comput") || userText.includes("tecnolog") || userText.includes("internet") || userText.includes("celular") || userText.includes("mintic") || userText.includes("conec")) {
      objective = "Estudiar conectividad de Mintic";
      shortcutChips = ["Penetración de internet", "Escuelas conectadas", "Cobertura 4G/5G", "Presupuesto tecnológico"];
    } else if (userText.includes("hola") || userText.includes("buenos") || userText.includes("saludo") || userText.includes("quien") || userText.includes("eres") || userText.includes("ayuda")) {
      objective = "Introducción a ColombIA Datos";
      shortcutChips = ["¿De qué hay datos?", "Consultar contratación", "Analizar presupuesto", "Ayuda del sistema"];
    } else if (sources && sources.length > 0) {
      const mainSource = sources.find((s: any) => s.isActive) || sources[0];
      objective = `Explorar fuente: ${mainSource.name}`;
      shortcutChips = ["Consultar totalidad", "Agrupar por entidad", "Estructura de columnas", "Mostrar últimos registros"];
    }

    return { objective, shortcutChips };
  }

  // In-memory cache for context analysis to prevent redundant Gemini hits
  interface AnalysisCacheEntry {
    objective: string | null;
    shortcutChips: string[];
    createdAt: number;
  }
  const contextAnalysisCache = new Map<string, AnalysisCacheEntry>();
  const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes TTL

  function setInCache(key: string, value: { objective: string | null; shortcutChips: string[] }) {
    // Prevent memory leaks / infinite size
    if (contextAnalysisCache.size > 1000) {
      const firstKey = contextAnalysisCache.keys().next().value;
      if (firstKey) contextAnalysisCache.delete(firstKey);
    }
    contextAnalysisCache.set(key, { ...value, createdAt: Date.now() });
  }

  function getContextCacheKey(messages: any[], sources: any[]): string {
    const messagesKey = (messages || [])
      .slice(-5)
      .map((m: any) => `${m.role || ''}:${m.content || ''}`)
      .join('|');
    const sourcesKey = (sources || [])
      .map((s: any) => `${s.id || s.name || ''}`)
      .join(',');
    return `${messagesKey}###${sourcesKey}`;
  }

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { contents, systemInstruction, model, temperature, topP, topK } = req.body;
      
      // Log request for debugging
      fs.writeFileSync("server_debug.json", JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "request",
        contents,
        model,
        temperature,
        topP,
        topK,
        systemInstructionLength: systemInstruction?.length || 0
      }, null, 2));
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      // Sanitizar contents para evitar que partes vacías o sin texto causen error 400 en Gemini API
      const sanitizedContents = (contents || [])
        .map((chunk: any) => {
          if (!chunk || !Array.isArray(chunk.parts)) return null;
          const validParts = chunk.parts.filter((part: any) => part && typeof part.text === 'string' && part.text.trim() !== '');
          if (validParts.length === 0) return null;
          return {
            role: chunk.role || 'user',
            parts: validParts
          };
        })
        .filter(Boolean);

      const response = await generateContentWithRetry({
        model: model || "gemini-3.5-flash",
        contents: sanitizedContents,
        config: {
          systemInstruction,
          temperature: temperature !== undefined ? Number(temperature) : 1,
          topP: topP !== undefined ? Number(topP) : 0.95,
          topK: topK !== undefined ? Number(topK) : 64,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      
      // Log error for debugging
      try {
        fs.writeFileSync("server_debug.json", JSON.stringify({
          timestamp: new Date().toISOString(),
          type: "error",
          payload: req.body,
          errorMessage: errorMsg,
          errorStack: error.stack,
          errorStatus: error.status,
          errorResponseBody: error.response?.body || error.response
        }, null, 2));
      } catch (e) {}
      console.error("Gemini API Error:", error);
      
      // Check for quota error
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429") || errorMsg.includes("quota")) {
        const isDailyLimit = 
          errorMsg.includes("exceeded your current quota") ||
          errorMsg.includes("GenerateRequestsPerDay") ||
          errorMsg.includes("free_tier_requests") ||
          errorMsg.includes("limit: 20") ||
          errorMsg.includes("Quota exceeded for metric");

        const isDepletedPrepay = 
          errorMsg.includes("prepayment") ||
          errorMsg.includes("depleted") ||
          errorMsg.includes("credits are depleted") ||
          errorMsg.includes("billing");

        let msg = "Se ha alcanzado el límite de peticiones por minuto. Por favor, espera unos segundos e intenta de nuevo.";
        if (isDepletedPrepay) {
          msg = "Los créditos de prepago de la cuenta administradora de Gemini se han agotado. Configura tu propia GEMINI_API_KEY en el archivo .env para continuar sin límites.";
        } else if (isDailyLimit) {
          msg = "Se ha alcanzado el límite diario del plan gratuito (20 consultas diarias). Para continuar sin límites, configura tu propia GEMINI_API_KEY en el archivo .env.";
        }

        return res.status(429).json({ 
          error: "QUOTA_EXHAUSTED",
          message: msg
        });
      }

      // Check for model not found
      if (errorMsg.includes("NOT_FOUND") || errorMsg.includes("404")) {
        return res.status(404).json({
          error: "MODEL_NOT_FOUND",
          message: "El modelo de IA no está disponible en este momento. Hemos intentado usar gemini-3.5-flash. Por favor, contacta al administrador."
        });
      }

      res.status(500).json({ error: "INTERNAL_ERROR", message: errorMsg || "Error generating content" });
    }
  });

  app.post("/api/analyze-context", async (req, res) => {
    try {
      const { messages, sources } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      // Check the circuit breaker to bypass Gemini API if we hit rate limits recently
      if (checkCircuitBreaker()) {
        console.log("[analyze-context] Circuit breaker ACTIVE. Serving offline heuristics.");
        const fallbackResult = getOfflineContextAnalysis(messages, sources);
        return res.json(fallbackResult);
      }

      // 1. Resolve cache before invocation
      const cacheKey = getContextCacheKey(messages, sources);
      const cached = contextAnalysisCache.get(cacheKey);
      if (cached && (Date.now() - cached.createdAt < CACHE_TTL_MS)) {
        console.log(`[analyze-context] Cache HIT for key: ${cacheKey.substring(0, 40)}...`);
        return res.json({
          objective: cached.objective,
          shortcutChips: cached.shortcutChips
        });
      }

      console.log(`[analyze-context] Cache MISS. Invoking Gemini API...`);

      const activeSourcesStr = (sources || []).map((s: any) => `- ${s.name} (${s.entity}): ${s.description}`).join('\n');
      const chatSummary = (messages || []).map((m: any) => `${m.role === 'user' ? 'Ciudadano' : 'Sistema'}: ${m.content}`).join('\n');

      const systemInstruction = `Eres un asistente de investigación inteligente de la plataforma ColombIA Datos. Tu tarea es analizar de forma continua las consultas y el diálogo de un ciudadano sobre los Datos Abiertos de Colombia y las fuentes de datos dadas.
Debes realizar dos tareas sumamente útiles para el ciudadano:
1. Identificar con extrema precisión cuál es el objetivo o meta específica de su investigación actual (por ej., "Analizar presupuesto vial nacional de 2026", "Consultar el histórico de turismo marítimo", "Auditar contratación de alcaldías departamentales"). Debe ser súper corta (máximo 70 caracteres), directa y clara (en español formal pero elegante).
2. Generar exactamente entre 3 y 4 "chips de atajo" (shortcut chips) como sugerencias de preguntas, filtros o acciones concretas y contextuales de seguimiento de alta calidad, basándote en lo que el usuario ha consultado y las fuentes provistas. No respondas chips genéricos; personalízalos al tema actual de la pregunta. Súper cortos (máximo 40 caracteres cada uno), por ejemplo: "Ver por departamentos", "Comparar con 2024", "Relación de contratos directos", "Exportar a tabla".

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura, sin bloques de código Markdown ni explicaciones adicionales:
{
  "objective": "Resumen directo del objetivo de investigación detectado",
  "shortcutChips": ["Atajo 1", "Atajo 2", "Atajo 3", "Atajo 4"]
}`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: `FUENTES DISPONIBLES:\n${activeSourcesStr}\n\nHISTORIAL DE LA CONVERSACIÓN:\n${chatSummary}`,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      let resultText = (response.text || "{}").trim();
      
      // Cleanup any markdown codeblock response markers gracefully
      if (resultText.startsWith("```json")) {
        resultText = resultText.substring(7);
      } else if (resultText.startsWith("```")) {
        resultText = resultText.substring(3);
      }
      if (resultText.endsWith("```")) {
        resultText = resultText.substring(0, resultText.length - 3);
      }
      resultText = resultText.trim();

      const parsed = JSON.parse(resultText);
      const finalResult = {
        objective: parsed.objective || null,
        shortcutChips: Array.isArray(parsed.shortcutChips) ? parsed.shortcutChips : []
      };

      // Set to in-memory cache
      setInCache(cacheKey, finalResult);

      res.json(finalResult);
    } catch (error: any) {
      console.log("[analyze-context] Graceful fallback to offline heuristics activated. API Status:", error?.status || error?.message || error);
      // Fallback instantly if there's any API exception (429 or other) to guarantee continuous premium service
      try {
        const { messages, sources } = req.body;
        const fallbackResult = getOfflineContextAnalysis(messages, sources);
        res.json(fallbackResult);
      } catch (childError) {
        res.json({
          objective: null,
          shortcutChips: []
        });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

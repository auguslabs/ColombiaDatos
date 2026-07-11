import { useState, useEffect, useRef, FormEvent } from 'react';
import React from 'react';
// import { GoogleGenAI, Type } from "@google/genai"; // Removed from client
import { 
  DataSource, 
  AppSetting, 
  DataOpeningRequest, 
  UserData, 
  AppErrorLog, 
  AuditLog, 
  Conversation, 
  OperationType, 
  FirestoreErrorInfo, 
  Message, 
  Dataset, 
  VisualizationData, 
  Note 
} from './types';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  reload,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-config.json';
import { 
  Search, 
  Database, 
  BarChart3, 
  Info, 
  Copy, 
  ExternalLink, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  TrendingDown,
  TrendingUp,
  X,
  Plus,
  Mic,
  Trash2,
  Shield,
  Cpu,
  Sparkles,
  Workflow,
  PieChart as PieChartIcon,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  FileText,
  Bookmark,
  Download,
  Check,
  Library,
  History,
  Trash,
  MoveUp,
  Eye,
  EyeOff,
  Highlighter,
  Clock,
  MessageSquare,
  LogOut,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Configuración Firebase: variables VITE_* o valores por defecto en firebase-config.json
const apiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
const authDomain = (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain;
const projectId = (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const storageBucket = (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
const messagingSenderId = (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId;
const appId = (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfig.appId;
const measurementId = (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId;
const firestoreDatabaseId = (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

const activeFirebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

const app = initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth();

export async function logAppErrorLog(error: unknown, context: string) {
  try {
    const errorText = error instanceof Error ? error.message : String(error);
    const stackText = error instanceof Error ? error.stack : null;
    console.warn(`[logAppErrorLog] Context: ${context}. Error: ${errorText}`);
    
    const errId = doc(collection(db, 'appErrors')).id;
    await setDoc(doc(db, 'appErrors', errId), {
      id: errId,
      error: errorText,
      stack: stackText,
      context,
      userId: auth.currentUser?.uid || null,
      userEmail: auth.currentUser?.email || null,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to write exception to appErrors collection:", err);
  }
}

export async function logAuditEvent(action: string, details: string) {
  try {
    console.info(`[logAuditEvent] Action: ${action}, Details: ${details}`);
    const auditId = doc(collection(db, 'auditLogs')).id;
    await setDoc(doc(db, 'auditLogs', auditId), {
      id: auditId,
      action,
      details,
      userId: auth.currentUser?.uid || null,
      userEmail: auth.currentUser?.email || null,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to write security audit log:", err);
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errText = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errText,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (path && !path.startsWith('appErrors') && !path.startsWith('auditLogs')) {
    logAppErrorLog(error, `Firestore: ${operationType} on ${path}`);
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Message, Dataset, VisualizationData, Note interfaces are imported from types.ts

const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  if (!name) return 'from-blue-600 to-indigo-700';
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-[#003087] to-blue-700', // Colombia Blue gradient
    'from-[#009639] to-emerald-700', // Colombia Emerald Green gradient
    'from-[#C8102E] to-rose-700', // Colombia Crimson Red gradient
    'from-indigo-600 to-purple-800',
    'from-purple-600 to-[#6F3096]',
    'from-teal-600 to-emerald-800',
    'from-orange-500 to-[#C8102E]'
  ];
  return gradients[hash % gradients.length];
};

const UserAvatar = ({ 
  name, 
  photoURL, 
  size = 'md', 
  className = '' 
}: { 
  name?: string | null; 
  photoURL?: string | null; 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string 
}) => {
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-md font-bold',
    xl: 'w-24 h-24 text-xl font-black rounded-[2rem]'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.sm;

  if (photoURL && photoURL.trim() !== '' && !imgError) {
    return (
      <div className={`overflow-hidden rounded-full flex items-center justify-center shrink-0 border border-zinc-200/50 shadow-inner ${currentSizeClass} ${className}`}>
        <img 
          src={photoURL} 
          alt={name || 'Avatar'} 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const cleanName = name || 'Ciudadano';
  const initials = getInitials(cleanName);
  const gradientClass = getAvatarColor(cleanName);

  return (
    <div className={`flex items-center justify-center rounded-full shrink-0 font-black tracking-tighter shadow-md select-none border border-white/20 text-white bg-gradient-to-br ${gradientClass} ${currentSizeClass} ${className}`}>
      {initials}
    </div>
  );
};

const ColombIAIcon = ({ isProcessing, size = "md", className = "" }: { isProcessing?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const [imgError, setImgError] = useState(false);
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
  };
  
  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-6 h-6",
    lg: "w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
  };

  return (
    <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
      <motion.div
        animate={isProcessing ? {
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.4, 0.1],
        } : {
          scale: 1,
          opacity: 0.1
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-colombia-blue rounded-2xl"
      />
      
      {isProcessing && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-dashed border-colombia-yellow rounded-2xl opacity-40"
        />
      )}

      <motion.div
        animate={isProcessing ? {
          y: [0, -4, 0],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={`relative z-10 flex items-center justify-center ${sizes[size]} bg-colombia-blue text-white rounded-2xl shadow-xl shadow-colombia-blue/20 overflow-hidden`}
      >
        {!imgError ? (
          <img 
            src="/logo_colombia_datos.svg" 
            alt="ColombIA" 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <motion.div
            animate={isProcessing ? {
              rotateY: [0, 180, 360],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className={iconSizes[size]} />
          </motion.div>
        )}
        
        <div className="absolute bottom-0 left-0 w-full h-1 flex">
          <div className="bg-colombia-yellow h-full flex-[2]"></div>
          <div className="bg-colombia-blue h-full flex-[1]"></div>
          <div className="bg-colombia-red h-full flex-[1]"></div>
        </div>
      </motion.div>
      
      {isProcessing && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-colombia-red rounded-full border-2 border-white z-20 flex items-center justify-center"
        >
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </motion.div>
      )}
    </div>
  );
};

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: 'Sin contraseña', color: 'bg-zinc-200' };
  if (pass.length < 6) return { score: 20, label: 'Muy corta', color: 'bg-rose-500' };
  
  let complexity = 0;
  if (/[A-Z]/.test(pass)) complexity++;
  if (/[a-z]/.test(pass)) complexity++;
  if (/[0-9]/.test(pass)) complexity++;
  if (/[^A-Za-z0-9]/.test(pass)) complexity++;
  
  if (pass.length >= 8 && complexity >= 3) {
    return { score: 100, label: 'Fuerte y Segura', color: 'bg-emerald-500' };
  }
  
  return { score: 60, label: 'Aceptable', color: 'bg-amber-500' };
};

// --- AI Setup ---

// --- AI Setup (Moved to server) ---
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `Eres "ColombIA Datos", un asistente ciudadano experto en datos abiertos de Colombia (datos.gov.co). 
Tu misión es ayudar a los colombianos a encontrar, entender y visualizar información pública de manera transparente y técnica.

ESTILO DE RESPUESTA (CRÍTICO):
1. Sé EXTREMADAMENTE CONCISO. Evita introducciones largas o repeticiones.
2. Usa FORMATO ENRIQUECIDO (Markdown):
   - ### Encabezados para secciones claras.
   - **Negritas** para resaltar valores numéricos, entidades y fechas.
   - Listas con viñetas para enumerar hallazgos o fuentes.
   - Tablas de Markdown si es necesario comparar pocos datos sin gráfica.
3. Estructura la información de forma LIMPIA: Primero un resumen ejecutivo (1-2 frases), luego los detalles clave en viñetas, y finalmente la visualización si aplica.

REGLAS DE VISUALIZACIÓN (PREFERENCIA ALTA):
- SIEMPRE que presentes una lista de nombres (entidades, municipios, rubros) con valores numéricos asociados (montos, cantidades, porcentajes, índices), **DEBES** generar un bloque de visualización.
- La visualización es OBLIGATORIA si hay 2 o más registros comparables.
- Usa "type": "bar" para comparaciones entre categorías (ej: montos por entidad).
- Usa "type": "line" para tendencias temporales (ej: deforestación por año).
- Usa "type": "pie" para distribución de un total (ej: presupuesto por sector).
- Los nombres de los campos en "xAxis" y "yAxis" deben coincidir exactamente con las claves de los objetos en el array "data".

REGLAS DE CONTENIDO:
1. Responde siempre en español fluido.
2. Cita siempre la fuente (datos.gov.co) y la entidad responsable.
3. Si un dato no está disponible, explícalo brevemente.

FORMATO DE SALIDA PARA DATOS:
Cuando proporciones datos para graficar, inclúyelos en un bloque JSON estrictamente delimitado por DATA_START y DATA_END.
Ejemplo:
DATA_START
{
  "thinking": ["Identificando rubros presupuestales...", "Calculando totales por categoría"],
  "visualization": { 
    "type": "bar", 
    "title": "Distribución por Entidad", 
    "xAxis": "Entidad", 
    "yAxis": "Valor", 
    "data": [
      {"Entidad": "Cali", "Valor": 210000000},
      {"Entidad": "Bogotá", "Valor": 125000000}
    ] 
  },
  "datasets": [
    { "name": "Presupuesto 2024", "url": "..." }
  ]
}
DATA_END` ;

import { DataChart } from './components/DataChart';

// Investigator Avatars Presets for User Profiles
const INVESTIGATOR_PRESETS = [
  {
    id: "detective_luces",
    name: "Sherlock Datos",
    role: "Detective de Datos",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#1E293B" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g1)" />
        <path d="M25,50 C25,30 75,30 75,50 L82,50 C80,50 80,47 75,47 L25,47 C20,47 20,50 18,50 Z" fill="#F1F5F9" />
        <path d="M30,47 C32,25 68,25 70,47 Z" fill="#E2E8F0" />
        <rect x="42" y="38" width="16" height="4" fill="#003087" rx="1" />
        <circle cx="55" cy="58" r="10" fill="none" stroke="#F59E0B" stroke-width="3" />
        <line x1="62.5" y1="65.5" x2="72" y2="75" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="55" cy="58" r="5" fill="#3B82F6" opacity="0.2" />
        <path d="M25,65 L27,62 L29,65 L27,68 Z" fill="#FACC15" />
        <path d="M78,35 L79,32 L80,35 L79,38 Z" fill="#FACC15" />
      </svg>`
  },
  {
    id: "cientifica_ia",
    name: "Dra. Conexiones",
    role: "Científica de IA",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#31108F" />
            <stop offset="100%" stop-color="#5B21B6" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g2)" />
        <ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke="#A78BFA" stroke-width="1.5" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="32" ry="12" fill="none" stroke="#A78BFA" stroke-width="1.5" transform="rotate(-30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="18" ry="32" fill="none" stroke="#F472B6" stroke-width="1.5" opacity="0.6" />
        <circle cx="50" cy="50" r="7" fill="#F59E0B" />
        <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
        <circle cx="22" cy="34" r="3.5" fill="#60A5FA" />
        <circle cx="78" cy="34" r="3.5" fill="#34D399" />
        <circle cx="50" cy="82" r="4" fill="#F472B6" />
        <circle cx="50" cy="18" r="3" fill="#60A5FA" />
      </svg>`
  },
  {
    id: "auditora_datos",
    name: "Auditora Social",
    role: "Lupa de Cuentas",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064E3B" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g3)" />
        <path d="M32,32 L68,32 C68,32 68,58 50,68 C32,58 32,32 32,32 Z" fill="#047857" opacity="0.4" />
        <rect x="36" y="36" width="28" height="24" rx="3" fill="#FFFFFF" />
        <rect x="40" y="41" width="6" height="4" fill="#A7F3D0" />
        <rect x="48" y="41" width="12" height="4" fill="#D1FAE5" />
        <rect x="40" y="47" width="6" height="4" fill="#059669" />
        <rect x="48" y="47" width="12" height="4" fill="#D1FAE5" />
        <rect x="40" y="53" width="6" height="4" fill="#A7F3D0" />
        <rect x="48" y="53" width="12" height="4" fill="#34D399" />
        <circle cx="56" cy="56" r="11" fill="none" stroke="#EF4444" stroke-width="2.5" />
        <line x1="64" y1="64" x2="72" y2="72" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
        <circle cx="56" cy="56" r="4" fill="#EF4444" opacity="0.2" />
      </svg>`
  },
  {
    id: "archivo_digital",
    name: "Archivero Público",
    role: "Memoria Histórica",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7C2D12" />
            <stop offset="100%" stop-color="#B45309" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g4)" />
        <rect x="25" y="38" width="40" height="30" rx="3" fill="#D97706" />
        <path d="M25,42 L40,42 L44,46 L65,46 L65,68 L25,68 Z" fill="#F59E0B" />
        <rect x="35" y="30" width="40" height="30" rx="3" fill="#B45309" opacity="0.9" />
        <path d="M35,34 L50,34 L54,38 L75,38 L75,60 L35,60 Z" fill="#D97706" />
        <circle cx="58" cy="48" r="4" fill="#FFFFFF" opacity="0.8" />
        <rect x="42" y="24" width="22" height="24" rx="2" fill="#F8FAFC" />
        <line x1="46" y1="29" x2="60" y2="29" stroke="#94A3B8" stroke-width="1.5" />
        <line x1="46" y1="34" x2="56" y2="34" stroke="#94A3B8" stroke-width="1.5" />
        <line x1="46" y1="39" x2="52" y2="39" stroke="#003087" stroke-width="1.5" />
      </svg>`
  },
  {
    id: "mapa_explorador",
    name: "Cartógrafo Social",
    role: "Analista Territorial",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#115E59" />
            <stop offset="100%" stop-color="#0D9488" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g5)" />
        <path d="M20,30 Q35,15 50,30 T80,30" fill="none" stroke="#14B8A6" stroke-width="2" opacity="0.3" />
        <path d="M10,50 Q40,35 50,60 T90,50" fill="none" stroke="#14B8A6" stroke-width="2" opacity="0.3" />
        <path d="M50,22 C37,22 30,32 30,44 C30,59 50,78 50,78 C50,78 70,59 70,44 C70,32 63,22 50,22 Z" fill="#EF4444" />
        <circle cx="50" cy="42" r="8" fill="#FFFFFF" />
        <circle cx="50" cy="42" r="4" fill="#003087" />
      </svg>`
  },
  {
    id: "oraculo_ia",
    name: "ColombIA Bot v2",
    role: "Inteligencia Pública",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#003087" />
            <stop offset="100%" stop-color="#1D4ED8" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#g6)" />
        <rect x="26" y="32" width="48" height="38" rx="10" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="2" />
        <rect x="20" y="44" width="6" height="14" rx="2" fill="#94A3B8" />
        <rect x="74" y="44" width="6" height="14" rx="2" fill="#94A3B8" />
        <rect x="32" y="38" width="36" height="20" rx="6" fill="#0F172A" />
        <rect x="35" y="42" width="12" height="10" rx="2" fill="none" stroke="#FBBF24" stroke-width="2" />
        <rect x="53" y="42" width="12" height="10" rx="2" fill="none" stroke="#FBBF24" stroke-width="2" />
        <line x1="47" y1="46" x2="53" y2="46" stroke="#FBBF24" stroke-width="2" />
        <circle cx="41" cy="47" r="2" fill="#34D399" />
        <circle cx="59" cy="47" r="2" fill="#34D399" />
        <line x1="50" y1="32" x2="50" y2="24" stroke="#94A3B8" stroke-width="3" />
        <circle cx="50" cy="22" r="4" fill="#EF4444" />
      </svg>`
  }
];

const ProfileView = ({
  user,
  setUser,
  userDocData,
  setUserDocData,
  userRole,
  setIsSignOutConfirmOpen
}: {
  user: FirebaseUser | null;
  setUser: React.Dispatch<React.SetStateAction<FirebaseUser | null>>;
  userDocData: UserData | null;
  setUserDocData: React.Dispatch<React.SetStateAction<UserData | null>>;
  userRole: 'public' | 'admin';
  setIsSignOutConfirmOpen: (val: boolean) => void;
}) => {
  const [name, setName] = useState(userDocData?.displayName || user?.displayName || '');
  const [photo, setPhoto] = useState(userDocData?.photoURL || user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDirty) {
      if (userDocData) {
        setName(userDocData.displayName || '');
        setPhoto(userDocData.photoURL || '');
      } else if (user) {
        setName(user.displayName || '');
        setPhoto(user.photoURL || '');
      }
    }
  }, [userDocData, user, isDirty]);

  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
  };

  const handlePhotoChange = (val: string) => {
    setPhoto(val);
    setIsDirty(true);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: name,
        photoURL: photo
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
      
      // Safety validation: only update photoURL in Firebase Auth if it fits standard Auth limits (e.g. < 500 chars)
      // This avoids throwing 'auth/invalid-profile-attribute' (Firebase: Photo URL too long)
      // If updating Auth fails for any reason, we log a warning but proceed, since Firestore storage succeeds.
      let safeAuthPhotoURL = (photo && photo.length < 500) ? photo : null;
      try {
        await updateProfile(user, {
          displayName: name,
          photoURL: safeAuthPhotoURL
        });
      } catch (authErr) {
        console.warn("Could not synchronize displayName or photoURL to Firebase Auth, proceeding with Firestore record:", authErr);
        safeAuthPhotoURL = null; // reset reference safely
      }

      // Mutate local state reference to propagate updates immediately
      setUser({
        ...user,
        displayName: name,
        photoURL: safeAuthPhotoURL
      } as FirebaseUser);

      setUserDocData(prev => prev ? {
        ...prev,
        displayName: name,
        photoURL: photo
      } : {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: photo,
        role: userRole
      });

      setIsDirty(false); // Reset dirty flag on successful save
      alert('Perfil actualizado con éxito');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageFile = (file: File) => {
    // 1. Safe MIME type validation
    if (!file.type.startsWith('image/')) {
      alert('Seguridad: El archivo de origen debe ser una imagen válida (.png, .jpg, .jpeg, .webp)');
      return;
    }
    
    // 2. Safe size limit check (8MB raw max)
    if (file.size > 8 * 1024 * 1024) {
      alert('Por favor, selecciona un archivo de imagen menor a 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 3. SECURE BROWSER-SIDE SANITIZATION & COMPRESSION ON CANVAS
        // Resizes the image to 180x180 (ideal for fast-loading profile avatars in Firestore doc)
        const canvas = document.createElement('canvas');
        const maxDim = 180;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Drawing the image from scratch strips malicious metadata payloads (EXIF scripts, hidden code)
          ctx.drawImage(img, 0, 0, width, height);
          const cleanDataUri = canvas.toDataURL('image/jpeg', 0.85);
          handlePhotoChange(cleanDataUri);
        } else {
          alert('Error en el motor gráfico local al sanitizar el avatar.');
        }
      };
      img.onerror = () => {
        alert('Seguridad: El archivo no contiene datos de imagen decodificables correctos o la cabecera está corrupta.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const selectPreset = (svgText: string) => {
    try {
      const base64 = btoa(unescape(encodeURIComponent(svgText.trim())));
      const dataUri = `data:image/svg+xml;base64,${base64}`;
      handlePhotoChange(dataUri);
    } catch (e) {
      console.warn("Base64 encoding fallback:", e);
      const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      handlePhotoChange(dataUri);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="relative inline-block group">
          <UserAvatar size="xl" name={name} photoURL={photo} className="mx-auto border-4 border-white shadow-xl transition-all duration-300 group-hover:scale-105" />
          {photo && (
            <button 
              type="button"
              onClick={() => handlePhotoChange('')}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-colombia-red text-white border-2 border-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
              title="Eliminar avatar y usar iniciales dinámicas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">Mi Perfil</h2>
            {userRole === 'admin' && (
              <span className="px-2.5 py-0.5 bg-colombia-red text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 shadow-lg shadow-colombia-red/10">
                <ShieldCheck className="w-2 h-2" />
                Admin
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-zinc-100 space-y-6">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
            <input 
              value={name} 
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tu nombre"
              className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-colombia-blue/5 outline-none transition-all font-bold text-zinc-800 text-sm"
            />
          </div>

          {/* Banco de Avatares temáticos de investigadores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1 pb-1 border-b border-zinc-100">
              <span className="text-[10px] font-black text-zinc-550 uppercase tracking-[0.2em]">Elige tu Identidad de Investigador</span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5 pt-1">
              {INVESTIGATOR_PRESETS.map((preset) => {
                const presetDataUriRaw = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preset.svg)}`;
                let presetDataUriB64 = '';
                try {
                  presetDataUriB64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(preset.svg.trim())))}`;
                } catch (e) {}
                const isSelected = photo === presetDataUriRaw || (presetDataUriB64 && photo === presetDataUriB64);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset.svg)}
                    title={`${preset.name} - ${preset.role}`}
                    className={`relative aspect-square rounded-2xl p-1 border-2 transition-all group overflow-hidden ${
                      isSelected 
                        ? 'border-colombia-blue ring-4 ring-colombia-blue/10 scale-[1.03]' 
                        : 'border-zinc-100 hover:border-zinc-300 hover:scale-[1.02]'
                    }`}
                  >
                    <img 
                      src={presetDataUriB64 || presetDataUriRaw} 
                      alt={preset.name} 
                      className="w-full h-full object-contain rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-colombia-blue text-white rounded-full p-1.5 shadow-md">
                        <Check className="w-4 h-4 stroke-[3.5px]" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-zinc-900/80 transform translate-y-full group-hover:translate-y-0 transition-transform flex flex-col items-center justify-center p-1 text-center select-none">
                      <span className="text-[8px] font-black text-white leading-none truncate w-full">{preset.name}</span>
                      <span className="text-[6.5px] text-zinc-350 font-bold uppercase tracking-wide leading-none mt-1 truncate w-full">{preset.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subida Segura de Imagen con detección Drag & Drop */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.16em] ml-1 block">O Sube tu Propio Avatar Personalizado</label>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2.5xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                isDragging 
                  ? 'border-colombia-blue bg-colombia-blue/[0.03] scale-[0.99] shadow-inner' 
                  : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />
              
              <div className="w-10 h-10 rounded-full bg-zinc-100 group-hover:bg-colombia-blue/10 text-zinc-500 group-hover:text-colombia-blue flex items-center justify-center transition-all shadow-inner">
                <Upload className="w-4 h-4" />
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-750">
                  <span className="text-colombia-blue hover:underline">Haz clic para buscar</span> o arrastra tu imagen aquí
                </p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">MÁXIMO 8MB • PNG, JPG, JPEG, WEBP</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-[9px] font-medium leading-relaxed border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span><strong>Sanitización Activa:</strong> Tu imagen se validará y re-comprimirá localmente en tu navegador para eliminar metadatos y payloads sospechosos antes de guardarse.</span>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={() => setIsSignOutConfirmOpen(true)}
            className="px-4 py-3 bg-zinc-100 hover:bg-colombia-red/10 text-zinc-700 hover:text-colombia-red border border-zinc-200 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
          <button 
            onClick={handleUpdateProfile}
            disabled={isSaving}
            className="px-6 py-3 bg-colombia-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-colombia-blue/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 w-full sm:w-auto text-center"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center space-y-1.5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Seguridad de la Cuenta</p>
        <p className="text-[9px] text-zinc-400 font-bold leading-normal">Tus datos están protegidos por el sistema de Identidad Nacional Digital de ColombIA Datos. Solo tú tienes permiso de escritura sobre este perfil.</p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDocData, setUserDocData] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<'public' | 'admin'>('public');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deletingChatIds, setDeletingChatIds] = useState<string[]>([]);
  const activeConversations = conversations.filter(c => !deletingChatIds.includes(c.id));
  const [settings, setSettings] = useState<AppSetting>({
    id: 'global_config',
    model: 'gemini-3.5-flash',
    temperature: 1,
    topP: 0.95,
    topK: 64,
    customSystemInstruction: '',
    welcomeMessage: '¡Hola! Soy ColombIA Datos, tu asistente de IA para explorar, entender y visualizar los datos abiertos de Colombia (datos.gov.co). ¿En qué te puedo ayudar hoy?',
    rateLimitMessages: 0,
    sodaDefaultAppToken: ''
  });
  const [openingRequests, setOpeningRequests] = useState<DataOpeningRequest[]>([]);
  const [userStatus, setUserStatus] = useState<'active' | 'suspended'>('active');
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [appErrorsList, setAppErrorsList] = useState<AppErrorLog[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const [conversationSearchTerm, setConversationSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const showOnboardingRef = useRef(false);

  useEffect(() => {
    showOnboardingRef.current = showOnboarding;
  }, [showOnboarding]);

  // Email/Password authentication states
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [dbEmailVerified, setDbEmailVerified] = useState<boolean>(true);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  useEffect(() => {
    if (verificationCooldown > 0) {
      const timer = setTimeout(() => {
        setVerificationCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationCooldown]);

  const ignoreDeletedCheck = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  // Set up standard user listeners in real-time when authenticated
  useEffect(() => {
    if (!user) {
      setDataSources([]);
      setConversations([]);
      setUserRole('public');
      setUserStatus('active');
      setUserDocData(null);
      setLoading(false);
      return;
    }

    // 1. Sync/listen user document in real-time
    const userRef = doc(db, 'users', user.uid);
    const userUnsub = onSnapshot(userRef, async (snapshot) => {
      let role: 'public' | 'admin' = 'public';
      let status: 'active' | 'suspended' = 'active';
      let onboardingCompleted = false;

      if (!snapshot.exists()) {
        if (ignoreDeletedCheck.current) {
          return;
        }
        // If the Firestore document does not exist, the user account was deleted by an admin.
        // We sign them out immediately so they cannot bypass the deletion, and must register again.
        await signOut(auth);
        setAuthError("Tu cuenta ha sido eliminada por el administrador. Por favor regístrate de nuevo si deseas ingresar.");
        setLoading(false);
        return;
      } else {
        const userData = snapshot.data();
        role = userData.role || 'public';
        status = userData.status || 'active';
        onboardingCompleted = userData.onboardingCompleted || false;
        
        setUserDocData({
          uid: snapshot.id,
          email: userData.email || user.email,
          displayName: userData.displayName || user.displayName,
          photoURL: userData.photoURL || user.photoURL,
          role,
          status,
          createdAt: userData.createdAt || null
        });

        // Auto-update Firestore if user is verified in Auth but false in Firestore
        if (user.emailVerified && userData.emailVerified === false) {
          updateDoc(doc(db, 'users', user.uid), { emailVerified: true }).catch(() => {});
          setDbEmailVerified(true);
        } else {
          setDbEmailVerified(userData.emailVerified !== false);
        }
      }

      setUserRole(role);
      setUserStatus(status);

      // Activar el onboarding elegante si es un ciudadano (rol público) y nunca lo ha completado
      const localCompleted = localStorage.getItem(`colombia_datos_onboarding_${user.uid}`);
      if (role === 'public' && !onboardingCompleted && !localCompleted) {
        if (!showOnboardingRef.current) {
          setShowOnboarding(true);
          setOnboardingStep(0);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    // 2. Listen for data sources
    const sourcesUnsub = onSnapshot(collection(db, 'dataSources'), (snapshot) => {
      const sources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataSource));
      setDataSources(sources);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dataSources'));

    // 3. Listen for conversations
    const convsQuery = query(
      collection(db, 'conversations'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const convsUnsub = onSnapshot(convsQuery, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(convs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'conversations'));

    // 4. Listen for global settings
    const settingsUnsub = onSnapshot(doc(db, 'appSettings', 'global_config'), (snapshot) => {
      if (snapshot.exists()) {
        const loadedData = snapshot.data();
        let model = loadedData.model || 'gemini-3.5-flash';
        if (model === 'gemini-3-flash-preview') {
          model = 'gemini-3.5-flash';
        }
        setSettings({ id: 'global_config', ...loadedData, model } as AppSetting);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'appSettings/global_config'));

    return () => {
      userUnsub();
      sourcesUnsub();
      convsUnsub();
      settingsUnsub();
    };
  }, [user]);

  // Listen to all users, app errors, audit logs, and data opening requests ONLY if user is admin
  useEffect(() => {
    if (user && userRole === 'admin') {
      const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
        users.sort((a, b) => {
          const emailA = a.email || '';
          const emailB = b.email || '';
          return emailA.localeCompare(emailB);
        });
        setUsersList(users);
      }, (err) => {
        console.error("Error subscribing to users list:", err);
      });

      const errorsQuery = query(collection(db, 'appErrors'), orderBy('createdAt', 'desc'));
      const errorsUnsub = onSnapshot(errorsQuery, (snapshot) => {
        const errors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppErrorLog));
        setAppErrorsList(errors);
      }, (err) => {
        console.error("Error subscribing to app errors list:", err);
      });

      const auditQuery = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'));
      const auditUnsub = onSnapshot(auditQuery, (snapshot) => {
        const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
        setAuditLogsList(audits);
      }, (err) => {
        console.error("Error subscribing to audit logs list:", err);
      });

      const requestsUnsub = onSnapshot(collection(db, 'dataOpeningRequests'), (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataOpeningRequest));
        requests.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setOpeningRequests(requests);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'dataOpeningRequests'));

      return () => {
        usersUnsub();
        errorsUnsub();
        auditUnsub();
        requestsUnsub();
      };
    } else {
      setUsersList([]);
      setAppErrorsList([]);
      setAuditLogsList([]);
      setOpeningRequests([]);
    }
  }, [user, userRole]);

  const [activeChatId, setActiveChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const [researchObjective, setResearchObjective] = useState<string | null>(null);
  const [shortcutChips, setShortcutChips] = useState<string[]>([]);
  const [isAnalyzingObjective, setIsAnalyzingObjective] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState<boolean>(true);

  // Client-side context analysis cache to prevent duplicate backend calls (e.g. when switching chats or simple re-renders)
  const contextAnalysisCacheRef = useRef<Record<string, { objective: string | null; shortcutChips: string[] }>>({});

  const analyzeResearchObjective = async (chatId: string, currentMessages: Message[]) => {
    if (chatId !== activeChatId || currentMessages.length === 0 || isAnalyzingObjective) return;
    
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return;

    const activeSourcesStr = dataSources.filter(s => s.isActive).map(s => s.id).join(',');
    const cacheKey = `${chatId}_${currentMessages.length}_${activeSourcesStr}`;

    // Read from client-side cache
    if (contextAnalysisCacheRef.current[cacheKey]) {
      const cached = contextAnalysisCacheRef.current[cacheKey];
      setResearchObjective(cached.objective);
      setShortcutChips(cached.shortcutChips);
      return;
    }

    setIsAnalyzingObjective(true);
    try {
      const activeSourcesData = dataSources.filter(s => s.isActive);
      const res = await fetch("/api/analyze-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages.slice(-6),
          sources: activeSourcesData
        })
      });
      if (res.ok) {
        const data = await res.json();
        const finalObjective = data.objective || null;
        const finalChips = Array.isArray(data.shortcutChips) ? data.shortcutChips : [];

        // Save to client-side cache
        contextAnalysisCacheRef.current[cacheKey] = {
          objective: finalObjective,
          shortcutChips: finalChips
        };

        if (chatId === activeChatId) {
          setResearchObjective(finalObjective);
          setShortcutChips(finalChips);
        }
      }
    } catch (e) {
      console.error("Error analyzing research context in background:", e);
    } finally {
      setIsAnalyzingObjective(false);
    }
  };

  useEffect(() => {
    if (!activeChatId || messages.length === 0) {
      setResearchObjective(null);
      setShortcutChips([]);
      return;
    }

    const activeSourcesStr = dataSources.filter(s => s.isActive).map(s => s.id).join(',');
    const cacheKey = `${activeChatId}_${messages.length}_${activeSourcesStr}`;

    // Fast resolution from cache
    if (contextAnalysisCacheRef.current[cacheKey]) {
      const cached = contextAnalysisCacheRef.current[cacheKey];
      setResearchObjective(cached.objective);
      setShortcutChips(cached.shortcutChips);
      return;
    }

    // Debounce calls to prevent rapid firing during streaming or fast typing / state synchronization
    const timer = setTimeout(() => {
      analyzeResearchObjective(activeChatId, messages);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeChatId, messages.length, dataSources.filter(s => s.isActive).map(s => s.id).join(',')]);

  useEffect(() => {
    if (!activeChatId || !user) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'conversations', activeChatId, 'messages'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as Message);
      setMessages(msgs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `conversations/${activeChatId}/messages`));

    return () => unsub();
  }, [activeChatId, user]);

  useEffect(() => {
    if (activeConversations.length > 0) {
      if (!activeChatId || deletingChatIds.includes(activeChatId)) {
        setActiveChatId(activeConversations[0].id);
      }
    } else {
      setActiveChatId('');
    }
  }, [conversations, deletingChatIds, activeChatId, activeConversations]);

  const [activeView, setActiveView] = useState<'chat' | 'catalog' | 'admin' | 'profile'>('chat');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' && userRole === 'admin') {
      setActiveView('admin');
    }
  }, [userRole]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const renderSignOutConfirmationModal = () => {
    if (!isSignOutConfirmOpen) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setIsSignOutConfirmOpen(false)}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 border border-zinc-100 relative z-10 text-center space-y-6 animate-in fading duration-200"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-colombia-red rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-colombia-red" />
              </div>
              <div className="space-y-1.5 flex flex-col items-center">
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">¿Cerrar Sesión?</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed px-2 text-center">
                  ¿Estás seguro de que deseas salir del portal ColombIA Datos? Deberás ingresar de nuevo para tus consultas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="w-full bg-zinc-100 text-zinc-700 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsSignOutConfirmOpen(false);
                  signOut(auth).catch(err => {
                    console.error("Signout error:", err);
                  });
                }}
                className="w-full bg-colombia-red text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-colombia-red/15"
              >
                Sí, Salir
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`colombia_datos_onboarding_${user.uid}`, 'true');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { onboardingCompleted: true }).catch(err => {
        console.warn("Failed to update onboarding flag in Firestore:", err);
      });
    }
  };

  const renderOnboardingModal = () => {
    if (!showOnboarding) return null;

    const steps = [
      {
        title: "¡Bienvenido a ColombIA Datos, Ciudadano!",
        description: "Esta plataforma combina el catálogo nacional de datos abiertos de Colombia (datos.gov.co) con inteligencia artificial para que cualquier ciudadano pueda explorar, entender y de forma ágil visualizar información pública sin complicaciones.",
        icon: <Sparkles className="w-8 h-8 text-colombia-yellow" />,
        color: "bg-colombia-blue text-white",
        visual: (
          <div className="relative p-6 bg-white/10 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center min-h-[160px] text-center space-y-4">
            <span className="text-3xl">🇨🇴</span>
            <p className="text-xs font-black uppercase tracking-widest text-colombia-yellow">Inteligencia Pública Soberana</p>
            <p className="text-[10px] opacity-80 leading-relaxed font-bold">Uniendo la tecnología con la transparencia gubernamental nacional.</p>
          </div>
        )
      },
      {
        title: "Pregúntale a ColombIA Datos",
        description: "Escribe consultas en lenguaje natural (ej. 'Muéstrame las tasas de empleo en Cali por año') y el asistente buscará, limpiará e interpretará los datasets de Datos.gov.co en segundos por ti.",
        icon: <Search className="w-8 h-8 text-colombia-blue" />,
        color: "bg-zinc-50 border border-zinc-100",
        visual: (
          <div className="bg-white border border-zinc-100 p-5 rounded-[2rem] shadow-sm space-y-3 w-full">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-xs">🔍</span>
              <span className="text-[10px] text-zinc-500 font-bold">"Muéstrame los reportes de calidad..."</span>
            </div>
            <div className="flex gap-2 items-start bg-blue-50/50 p-3 rounded-2xl border border-blue-50">
              <span className="text-xs">🤖</span>
              <p className="text-[9px] text-zinc-600 font-bold leading-relaxed">Procesando consulta SODA en vivo...</p>
            </div>
          </div>
        )
      },
      {
        title: "Visualiza de forma Interactiva",
        description: "El motor genera automáticamente hermosos gráficos interactivos (barras, líneas, tortas y mapas de calor) y tablas dinámicas. Puedes maximizarlas, analizarlas o descargarlas con un solo clic.",
        icon: <BarChart3 className="w-8 h-8 text-green-600" />,
        color: "bg-zinc-50 border border-zinc-100",
        visual: (
          <div className="bg-white border border-zinc-100 p-5 rounded-[2rem] shadow-sm flex flex-col items-center justify-center min-h-[140px] space-y-3 w-full">
            <div className="flex gap-1 items-end h-14 w-28 border-b border-zinc-200 pb-1">
              <div className="bg-colombia-blue w-4 h-6 rounded-t"></div>
              <div className="bg-colombia-yellow w-4 h-9 rounded-t"></div>
              <div className="bg-colombia-red w-4 h-12 rounded-t"></div>
              <div className="bg-zinc-400 w-4 h-8 rounded-t"></div>
            </div>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest text-center">Gráficos interactivos</p>
          </div>
        )
      },
      {
        title: "Cuadernos y Guardado de Notas",
        description: "Usa el Cuaderno de Investigación para guardar apuntes, conclusiones importantes, listados de fuentes y análisis valiosos de IA. ¡Excelente para tus reportes de auditoría social!",
        icon: <FileText className="w-8 h-8 text-purple-600" />,
        color: "bg-zinc-50 border border-zinc-100",
        visual: (
          <div className="bg-white border border-zinc-100 p-5 rounded-[2rem] shadow-sm space-y-2 w-full text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
              <span className="text-[9px] font-black text-purple-700 uppercase">📝 Conclusiones</span>
            </div>
            <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
              El 73% de las contrataciones territoriales han sido transparentadas...
            </p>
          </div>
        )
      },
      {
        title: "Solicita la Apertura de Datos",
        description: "¿Hay algún conjunto de datos que no logras encontrar en la base pública nacional? Completa una solicitud formal desde tu barra superior. Nosotros gestionaremos las nuevas fuentes de Datos Abiertos.",
        icon: <Library className="w-8 h-8 text-colombia-red" />,
        color: "bg-zinc-50 border border-zinc-100",
        visual: (
          <div className="bg-white border border-zinc-100 p-4 rounded-[2rem] shadow-sm text-center space-y-2 w-full">
            <div className="inline-block p-1 bg-red-100 text-colombia-red rounded-full text-xs">✍️</div>
            <h5 className="text-[10px] font-black uppercase text-zinc-700 leading-none">Nueva Solicitud</h5>
            <p className="text-[8px] text-zinc-400 font-bold leading-tight">Proceso transparente y directo.</p>
          </div>
        )
      }
    ];

    const currentStep = steps[onboardingStep];

    const handleNext = () => {
      if (onboardingStep < steps.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        handleCompleteOnboarding();
      }
    };

    const handlePrev = () => {
      if (onboardingStep > 0) {
        setOnboardingStep(onboardingStep - 1);
      }
    };

    const isBlueBg = currentStep.color.includes('colombia-blue');

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            onClick={handleCompleteOnboarding}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 flex flex-col md:flex-row border transition-colors duration-300 ${isBlueBg ? 'bg-gradient-to-br from-colombia-blue to-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-100 text-zinc-800'}`}
          >
            {/* Upper Skip Action */}
            <div className="absolute top-5 right-5 z-10">
              <button 
                onClick={handleCompleteOnboarding}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isBlueBg ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`}
              >
                Saltar tutorial ✕
              </button>
            </div>

            {/* Visual Asset Block (Left) */}
            <div className={`w-full md:w-5/12 p-6 sm:p-8 flex items-center justify-center ${isBlueBg ? 'bg-black/10' : 'bg-zinc-50/50 border-r border-zinc-100'}`}>
              <motion.div 
                key={onboardingStep}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                className="w-full max-w-[160px]"
              >
                {currentStep.visual}
              </motion.div>
            </div>

            {/* Text / Actions Block (Right) */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6 min-h-[300px]">
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isBlueBg ? 'bg-white/10' : 'bg-zinc-100 border border-zinc-200'}`}>
                    {currentStep.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest font-mono ${isBlueBg ? 'text-colombia-yellow' : 'text-zinc-400'}`}>
                    Guía de Inicio | {onboardingStep + 1} de {steps.length}
                  </span>
                </div>
                
                <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight ${isBlueBg ? 'text-white' : 'text-zinc-900'}`}>
                  {currentStep.title}
                </h3>
                
                <p className={`text-xs leading-relaxed font-bold ${isBlueBg ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {currentStep.description}
                </p>
              </div>

              {/* Stepper Dots & Buttons */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-100/10">
                <div className="flex gap-1.5">
                  {steps.map((_, idx) => (
                    <button 
                      type="button"
                      key={idx}
                      onClick={() => setOnboardingStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${onboardingStep === idx ? 'w-5 bg-colombia-yellow' : 'w-1.5 bg-zinc-300/60'}`}
                      aria-label={`Ir al paso ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {onboardingStep > 0 && (
                    <button 
                      type="button"
                      onClick={handlePrev}
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${isBlueBg ? 'border-white/20 hover:bg-white/10 text-white' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'}`}
                    >
                      Atrás
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={handleNext}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${isBlueBg ? 'bg-colombia-yellow text-colombia-blue hover:brightness-110 shadow-xl' : 'bg-colombia-blue text-white hover:brightness-115 shadow-xl shadow-colombia-blue/15'}`}
                  >
                    {onboardingStep === steps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const renderRequestAperturaModal = () => {
    if (!isRequestModalOpen) return null;

    const handleSubmitRequest = async (e: FormEvent) => {
      e.preventDefault();
      if (!user || !requestDatasetName) return;
      setIsRequestSubmitting(true);
      
      try {
        const requestId = Math.random().toString(36).substring(7);
        const requestData = {
          userId: user.uid,
          userEmail: user.email,
          datasetName: requestDatasetName,
          reason: requestReason,
          status: 'pending',
          createdAt: serverTimestamp()
        };

        // 1. Save to Firestore for records
        await setDoc(doc(db, 'dataOpeningRequests', requestId), requestData)
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `dataOpeningRequests/${requestId}`));

        alert('Solicitud enviada con éxito. Se ha registrado en el sistema para revisión del administrador.');
        setIsRequestModalOpen(false);
      } catch (error) {
        console.error(error);
        alert('Hubo un problema al enviar la solicitud.');
        setIsRequestModalOpen(false);
      } finally {
        setIsRequestSubmitting(false);
      }
    };

    if (!isRequestModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsRequestModalOpen(false)}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden shadow-black/30 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-colombia-blue rounded-2xl flex items-center justify-center text-white">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">Solicitar Apertura</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ley 1712 de Transparencia</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-3 bg-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all hover:bg-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Nombre del Conjunto de Datos</label>
                <input 
                  required
                  value={requestDatasetName}
                  onChange={(e) => setRequestDatasetName(e.target.value)}
                  placeholder="Ej: Contratación alcaldía de..."
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-colombia-blue/5 outline-none transition-all font-bold text-zinc-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Justificación (Opcional)</label>
                <textarea 
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="¿Por qué es importante este dato?"
                  rows={3}
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-colombia-blue/5 outline-none transition-all font-medium text-zinc-700 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isRequestSubmitting}
                className="w-full py-4 bg-colombia-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-colombia-blue/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isRequestSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  };

  const AdminView = () => {
    const [editingSource, setEditingSource] = useState<Partial<DataSource> | null>(null);
    const [adminTab, setAdminTab] = useState<'sources' | 'requests' | 'users' | 'audit' | 'errors' | 'settings'>('sources');
    const [auditSearchTerm, setAuditSearchTerm] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('');
    
    // Internal state for configuring parameters dynamically
    const [localSettings, setLocalSettings] = useState<AppSetting>({ ...settings });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
      setLocalSettings({ ...settings });
    }, [settings]);

    const handleSave = async () => {
      if (!editingSource?.name || !editingSource?.url) return;
      
      const sourceId = editingSource.id || Math.random().toString(36).substring(7);
      const sourceRef = doc(db, 'dataSources', sourceId);
      
      const sourceData = {
        ...editingSource,
        id: sourceId,
        isActive: editingSource.isActive ?? true,
        category: editingSource.category || 'General'
      };

      await setDoc(sourceRef, sourceData, { merge: true })
        .then(() => {
          logAuditEvent(
            editingSource.id ? 'EDITAR_FUENTE_DATOS' : 'CREAR_FUENTE_DATOS',
            `Se guardó la fuente de datos: ${sourceData.name} (ID: ${sourceId}) con URL: ${sourceData.url} | Categoría: ${sourceData.category} | Activo: ${sourceData.isActive}`
          );
        })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `dataSources/${sourceId}`));
        
      setEditingSource(null);
    };

    const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      const settingsRef = doc(db, 'appSettings', 'global_config');
      
      const settingsPayload = {
        model: localSettings.model || 'gemini-3.5-flash',
        temperature: Number(localSettings.temperature) ?? 1,
        topP: Number(localSettings.topP) ?? 0.95,
        topK: Number(localSettings.topK) ?? 64,
        customSystemInstruction: localSettings.customSystemInstruction || '',
        welcomeMessage: localSettings.welcomeMessage || '',
        rateLimitMessages: Number(localSettings.rateLimitMessages) ?? 0,
        sodaDefaultAppToken: localSettings.sodaDefaultAppToken || ''
      };

      await setDoc(settingsRef, settingsPayload, { merge: true })
        .then(() => {
          alert('¡Ajustes de la plataforma guardados con éxito en la base de datos!');
          logAuditEvent(
            'ACTUALIZAR_AJUSTES_SISTEMA',
            `Se guardaron los ajustes de IA globales de la plataforma. Modelo: ${settingsPayload.model} | Temperatura: ${settingsPayload.temperature} | Límite mensajes: ${settingsPayload.rateLimitMessages}`
          );
        })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'appSettings/global_config'))
        .finally(() => setIsSavingSettings(false));
    };

    const handleUpdateRequestStatus = async (requestId: string, newStatus: 'pending' | 'reviewed' | 'closed') => {
      await updateDoc(doc(db, 'dataOpeningRequests', requestId), { status: newStatus })
        .then(() => {
          logAuditEvent(
            'MODERAR_SOLICITUD_DATOS',
            `Se moderó el estado de la solicitud de apertura de datos (ID: ${requestId}) a: ${newStatus}`
          );
        })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `dataOpeningRequests/${requestId}`));
    };

    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 leading-none">ADMINISTRACIÓN</h2>
            <p className="text-xs font-bold text-colombia-red uppercase tracking-widest mt-2">Panel Ejecutivo de Control • ColombIA Datos</p>
          </div>
          {adminTab === 'sources' && (
            <button 
              onClick={() => setEditingSource({ name: '', url: '', entity: '', description: '', category: 'General', isActive: true })}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-colombia-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-colombia-blue/20 hover:scale-[1.03] transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Nueva Fuente SODA
            </button>
          )}
        </div>

        {/* Dashboard KPIs HUD ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-colombia-blue/10 text-colombia-blue rounded-2xl flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none">Fuentes del Catálogo</span>
              <p className="text-2xl font-black text-zinc-800 leading-none mt-1">
                {dataSources.filter(s => s.isActive).length}<span className="text-xs text-zinc-400 font-bold"> / {dataSources.length} Activas</span>
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-colombia-red/10 text-colombia-red rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none">Aperturas Pendientes</span>
              <p className="text-2xl font-black text-zinc-800 leading-none mt-1">
                {openingRequests.filter(r => r.status === 'pending').length}<span className="text-xs text-zinc-400 font-bold"> / {openingRequests.length} Solicitudes</span>
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-800 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none">Usuarios Activos</span>
              <p className="text-2xl font-black text-zinc-800 leading-none mt-1">
                {usersList.filter(u => u.status !== 'suspended').length}<span className="text-xs text-zinc-400 font-bold"> / {usersList.length} Total</span>
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-colombia-yellow/10 text-amber-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none block">Motor de IA</span>
              <p className="text-xs font-black text-zinc-700 truncate mt-1 uppercase tracking-wide">
                {settings.model || 'gemini-3.5-flash'}
              </p>
              <span className="text-[9px] text-zinc-400 font-bold">Temp: {settings.temperature ?? 1} • Lím: {settings.rateLimitMessages ?? 'Sin límite'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-100 gap-2 flex-wrap">
          <button
            onClick={() => setAdminTab('sources')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${adminTab === 'sources' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Fuentes de Datos
          </button>
          <button
            onClick={() => setAdminTab('requests')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative ${adminTab === 'requests' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Aperturas Solicitadas
            {openingRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-colombia-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-colombia-red"></span>
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('users')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${adminTab === 'users' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Control de Usuarios
          </button>
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${adminTab === 'audit' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Auditoría de Cambios
          </button>
          <button
            onClick={() => setAdminTab('errors')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative ${adminTab === 'errors' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Registro de Errores
            {appErrorsList.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black leading-none">
                {appErrorsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('settings')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${adminTab === 'settings' ? 'border-colombia-red text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            Ajustes de IA (Fase 1-3)
          </button>
        </div>

        {/* Tab 1: DATA SOURCES TAB */}
        {adminTab === 'sources' && (
          <div className="space-y-6">
            {editingSource && (
              <div className="bg-zinc-50 p-8 rounded-[2.5rem] border-2 border-colombia-blue/20 space-y-6 animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tighter">Configurar Fuente de SODA</h3>
                  <button onClick={() => setEditingSource(null)} className="text-zinc-400 hover:text-zinc-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Nombre del Conjunto de Datos</label>
                    <input 
                      placeholder="Nombre de la fuente (Ej: Defunciones de Tránsito)" 
                      className="p-4 rounded-xl border border-zinc-200 bg-white"
                      value={editingSource.name || ''}
                      onChange={e => setEditingSource({...editingSource, name: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">URL del Recurso JSON de Datos Abiertos</label>
                    <input 
                      placeholder="https://datos.gov.co/resource/xxxx-xxxx.json" 
                      className="p-4 rounded-xl border border-zinc-200 bg-white"
                      value={editingSource.url || ''}
                      onChange={e => setEditingSource({...editingSource, url: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Entidad Pública Responsable</label>
                    <input 
                      placeholder="Entidad Responsable (Ej: Alcaldía Mayor de Bogotá)" 
                      className="p-4 rounded-xl border border-zinc-200 bg-white"
                      value={editingSource.entity || ''}
                      onChange={e => setEditingSource({...editingSource, entity: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Categoría Temática</label>
                    <select 
                      className="p-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-bold"
                      value={editingSource.category || 'General'}
                      onChange={e => setEditingSource({...editingSource, category: e.target.value})}
                    >
                      <option value="General">General</option>
                      <option value="Economía">Economía</option>
                      <option value="Salud">Salud</option>
                      <option value="Educación">Educación</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Medio Ambiente">Medio Ambiente</option>
                      <option value="Seguridad">Seguridad</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">SODA App Token específico (Opcional)</label>
                    <input 
                      placeholder="Ingresa un Token específico de SODA o déjalo vacío para usar el App Token Global" 
                      className="p-4 rounded-xl border border-zinc-200 bg-white font-mono"
                      type="password"
                      value={editingSource.appToken || ''}
                      onChange={e => setEditingSource({...editingSource, appToken: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Descripción Informativa del Contenido</label>
                  <textarea 
                    placeholder="Describe el propósito y alcance del conjunto de datos para que los ciudadanos y la IA lo comprendan..." 
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-white h-24"
                    value={editingSource.description || ''}
                    onChange={e => setEditingSource({...editingSource, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={handleSave} className="px-8 py-3 bg-colombia-blue text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-colombia-blue/90 transition-all">Guardar Fuente</button>
                  <button onClick={() => setEditingSource(null)} className="px-8 py-3 bg-white text-zinc-500 rounded-xl font-bold uppercase text-[10px] tracking-widest border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {dataSources.map(source => (
                <div key={source.id} className={`p-6 bg-white border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm transition-all gap-4 ${source.isActive ? 'border-zinc-200' : 'border-zinc-100 opacity-60 grayscale'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${source.isActive ? 'bg-colombia-blue/10 text-colombia-blue' : 'bg-zinc-100 text-zinc-400'}`}>
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-zinc-800 leading-none mb-1">{source.name}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{source.entity} • ID: {source.id}</p>
                      <span className="text-[9px] px-2.5 py-1 bg-zinc-50 border border-zinc-100 rounded-full font-extrabold text-colombia-blue uppercase">
                        {source.category || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <button 
                      onClick={async () => {
                        const sourceRef = doc(db, 'dataSources', source.id);
                        const nextActiveState = !source.isActive;
                        await updateDoc(sourceRef, { isActive: nextActiveState })
                          .then(() => {
                            logAuditEvent(
                              'CAMBIAR_ESTADO_FUENTE',
                              `Se cambió el estado de la fuente de datos '${source.name}' (ID: ${source.id}) a: ${nextActiveState ? 'Activa' : 'Inactiva'}`
                            );
                          })
                          .catch(err => handleFirestoreError(err, OperationType.UPDATE, `dataSources/${source.id}`));
                      }}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${source.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}
                    >
                      {source.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </button>
                    <button 
                      onClick={() => setEditingSource(source)} 
                      className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-colombia-blue hover:border-colombia-blue/30 rounded-xl transition-all"
                      title="Editar Fuente"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSourceToDelete(source);
                      }} 
                      className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-colombia-red hover:border-colombia-red/30 rounded-xl transition-all"
                      title="Eliminar Fuente"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {dataSources.length === 0 && (
                <div className="p-12 text-center bg-white border border-zinc-100 rounded-[2rem] shadow-inner text-zinc-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay fuentes cargadas actualmente.</p>
                  <p className="text-[10px] mt-1">Haz clic en "Nueva Fuente SODA" para empezar a nutrir el catálogo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: REQUESTS TAB */}
        {adminTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Solicitudes Ciudadanas de Datos Abiertos</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Gobernanza participativa: Revisa y aprueba requerimientos ciudadanos para abrir nuevos conjuntos de datos en Colombia.</p>
            </div>

            <div className="grid gap-4">
              {openingRequests.map(req => (
                <div key={req.id} className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Solicitado por: {req.userEmail || 'Ciudadano'}</span>
                      <h4 className="text-base font-black text-zinc-900 leading-none">{req.datasetName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={req.status || 'pending'}
                        onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value as any)}
                        className={`p-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border outline-none ${
                          req.status === 'closed' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
                          req.status === 'reviewed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                        }`}
                      >
                        <option value="pending">🟡 Pendiente</option>
                        <option value="reviewed">🔵 Revisado</option>
                        <option value="closed">🟢 Resuelto / Cerrado</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium"><strong className="text-zinc-800 block text-[9px] uppercase tracking-wider font-extrabold mb-1">Justificación Ciudadana:</strong> {req.reason || 'Sin justificación provista.'}</p>
                  </div>
                </div>
              ))}
              {openingRequests.length === 0 && (
                <div className="p-12 text-center bg-white border border-zinc-100 rounded-[2rem] shadow-inner text-zinc-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay solicitudes ciudadanas registradas.</p>
                  <p className="text-[10px] mt-1">Los ciudadanos pueden enviar solicitudes de apertura desde el modal en el catálogo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: USERS CONTROL TAB */}
        {adminTab === 'users' && (
          <div className="space-y-6 animate-in duration-300">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-tight">CONTROL DE ACCESO Y CIUDADANOS</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Gobernanza y moderación del ecosistema. Como administrador puedes promover roles, revocar temporalmente el acceso suspendiendo la cuenta del ciudadano, o suprimir perfiles obsoletos.
              </p>
            </div>

            <div className="grid gap-4">
              {usersList.map(u => {
                const isSelf = u.uid === user?.uid;
                const isSuperAdmin = u.email === 'carlosernesto.rios@gmail.com';
                return (
                  <div key={u.uid} className={`p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${u.status === 'suspended' ? 'bg-zinc-50 border-red-200' : 'hover:shadow-md'}`}>
                    <div className="flex items-center gap-4">
                      <UserAvatar size="md" name={u.displayName || u.email} photoURL={u.photoURL} className="w-12 h-12 border border-zinc-200" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-zinc-800 leading-none">{u.displayName || 'Ciudadano Anónimo'}</h4>
                          {isSelf && (
                            <span className="text-[8px] px-2 py-0.5 bg-colombia-blue/15 text-colombia-blue rounded-full font-black uppercase tracking-wider">Tú</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 font-mono leading-none">{u.email}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                          }`}>
                            {u.role === 'admin' ? '👑 Administrador' : '👤 Público'}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            u.status === 'suspended' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {u.status === 'suspended' ? '🚫 Suspendido' : '✅ Activo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {/* Suspender / Activar */}
                      <button
                        disabled={isSelf || isSuperAdmin}
                        onClick={async () => {
                          const userRef = doc(db, 'users', u.uid);
                          const nextStatus = u.status === 'suspended' ? 'active' : 'suspended';
                          await updateDoc(userRef, { status: nextStatus })
                            .then(() => {
                              logAuditEvent(
                                nextStatus === 'suspended' ? 'SUSPENDER_USUARIO' : 'HABILITAR_USUARIO',
                                `Se cambió el estado del usuario ciudadano con email: ${u.email || 'Anónimo'} (ID: ${u.uid}) a: ${nextStatus}`
                              );
                            })
                            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`));
                        }}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-30 ${
                          u.status === 'suspended' 
                            ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200' 
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'
                        }`}
                      >
                        {u.status === 'suspended' ? 'Habilitar' : 'Restringir'}
                      </button>

                      {/* Promover / Degradado */}
                      <button
                        disabled={isSelf || isSuperAdmin}
                        onClick={async () => {
                          const userRef = doc(db, 'users', u.uid);
                          const nextRole = u.role === 'admin' ? 'public' : 'admin';
                          await updateDoc(userRef, { role: nextRole })
                            .then(() => {
                              logAuditEvent(
                                'CAMBIAR_ROL_USUARIO',
                                `Se cambió el rol del ciudadano con email: ${u.email || 'Anónimo'} (ID: ${u.uid}) a: ${nextRole}`
                              );
                            })
                            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`));
                        }}
                        className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-30"
                      >
                        {u.role === 'admin' ? 'Hacer Público' : 'Hacer Admin'}
                      </button>

                      {/* Eliminar Perfil */}
                      <button
                        disabled={isSelf || isSuperAdmin}
                        onClick={() => {
                          setUserToDelete(u);
                        }}
                        className="p-2.5 bg-zinc-100 hover:bg-red-50 hover:text-colombia-red border border-zinc-200 hover:border-colombia-red/30 text-zinc-400 rounded-xl transition-all disabled:opacity-30"
                        title="Eliminar Perfil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {usersList.length === 0 && (
                <div className="p-12 text-center bg-white border border-zinc-100 rounded-[2rem] shadow-inner text-zinc-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-bold">No hay usuarios registrados en la base de datos.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: AUDIT LOGS VIEW */}
        {adminTab === 'audit' && (
          <div className="space-y-6 animate-in duration-300">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">BITÁCORA DE AUDITORÍA DE SEGURIDAD</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                  Registro de operaciones en el panel de control. Rastrea qué administrador realizó modificaciones a las configuraciones globales, fuentes de datos, o moderación de ciudadanos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-zinc-50 border border-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-xl">
                  {auditLogsList.length} Registros
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white border border-zinc-100 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Filtrar por email de administrador..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-colombia-red/25"
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <select 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-colombia-red/25"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                >
                  <option value="">Todos los tipos de operaciones</option>
                  <option value="ACTUALIZAR_AJUSTES_SISTEMA">Ajustes del Sistema</option>
                  <option value="CREAR_FUENTE_DATOS">Crear Fuente SODA</option>
                  <option value="EDITAR_FUENTE_DATOS">Editar Fuente SODA</option>
                  <option value="CAMBIAR_ESTADO_FUENTE">Cambiar Estado Fuente</option>
                  <option value="ELIMINAR_FUENTE_DATOS">Eliminar Fuente SODA</option>
                  <option value="CAMBIAR_ROL_USUARIO">Cambiar Rol de Ciudadano</option>
                  <option value="SUSPENDER_USUARIO">Suspender Ciudadano</option>
                  <option value="HABILITAR_USUARIO">Habilitar Ciudadano</option>
                  <option value="ELIMINAR_USUARIO">Eliminar Ciudadano</option>
                  <option value="MODERAR_SOLICITUD_DATOS">Moderar Solicitudes de Apertura</option>
                </select>
              </div>
              {(auditSearchTerm || auditActionFilter) && (
                <button 
                  onClick={() => { setAuditSearchTerm(''); setAuditActionFilter(''); }}
                  className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            <div className="space-y-4">
              {auditLogsList
                .filter(log => {
                  const matchEmail = !auditSearchTerm || (log.userEmail || '').toLowerCase().includes(auditSearchTerm.toLowerCase());
                  const matchAction = !auditActionFilter || log.action === auditActionFilter;
                  return matchEmail && matchAction;
                })
                .map(log => {
                  let badgeColors = 'bg-zinc-100 text-zinc-700';
                  if (log.action.includes('ELI') || log.action.includes('SUSPENDER')) {
                    badgeColors = 'bg-red-50 text-red-700 border border-red-100';
                  } else if (log.action.includes('CREAR') || log.action.includes('EDITAR')) {
                    badgeColors = 'bg-blue-50 text-colombia-blue border border-colombia-blue/10';
                  } else if (log.action.includes('SISTEMA') || log.action.includes('AJUSTES')) {
                    badgeColors = 'bg-amber-50 text-amber-700 border border-amber-100';
                  } else if (log.action.includes('ROL') || log.action.includes('HABILITAR')) {
                    badgeColors = 'bg-purple-50 text-purple-700 border border-purple-100';
                  }

                  const dateStr = log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Recién registrado';

                  return (
                    <div key={log.id} className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold font-mono">
                            📅 {dateStr}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 font-medium leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                          {log.details}
                        </p>
                      </div>

                      <div className="shrink-0 text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
                        <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest block leading-none">Administrador</span>
                        <span className="text-xs font-black text-zinc-800 font-mono block mt-1">{log.userEmail || 'Sistema o Desconocido'}</span>
                        <span className="text-[8px] text-zinc-400 font-bold font-mono mt-0.5 block">{log.userId ? `ID: ${log.userId.substring(0, 10)}...` : ''}</span>
                      </div>
                    </div>
                  );
                })}

              {auditLogsList.filter(log => {
                const matchEmail = !auditSearchTerm || (log.userEmail || '').toLowerCase().includes(auditSearchTerm.toLowerCase());
                const matchAction = !auditActionFilter || log.action === auditActionFilter;
                return matchEmail && matchAction;
              }).length === 0 && (
                <div className="p-16 text-center bg-white border border-zinc-100 rounded-[2.5rem] shadow-inner text-zinc-400 space-y-2">
                  <Database className="w-12 h-12 mx-auto opacity-30" />
                  <p className="font-bold">No se encontraron eventos en la bitácora de auditoría.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: RUNTIME ERROR LOGS VIEW */}
        {adminTab === 'errors' && (
          <div className="space-y-6 animate-in duration-300">
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">MONITOREO DE EXCEPCIONES Y ERRORES</h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                  Alertas y excepciones capturadas de manera proactiva durante las consultas SODA, integraciones de la API de Gemini y guardado en Firestore. Útil para optimización técnica.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {appErrorsList.length > 0 && (
                  <button
                    onClick={() => {
                      setClearLogsConfirm(true);
                    }}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    Borrar Registro
                  </button>
                )}
                <span className="px-4 py-2 bg-zinc-50 border border-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-xl">
                  {appErrorsList.length} Errores
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {appErrorsList.map(err => {
                const dateStr = err.createdAt?.toDate ? err.createdAt.toDate().toLocaleString() : 'Recién registrado';
                return (
                  <div key={err.id} className="p-6 bg-white border border-red-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 bg-red-100 text-red-700 font-black uppercase tracking-widest text-[8px] rounded-full">
                          🚨 CRÍTICO
                        </span>
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-600 font-extrabold uppercase tracking-widest text-[8px] rounded-full border border-zinc-200">
                          🔌 Contexto: {err.context || 'General'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold font-mono">
                          📅 {dateStr}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block leading-none">Afectó a</span>
                        <span className="text-[10px] font-black text-zinc-700 font-mono block mt-1">{err.userEmail || 'Usuario no autenticado'}</span>
                      </div>
                    </div>

                    <div className="p-5 bg-red-50/50 rounded-2xl border border-red-50 text-red-800">
                      <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-red-700 mb-1">Detalle del Error</h4>
                      <p className="text-xs font-mono font-medium leading-relaxed break-words">{err.error}</p>
                    </div>

                    {err.stack && (
                      <details className="group border border-zinc-100 rounded-xl overflow-hidden transition-all bg-zinc-50">
                        <summary className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:bg-zinc-100 select-none flex items-center justify-between list-none">
                          <span>🔍 Ver Pila de Llamadas (Stack Trace)</span>
                          <span className="transition-transform group-open:rotate-180">▼</span>
                        </summary>
                        <div className="p-4 bg-zinc-900 text-red-400 text-[10px] font-mono whitespace-pre-wrap overflow-auto max-h-56 leading-relaxed selection:bg-red-900 select-all border-t border-zinc-200 shadow-inner">
                          {err.stack}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}

              {appErrorsList.length === 0 && (
                <div className="p-16 text-center bg-white border border-zinc-100 rounded-[2.5rem] shadow-inner text-green-600 space-y-2">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-3">
                    ✔
                  </div>
                  <h4 className="font-black text-zinc-800 uppercase tracking-tight text-sm">Sistema Saludable</h4>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                    No se han registrado excepciones o incidencias técnicas en ejecución. ¡Buen trabajo!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: SYSTEM SETTINGS TAB (FASES 1, 2, 3) */}
        {adminTab === 'settings' && (
          <div className="bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-8 animate-in duration-300">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">AJUSTES DE LA PLATAFORMA (FASES 1, 2 Y 3)</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Configura las directivas de IA, Socrata y parámetros del cliente en caliente sin necesidad de redistribuir código.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Socrata Parameters (Fase 1) */}
              <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-colombia-blue text-white flex items-center justify-center font-bold text-xs shadow-md shadow-colombia-blue/10">1</div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-zinc-700">Fase 1: Configuración de SODA (Socrata)</h4>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">App Token de SODA Global (datos.gov.co)</label>
                    <input 
                      placeholder="Ingresa el SODA App Token principal..." 
                      className="p-4 rounded-xl border border-zinc-200 bg-white font-mono text-xs"
                      type="password"
                      value={localSettings.sodaDefaultAppToken || ''}
                      onChange={e => setLocalSettings({...localSettings, sodaDefaultAppToken: e.target.value})}
                    />
                    <span className="text-[9px] text-zinc-400 leading-snug pl-1">Se utiliza globalmente como encabezado en las peticiones SODA a datos.gov.co para eludir límites de cuota (CORS / SODA Query Limits) de la REST API pública.</span>
                  </div>
                </div>
              </div>

              {/* Security and Limits (Fase 3) */}
              <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-colombia-red text-white flex items-center justify-center font-bold text-xs shadow-md shadow-colombia-red/10">3</div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-zinc-700">Fase 3: Seguridad y Gobernanza Ciudadana</h4>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Límite de Consultas por Sesión de Chat</label>
                    <input 
                      placeholder="Ej: 10 (0 para ilimitado)" 
                      className="p-4 rounded-xl border border-zinc-200 bg-white font-bold text-xs"
                      type="number"
                      min="0"
                      value={localSettings.rateLimitMessages ?? 0}
                      onChange={e => setLocalSettings({...localSettings, rateLimitMessages: parseInt(e.target.value) || 0})}
                    />
                    <span className="text-[9px] text-zinc-400 leading-snug pl-1">Control de costos para mitigar abusos o consultas masivas sobre las API keys de Gemini. Bloquea peticiones al sobrepasar este valor.</span>
                  </div>
                </div>
              </div>

              {/* Gemini Models (Fase 2) */}
              <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-colombia-yellow text-zinc-900 flex items-center justify-center font-bold text-xs shadow-md shadow-colombia-yellow/10">2</div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-zinc-700">Fase 2: Motor de Inteligencia Artificial (Gemini API)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Modelo Seleccionado</label>
                    <select 
                      className="p-4 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 outline-none"
                      value={localSettings.model || 'gemini-3.5-flash'}
                      onChange={e => setLocalSettings({...localSettings, model: e.target.value})}
                    >
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Ultra Rápido • Recomendado)</option>
                      <option value="gemini-3-flash-preview">gemini-3-flash-preview (Original con Razonamiento)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Estable)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Avanzado)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-2">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Temperatura de Creatividad: <span className="text-colombia-blue">{localSettings.temperature ?? 1}</span></label>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.1"
                      className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-colombia-blue my-auto py-3"
                      value={localSettings.temperature ?? 1}
                      onChange={e => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                    />
                    <div className="flex justify-between text-[8px] text-zinc-400 font-bold px-1 select-none">
                      <span>0.0 (Preciso / Heurístico)</span>
                      <span>1.0 (Lógico / Recomendado)</span>
                      <span>1.5 (Creativo / Libre)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Top_P: <span className="text-colombia-blue">{localSettings.topP ?? 0.95}</span></label>
                    <input 
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-colombia-blue py-3"
                      value={localSettings.topP ?? 0.95}
                      onChange={e => setLocalSettings({...localSettings, topP: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Top_K: <span className="text-colombia-blue">{localSettings.topK ?? 64}</span></label>
                    <input 
                      type="range"
                      min="1"
                      max="128"
                      step="1"
                      className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-colombia-blue py-3"
                      value={localSettings.topK ?? 64}
                      onChange={e => setLocalSettings({...localSettings, topK: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Instrucciones de Sistema (System Instructions Override)</label>
                  <textarea 
                    placeholder="Escribe las directivas nucleares de comportamiento de ColombIA Datos en español..." 
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-white h-44 font-mono text-xs leading-relaxed"
                    value={localSettings.customSystemInstruction || ''}
                    onChange={e => setLocalSettings({...localSettings, customSystemInstruction: e.target.value})}
                  />
                  <span className="text-[9px] text-zinc-400 leading-snug pl-1">Modifica esto para alterar la estructura de las respuestas ciudadanas, el tono ético, el formato de dibujo de gráficos d3/recharts y el lenguaje. Si se deja en blanco, recurrirá al prompt nuclear original del sistema.</span>
                </div>
              </div>

              {/* Custom Welcome Message (Fase 3) */}
              <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4 md:col-span-2">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-black uppercase tracking-tight text-zinc-700">Mensaje de Bienvenida Ciudadano</h4>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1 mt-2">Personalización del Mensaje Inicial de Chat</label>
                  <textarea 
                    placeholder="Mensaje de bienvenida que ven los ciudadanos..." 
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-white h-24 text-xs font-semibold leading-relaxed"
                    value={localSettings.welcomeMessage || ''}
                    onChange={e => setLocalSettings({...localSettings, welcomeMessage: e.target.value})}
                  />
                  <span className="text-[9px] text-zinc-400 leading-snug pl-1">Aparece de forma inmediata cada vez que se crea una nueva sala de conversación ciudadana para guiar las exploraciones del público.</span>
                </div>
              </div>

            </div>

            {/* Save Button HUD footer */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-zinc-900/10 transition-all flex items-center gap-2"
              >
                {isSavingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSavingSettings ? 'Guardando Ajustes...' : 'Sincronizar Parámetros'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CatalogView = () => (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 leading-none">CATÁLOGO <span className="text-colombia-blue text-stroke-1">NACIONAL</span></h2>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] text-zinc-600 font-bold bg-white border border-zinc-200 px-3 py-1 rounded-full shadow-sm">
              {dataSources.filter(s => s.isActive).length} FUENTES ACTIVAS
            </span>
            <span className="text-[10px] text-colombia-blue font-bold bg-colombia-blue/5 border border-colombia-blue/20 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-colombia-blue rounded-full animate-pulse"></span>
              Socrata Connect OK
            </span>
          </div>
        </div>
        <button 
          onClick={() => setActiveView('chat')}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 transition-all active:scale-95 self-start sm:self-auto"
        >
          <X className="w-4 h-4" />
          Cerrar Catálogo
        </button>
      </div>

      <div className="relative group max-w-2xl">
        <input 
          type="text" 
          placeholder="Busca por temas (Ej: Salud, Deforestación, SECOP)..."
          className="w-full p-4 pl-12 bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-200/50 focus:border-colombia-blue/30 outline-none transition-all text-sm font-medium"
        />
        <Search className="absolute left-4 top-4.5 w-5 h-5 text-zinc-300 group-focus-within:text-colombia-blue transition-colors" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSources.filter(s => s.isActive).map((d) => (
          <div 
            key={d.id} 
            className="group bg-white border border-zinc-100 rounded-3xl p-6 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
            onClick={() => {
              setActiveView('chat');
              handleSubmit(undefined, `Háblame sobre el conjunto de datos "${d.name}" de la entidad ${d.entity}. ¿Qué información contiene y cómo puedo utilizarla?`);
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 transition-transform">
              <Database className="w-16 h-16" />
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${
                d.category === 'Economía' ? 'text-green-600 bg-green-50 border-green-100' :
                d.category === 'Salud' ? 'text-red-600 bg-red-50 border-red-100' :
                d.category === 'Educación' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                'text-colombia-blue bg-colombia-blue/5 border-colombia-blue/10'
              }`}>
                {d.category || 'General'}
              </span>
            </div>

            <h3 className="text-xl font-black text-zinc-800 group-hover:text-colombia-blue transition-colors mb-3 leading-tight">{d.name}</h3>
            <p className="text-xs text-zinc-500 font-medium mb-8 leading-relaxed">
              {d.description}
            </p>
            
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-zinc-50">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Entidad Pública</span>
                <span className="text-xs font-black text-zinc-700">{d.entity}</span>
              </div>
              <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:bg-colombia-blue group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-colombia-blue/30 group-hover:rotate-6">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Accent Border Bottom - Colombian Flag */}
            <div className="absolute bottom-0 left-0 w-full flex h-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="bg-colombia-yellow h-full flex-[2]"></div>
               <div className="bg-colombia-blue h-full flex-[1]"></div>
               <div className="bg-colombia-red h-full flex-[1]"></div>
            </div>
          </div>
        ))}
        {dataSources.filter(s => s.isActive).length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="p-8 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200 inline-block">
              <Database className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No hay fuentes cargadas o activas actualmente</p>
              <p className="text-[10px] text-zinc-400 mt-2">El administrador aún no ha habilitado conjuntos de datos oficiales.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 md:p-10 bg-colombia-blue rounded-3xl text-white flex flex-col lg:flex-row items-center gap-8 justify-between shadow-xl shadow-colombia-blue/20 mt-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-white rounded-[50%] blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <div className="w-10 h-10 bg-colombia-yellow rounded-xl mb-4 flex items-center justify-center shadow-md shadow-black/20 transform -rotate-6 mx-auto lg:mx-0">
             <Plus className="w-5 h-5 text-colombia-blue stroke-[3px]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter mb-3 uppercase">¿Buscas un conjunto de datos específico?</h3>
          <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-bold">
            Si el dato no está cargado, podemos solicitar su apertura oficial mediante la Ley 1712 de Transparencia y del Derecho de Acceso a la Información Pública Nacional.
          </p>
        </div>
        <button 
          onClick={() => setIsRequestModalOpen(true)}
          className="relative z-10 bg-colombia-yellow text-colombia-blue px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 whitespace-nowrap border-b-4 border-black/10 text-xs sm:text-sm self-center lg:self-auto"
        >
          SOLICITAR APERTURA
        </button>
      </div>
    </div>
  );

  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Decision Support System State
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [activeNoteMessageId, setActiveNoteMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative'>>({});
  const [activeVisualization, setActiveVisualization] = useState<VisualizationData | null>(null);

  // Lifted Modal States to avoid hook ordering issues
  const [noteText, setNoteText] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [requestDatasetName, setRequestDatasetName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

  // Text selection to note state
  const [selectedText, setSelectedText] = useState('');
  const [selectedTextMsgId, setSelectedTextMsgId] = useState<string | null>(null);
  const [selectedTextPos, setSelectedTextPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.convert-selection-btn')) {
        return;
      }
      
      setTimeout(() => {
        const selection = window.getSelection();
        const txt = selection ? selection.toString().trim() : '';
        if (!txt) {
          setSelectedText('');
          setSelectedTextMsgId(null);
          setSelectedTextPos(null);
        }
      }, 50);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleMessageMouseUp = (e: React.MouseEvent, messageId: string) => {
    const selection = window.getSelection();
    if (!selection) return;
    const txt = selection.toString().trim();
    if (txt && txt.length > 2) {
      setSelectedText(txt);
      setSelectedTextMsgId(messageId);
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedTextPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 12
        });
      } catch (err) {
        setSelectedTextPos({
          x: e.clientX,
          y: e.clientY - 40
        });
      }
    }
  };

  const filteredNotes = React.useMemo(() => {
    return notes.filter(n => 
      n.content.toLowerCase().includes(noteSearchTerm.toLowerCase()) || 
      n.messageContext?.toLowerCase().includes(noteSearchTerm.toLowerCase())
    );
  }, [notes, noteSearchTerm]);

  const groupedNotes = React.useMemo(() => {
    const groups: Record<string, Note[]> = {};
    filteredNotes.forEach(n => {
      const groupId = n.conversationId || n.messageId; // Fallback for legacy notes
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(n);
    });
    return Object.entries(groups).sort((a, b) => {
      const timeA = a[1][0]?.updatedAt?.toMillis ? a[1][0].updatedAt.toMillis() : 0;
      const timeB = b[1][0]?.updatedAt?.toMillis ? b[1][0].updatedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [filteredNotes]);

  useEffect(() => {
    if (!user) return;
    const notesQuery = query(
      collection(db, 'notes'), 
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(notesQuery, (snapshot) => {
      const n = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(n);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notes'));
    return () => unsub();
  }, [user]);

  const notesByMessage = React.useMemo(() => {
    const map: Record<string, Note[]> = {};
    notes.forEach(n => {
      if (!map[n.messageId]) map[n.messageId] = [];
      map[n.messageId].push(n);
    });
    return map;
  }, [notes]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('colombia-datos-chats', JSON.stringify(conversations));
    }
  }, [conversations, messages]);

  const createNewChat = async () => {
    if (!user) return;
    
    // 1. Create conversation document
    const newChatData = {
      userId: user.uid,
      title: 'Nueva Consulta',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    try {
      const convRef = await addDoc(collection(db, 'conversations'), newChatData);
      
      // 2. Add welcome message to subcollection
      const messageCol = collection(db, 'conversations', convRef.id, 'messages');
      const messageRef = doc(messageCol);
      const initialMessage: Message & { id: string, createdAt: any, conversationId: string, userId: string } = {
        id: messageRef.id,
        conversationId: convRef.id,
        userId: user.uid,
        role: 'assistant',
        content: settings.welcomeMessage || '¡Hola! Soy ColombIA Datos. ¿En qué puedo ayudarte hoy?',
        createdAt: serverTimestamp()
      };
      
      await setDoc(messageRef, cleanUndefined(initialMessage));
      
      setActiveChatId(convRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'conversations');
    }
  };

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<DataSource | null>(null);
  const [clearLogsConfirm, setClearLogsConfirm] = useState(false);

  const deleteChat = async (id: string) => {
    if (!user) return;
    
    // 1. Close confirmation modal immediately
    setChatToDelete(null);
    
    // 2. Add to optimistic deletion lists immediately so it vanishes from UI
    setDeletingChatIds(prev => [...prev, id]);
    
    // 3. If we are deleting the currently viewed chat, switch away immediately
    if (activeChatId === id) {
      const remainingChats = conversations.filter(c => c.id !== id && !deletingChatIds.includes(c.id));
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId('');
      }
    }
    
    try {
      // 4. Background execution of notes queries
      const notesQuery = query(
        collection(db, 'notes'), 
        where('userId', '==', user.uid),
        where('conversationId', '==', id)
      );
      
      const notesSnapshot = await getDocs(notesQuery).catch(err => {
        console.warn("Could not list notes for deletion:", err);
        return { docs: [] };
      });

      // 5. Background execution of messages queries
      const messagesQuery = collection(db, 'conversations', id, 'messages');
      const messagesSnapshot = await getDocs(messagesQuery).catch(err => {
        console.warn("Could not list messages for deletion:", err);
        return { docs: [] };
      });

      const deleteNotesPromises = notesSnapshot.docs.map(noteDoc => 
        deleteDoc(noteDoc.ref).catch(err => {
          console.warn(`Could not delete note ${noteDoc.id}:`, err);
        })
      );

      const deleteMessagesPromises = messagesSnapshot.docs.map(msgDoc => 
        deleteDoc(msgDoc.ref).catch(err => {
          console.warn(`Could not delete message ${msgDoc.id}:`, err);
        })
      );
      
      // Execute all sub-deletes concurrently
      await Promise.all([...deleteNotesPromises, ...deleteMessagesPromises]);

      // 6. Delete the parent conversation document
      await deleteDoc(doc(db, 'conversations', id));
      
      // Clean up the tracking state
      setDeletingChatIds(prev => prev.filter(x => x !== id));
    } catch (err) {
      // Clean up tracking state on error too
      setDeletingChatIds(prev => prev.filter(x => x !== id));
      console.error("Error deleting conversation in background:", err);
    }
  };

  const suggestedQuestions = [
    { text: "¿Cuál fue el municipio con mayor deforestación en 2024?", icon: <TrendingUp className="w-4 h-4 text-red-500" /> },
    { text: "Compara la tasa de deserción universitaria por departamento", icon: <TrendingDown className="w-4 h-4 text-blue-500" /> },
    { text: "¿Qué proyectos de infraestructura hay en Medellín?", icon: <Search className="w-4 h-4 text-amber-500" /> },
    { text: "Ver contratos de SECOP II de hoy", icon: <Database className="w-4 h-4 text-zinc-500" /> }
  ];

  const isLandingPage = !isLoading && (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant'));

  useEffect(() => {
    if (scrollRef.current) {
      if (isLandingPage) {
        // En la pantalla de bienvenida (sin mensajes o solo con bienvenida), mantener el scroll arriba de todo
        scrollRef.current.scrollTop = 0;
        return;
      }
      // Small timeout to ensure everything is rendered before scrolling
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isLandingPage]);

  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => cleanUndefined(item));
    }
    const isPlainObject = (val: any) => {
      if (val === null || typeof val !== 'object') return false;
      const proto = Object.getPrototypeOf(val);
      return proto === null || proto === Object.prototype;
    };
    if (isPlainObject(obj)) {
      const cleaned: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          if (val !== undefined) {
            cleaned[key] = cleanUndefined(val);
          }
        }
      }
      return cleaned;
    }
    return obj;
  };

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const text = customText || input;
    if (!text.trim() || isLoading || !user) return;

    // Phase 3: Enforce administrative safety message limit
    if (settings.rateLimitMessages > 0) {
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      if (userMessageCount >= settings.rateLimitMessages) {
        alert(`Límite alcanzado: El administrador ha configurado un máximo de ${settings.rateLimitMessages} preguntas por consulta para optimizar recursos.`);
        return;
      }
    }

    // Set loading state and clear input immediately to render chat view instantly
    setIsLoading(true);
    setInput('');

    let chatId = activeChatId;

    try {
      // 1. Auto-create chat if none exists
      if (!chatId) {
        const newChatData = {
          userId: user.uid,
          title: text.substring(0, 30),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const convRef = await addDoc(collection(db, 'conversations'), newChatData);
        chatId = convRef.id;
        setActiveChatId(chatId);
      }

      const activeConv = conversations.find(c => c.id === chatId);
      const isUnnamedChat = !activeConv || activeConv.title === 'Nueva Consulta';
      const newTitle = isUnnamedChat ? text.substring(0, 30) : activeConv?.title || 'Conversación';

      const messageCol = collection(db, 'conversations', chatId, 'messages');
      const userMessageRef = doc(messageCol);
      const userMessage: Message & { id: string, createdAt: any, conversationId: string, userId: string } = { 
        id: userMessageRef.id,
        conversationId: chatId,
        userId: user.uid,
        role: 'user', 
        content: text,
        createdAt: serverTimestamp()
      };
      
      // 2. Add message to subcollection
      await setDoc(userMessageRef, cleanUndefined(userMessage));
      
      // 3. Update parent conversation metadata
      const chatRef = doc(db, 'conversations', chatId);
      await updateDoc(chatRef, { 
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      
      const activeSourcesData = dataSources.filter(s => s.isActive);
      const sourcesSummary = activeSourcesData.map(s => `- ${s.name} (${s.entity}): ${s.url}`).join('\n');

      // 4. Map history for Gemini (user/model roles)
      const historyParts = messages
        .filter(m => m && typeof m.content === 'string' && m.content.trim() !== '')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      // Add current message to context
      historyParts.push({
        role: 'user',
        parts: [{ text: text }]
      });

      // Phase 2: Use custom prompts and active models configured from the Admin interface
      const systemInstructionBase = settings.customSystemInstruction?.trim() || SYSTEM_INSTRUCTION;
      const fullSystemInstruction = `${systemInstructionBase}
      
      FUENTES DE DATOS ACTIVAS PARA ESTA CONVERSACIÓN:
      ${sourcesSummary}
      
      REGLA DE SEGURIDAD: Solo puedes utilizar información de las FUENTES DE DATOS ACTIVAS listadas anteriormente. Si la información necesaria para responder no se encuentra en estas fuentes específicas, debes responder obligatoriamente: "Lo siento, no cuento con suficiente información oficial en mis fuentes activas para responder a esta consulta."`;

      const geminiResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: historyParts,
          systemInstruction: fullSystemInstruction,
          model: settings.model || "gemini-3.5-flash",
          temperature: settings.temperature !== undefined ? Number(settings.temperature) : 1,
          topP: settings.topP !== undefined ? Number(settings.topP) : 0.95,
          topK: settings.topK !== undefined ? Number(settings.topK) : 64,
        })
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json().catch(() => ({}));
        if (geminiResponse.status === 429 || errorData.error === "QUOTA_EXHAUSTED") {
          throw new Error(errorData.message || "Se ha agotado el límite de consultas gratuitas de Gemini. Por favor, intenta de nuevo en unos segundos.");
        }
        throw new Error(errorData.message || "Error al consultar el servicio de IA. Por favor, intenta de nuevo.");
      }

      const data = await geminiResponse.json();
      const fullText = data.text || "";

      let content = fullText;
      let thinking: string[] = [];
      let visualization: VisualizationData | undefined;
      let datasets: Dataset[] = [];

      const dataMatch = fullText.match(/DATA_START([\s\S]*?)DATA_END/);
      if (dataMatch) {
        try {
          const jsonData = JSON.parse(dataMatch[1].trim());
          content = fullText.replace(/DATA_START[\s\S]*?DATA_END/, '').trim();
          thinking = jsonData.thinking || [];
          visualization = jsonData.visualization;
          datasets = jsonData.datasets || [];
        } catch (e) {
          console.error("Error parsing JSON data from AI", e);
        }
      }

      const assistantMessageRef = doc(messageCol);
      const assistantMessage: Message & { id: string, createdAt: any, conversationId: string, userId: string } = {
        id: assistantMessageRef.id,
        conversationId: chatId,
        userId: user.uid,
        role: 'assistant',
        content,
        thinking,
        visualization,
        datasets,
        createdAt: serverTimestamp()
      };
  
      await setDoc(assistantMessageRef, cleanUndefined(assistantMessage))
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `conversations/${chatId}/messages/${assistantMessageRef.id}`));
    } catch (error: any) {
      console.error("Submit Error:", error);
      setIsLoading(false);
      
      if (chatId) {
        const messageCol = collection(db, 'conversations', chatId, 'messages');
        const errRef = doc(messageCol);
        const errorMessage: Message & { id: string, conversationId: string, userId: string, createdAt: any } = {
          id: errRef.id,
          conversationId: chatId,
          userId: user.uid,
          role: 'assistant',
          content: error.message || "Ocurrió un problema al procesar tu consulta. Por favor, verifica tu conexión o el estado de las fuentes de datos.",
          createdAt: serverTimestamp()
        };
        await setDoc(errRef, cleanUndefined(errorMessage)).catch(() => {});
      } else {
        alert(error.message || "Error al iniciar la conversación. Por favor intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Attempting to delete note with ID:", id);
    
    try {
      await deleteDoc(doc(db, 'notes', id));
      console.log("Note deleted successfully:", id);
    } catch (err) {
      console.error("Error deleting note:", err);
      handleFirestoreError(err, OperationType.DELETE, `notes/${id}`);
      alert("No se pudo eliminar la nota. Por favor intenta de nuevo.");
    }
  };

  const renderNoteModal = () => {
    const message = messages.find(m => m.id === activeNoteMessageId);
    const existingNotes = notesByMessage[activeNoteMessageId || ''] || [];

    if (!activeNoteMessageId || !message) return null;

    const handleSaveNote = async () => {
      if (!user || !noteText.trim()) return;
      setIsNoteSaving(true);
      try {
        const noteId = Math.random().toString(36).substring(7);
        await setDoc(doc(db, 'notes', noteId), {
          id: noteId,
          userId: user.uid,
          messageId: activeNoteMessageId,
          conversationId: activeChatId || activeConversation?.id,
          conversationTitle: activeConversation?.title || 'Consulta',
          content: noteText.trim(),
          messageContext: message.content.substring(0, 500),
          updatedAt: serverTimestamp()
        });
        setNoteText('');
        // No need to manually update state, onSnapshot will handle it
      } catch (err) {
        console.error("Error saving note:", err);
      } finally {
        setIsNoteSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setActiveNoteMessageId(null)}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-3 border-b border-zinc-100 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-colombia-yellow/20 rounded-xl flex items-center justify-center text-colombia-blue">
                  <Highlighter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Anotaciones de Investigación</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Anotaciones para este hallazgo</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveNoteMessageId(null)}
                className="p-3 bg-zinc-100 rounded-2xl text-zinc-400 hover:text-zinc-900 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Notes List */}
            {existingNotes.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Notas Guardadas ({existingNotes.length})</h4>
                {existingNotes.map((note) => (
                  <div key={note.id} className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl group relative shadow-sm">
                    <p className="text-sm text-zinc-700 leading-relaxed font-bold pr-8">{note.content}</p>
                    <button 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-colombia-red transition-all rounded-xl hover:bg-colombia-red/10 border border-zinc-100 hover:border-colombia-red/20 bg-white shadow-sm"
                      title="Eliminar nota"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                    <div className="mt-2 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-zinc-300" />
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleString() : 'Recién guardada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Añadir nueva anotación</h4>
              <textarea 
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe aquí tus observaciones, hallazgos o decisiones..."
                rows={4}
                className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-[2rem] focus:ring-4 focus:ring-colombia-blue/5 outline-none transition-all font-medium text-zinc-700 resize-none text-sm leading-relaxed"
              />

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveNote}
                  disabled={isNoteSaving || !noteText.trim()}
                  className="flex-1 py-4 bg-colombia-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-colombia-blue/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isNoteSaving ? 'Guardando...' : 'Guardar Hallazgo'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };


  const renderResearchNotebook = () => {
    if (!isNotebookOpen) return null;

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed inset-y-0 right-0 z-[150] w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-zinc-100"
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-colombia-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-colombia-blue/20">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-zinc-900 uppercase">Cuaderno de Investigación</h2>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Memoria de investigación activa</p>
            </div>
          </div>
          <button 
            onClick={() => setIsNotebookOpen(false)}
            className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all hover:shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="relative group">
            <input 
              type="text"
              value={noteSearchTerm}
              onChange={(e) => setNoteSearchTerm(e.target.value)}
              placeholder="Buscar en mis hallazgos..."
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-colombia-blue/5 transition-all"
            />
            <Search className="absolute left-4 top-4.5 w-4 h-4 text-zinc-300 group-focus-within:text-colombia-blue transition-colors" />
            {noteSearchTerm && (
              <button 
                onClick={() => setNoteSearchTerm('')}
                className="absolute right-4 top-4.5 text-zinc-300 hover:text-zinc-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-6">
          {groupedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
              <History className="w-16 h-16 text-zinc-300" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest">No hay hallazgos</p>
                <p className="text-xs font-bold mt-1">Tus notas de investigación aparecerán aquí.</p>
              </div>
            </div>
          ) : (
            groupedNotes.map(([groupId, groupNotes]) => (
              <div key={groupId} className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-colombia-blue text-white rounded-3xl relative overflow-hidden shadow-lg shadow-colombia-blue/20">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="bg-colombia-yellow text-colombia-blue text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                      {groupNotes.length} {groupNotes.length === 1 ? 'Hallazgo' : 'Hallazgos'}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                    <History className="w-5 h-5 text-colombia-yellow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Consulta Principal:</p>
                    <h3 className="text-sm font-black uppercase tracking-tight truncate pr-16 text-colombia-yellow">
                      {conversations.find(c => c.id === groupId)?.title || groupNotes[0].conversationTitle || 'Consulta Histórica'}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pl-6 border-l-2 border-dashed border-zinc-100">
                  {groupNotes.map((note) => (
                    <motion.div 
                      layout
                      key={note.id}
                      className="group p-6 bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all space-y-4 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dato Verificado</span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-2.5 text-zinc-400 hover:text-colombia-red transition-all hover:bg-colombia-red/10 rounded-2xl border border-zinc-100 hover:border-colombia-red/20 active:scale-95 bg-white shadow-sm"
                          title="Eliminar hallazgo"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <p className="text-zinc-900 font-bold text-base leading-relaxed">
                          {note.content}
                        </p>
                        
                        {note.messageContext && (
                          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 opacity-60">Referencia contextul:</p>
                            <p className="text-xs text-zinc-500 leading-relaxed font-medium italic line-clamp-2">
                              "{note.messageContext}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleString() : 'Recién registrado'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-6">
          <ColombIAIcon isProcessing={true} size="lg" />
          <p className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse text-xs">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const strengthInfo = getPasswordStrength(authPassword);

    const handleEmailAuthSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccessMessage(null);
      
      try {
        if (emailMode === 'login') {
          if (!/\S+@\S+\.\S+/.test(authEmail)) {
            throw new Error("Por favor, ingresa un correo electrónico válido.");
          }
          await signInWithEmailAndPassword(auth, authEmail, authPassword);
        } else if (emailMode === 'register') {
          if (!authName.trim()) {
            throw new Error("El nombre es requerido para registrar tu cuenta.");
          }
          if (authPassword.length < 6) {
            throw new Error("La contraseña debe tener un mínimo de 6 caracteres.");
          }
          ignoreDeletedCheck.current = true;
          try {
            const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
            await updateProfile(credential.user, { displayName: authName });
            
            const role = (authEmail.trim() === 'carlosernesto.rios@gmail.com') ? 'admin' : 'public';
            const userRef = doc(db, 'users', credential.user.uid);
            await setDoc(userRef, {
              uid: credential.user.uid,
              email: credential.user.email,
              displayName: authName,
              photoURL: null,
              role: role,
              status: 'active',
              createdAt: serverTimestamp(),
              onboardingCompleted: false,
              emailVerified: false
            });
            
            try {
              await sendEmailVerification(credential.user).catch((err) => {
                console.warn("Primary sendEmailVerification during register failed, trying fallback:", err);
                const actionCodeSettings = {
                  url: window.location.origin,
                  handleCodeInApp: false
                };
                return sendEmailVerification(credential.user, actionCodeSettings);
              });
              setAuthSuccessMessage("¡Ciudadano registrado con éxito! Te hemos enviado un enlace de activación de cuenta. Recuerda revisar la carpeta de Correo No Deseado / Spam si no lo ves de inmediato.");
            } catch (emailErr: any) {
              console.error("Error sending initial verification email:", emailErr);
              setAuthSuccessMessage("¡Ciudadano registrado con éxito! Tu cuenta está lista. Hubo un retraso al enviar el correo automático, pero puedes de inmediato iniciar sesión y presionar 'Reenviar Correo de Validación'.");
            }

            setEmailMode('login');
            setTimeout(() => {
              ignoreDeletedCheck.current = false;
            }, 2500);
          } catch (err) {
            ignoreDeletedCheck.current = false;
            throw err;
          }
        } else if (emailMode === 'forgot_password') {
          if (!authEmail.trim()) {
            throw new Error("El correo electrónico es requerido para recuperar tu contraseña.");
          }
          if (!/\S+@\S+\.\S+/.test(authEmail)) {
            throw new Error("Por favor, ingresa un correo electrónico válido.");
          }
          await sendPasswordResetEmail(auth, authEmail);
          setAuthSuccessMessage("¡Enlace de recuperación enviado con éxito! Revisa tu bandeja de entrada o carpeta de Spam y sigue las instrucciones para cambiar tu contraseña.");
        }
      } catch (err: any) {
        let friendlyMsg = err.message || String(err);
        const errorStr = (err.code || err.message || String(err)).toLowerCase();
        
        if (errorStr.includes('auth/email-already-in-use') && emailMode === 'register') {
          ignoreDeletedCheck.current = true;
          try {
            const loginCred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
            const userRef = doc(db, 'users', loginCred.user.uid);
            const snapshot = await getDoc(userRef);
            
            if (!snapshot.exists()) {
              await deleteUser(loginCred.user).catch((e) => {
                console.warn("Could not delete legacy auth user:", e);
                return loginCred.user.delete();
              });

              const credential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
              await updateProfile(credential.user, { displayName: authName });
              
              const role = (authEmail.trim() === 'carlosernesto.rios@gmail.com') ? 'admin' : 'public';
              const newDocRef = doc(db, 'users', credential.user.uid);
              await setDoc(newDocRef, {
                uid: credential.user.uid,
                email: credential.user.email,
                displayName: authName,
                photoURL: null,
                role: role,
                status: 'active',
                createdAt: serverTimestamp(),
                onboardingCompleted: false,
                emailVerified: false
              });
              
              try {
                await sendEmailVerification(credential.user).catch((err) => {
                  console.warn("Primary sendEmailVerification during reactivation failed:", err);
                  const actionCodeSettings = {
                    url: window.location.origin,
                    handleCodeInApp: false
                  };
                  return sendEmailVerification(credential.user, actionCodeSettings);
                });
                setAuthSuccessMessage("¡Cuenta re-registrada de nuevo! Se ha enviado un enlace de activación de cuenta.");
              } catch (emailErr: any) {
                console.error("Error sending reactivation verification email:", emailErr);
                setAuthSuccessMessage("¡Cuenta re-registrada de nuevo! Tu cuenta está lista. Inicia sesión y reenvía el correo de validación si no lo ves de inmediato.");
              }

              setEmailMode('login');
              setTimeout(() => {
                ignoreDeletedCheck.current = false;
              }, 2500);
              setAuthLoading(false);
              return;
            } else {
              await signOut(auth);
              ignoreDeletedCheck.current = false;
              friendlyMsg = 'Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión con "Correo / Clave".';
              setAuthError(friendlyMsg);
              setAuthLoading(false);
              return;
            }
          } catch (reRegErr: any) {
            ignoreDeletedCheck.current = false;
            const authErrStr = (reRegErr.code || reRegErr.message || String(reRegErr)).toLowerCase();
            if (authErrStr.includes('wrong-password') || authErrStr.includes('invalid-credential') || authErrStr.includes('invalid-login-credentials')) {
              friendlyMsg = 'Este correo electrónico ya se encuentra registrado. Si tu cuenta anterior fue de hecho eliminada por un administrador, la contraseña ingresada no coincide para reactivarla.';
            } else {
              friendlyMsg = 'Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión con "Correo / Clave".';
            }
            setAuthError(friendlyMsg);
            setAuthLoading(false);
            return;
          }
        }
        
        const isUserAuthError = 
          errorStr.includes('auth/wrong-password') || 
          errorStr.includes('invalid-credential') || 
          errorStr.includes('invalid-login-credentials') ||
          errorStr.includes('auth/user-not-found') ||
          errorStr.includes('auth/email-already-in-use') ||
          errorStr.includes('auth/invalid-email') ||
          errorStr.includes('auth/weak-password');

        if (isUserAuthError) {
          console.warn("User auth notice (handled):", errorStr);
        } else {
          console.error("Auth error:", err);
        }
        
        if (errorStr.includes('auth/wrong-password') || errorStr.includes('invalid-credential') || errorStr.includes('invalid-login-credentials')) {
          friendlyMsg = 'Contraseña o credenciales incorrectas. Por favor verifíquelas.';
        } else if (errorStr.includes('auth/user-not-found')) {
          friendlyMsg = 'No existe una cuenta registrada con este correo.';
        } else if (errorStr.includes('auth/email-already-in-use')) {
          friendlyMsg = 'Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión con "Correo / Clave".';
        } else if (errorStr.includes('auth/invalid-email')) {
          friendlyMsg = 'La dirección de correo ingresada no es válida.';
        } else if (errorStr.includes('auth/operation-not-allowed')) {
          friendlyMsg = 'La autenticación mediante correo y contraseña no está habilitada. Por favor, inicia sesión con Google o contacta a un administrador.';
        } else if (errorStr.includes('auth/weak-password')) {
          friendlyMsg = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
        }
        setAuthError(friendlyMsg);
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="min-h-screen py-6 sm:py-10 w-full flex items-center justify-center bg-[#F3F4F6] p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 text-center space-y-4 border border-zinc-200/80 my-2 relative overflow-hidden"
        >
          {/* Top Brand Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FFCD00] via-[#003087] to-[#C8102E]" />

          <div className="flex flex-col items-center gap-3 pt-1">
            <ColombIAIcon size="md" />
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase leading-none">ColombIA Datos</h1>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Portal de Inteligencia Pública</p>
            </div>
          </div>

          {/* Authentication tabs */}
          <div className="grid grid-cols-2 bg-zinc-100 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => {
                setAuthMethod('google');
                setAuthError(null);
                setAuthSuccessMessage(null);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMethod === 'google' ? 'bg-white text-zinc-805 shadow-md font-black text-colombia-blue scale-[1.02]' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Google
            </button>
            <button
              onClick={() => {
                setAuthMethod('email');
                setAuthError(null);
                setAuthSuccessMessage(null);
              }}
              className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMethod === 'email' ? 'bg-white text-zinc-805 shadow-md font-black text-colombia-blue scale-[1.02]' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Correo / Clave
            </button>
          </div>

          {/* Feedback Messages */}
          {authError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-[11px] font-bold text-left leading-snug flex gap-2 items-start"
            >
              <span className="text-[14px] leading-none shrink-0">⚠️</span>
              <div>{authError}</div>
            </motion.div>
          )}

          {authSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-[11px] font-bold text-left leading-snug flex gap-2 items-start"
            >
              <span className="text-[14px] leading-none shrink-0">✅</span>
              <div>{authSuccessMessage}</div>
            </motion.div>
          )}

          {authMethod === 'google' ? (
            <div className="space-y-6">
              <p className="text-xs text-zinc-500 font-bold leading-relaxed px-4">
                Inicia sesión de forma rápida y segura con tu cuenta corporativa o personal de Google para acceder al catálogo nacional.
              </p>
              
              <button 
                onClick={() => {
                  setAuthError(null);
                  setAuthSuccessMessage(null);
                  const provider = new GoogleAuthProvider();
                  signInWithPopup(auth, provider).then(async (result) => {
                    const userRef = doc(db, 'users', result.user.uid);
                    const snapshot = await getDoc(userRef);
                    if (!snapshot.exists()) {
                      const role = (result.user.email === 'carlosernesto.rios@gmail.com') ? 'admin' : 'public';
                      await setDoc(userRef, {
                        uid: result.user.uid,
                        email: result.user.email,
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                        role: role,
                        status: 'active',
                        createdAt: serverTimestamp(),
                        onboardingCompleted: false
                      }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`));
                    }
                  }).catch(err => {
                    setAuthError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
                  });
                }}
                className="w-full flex items-center justify-center gap-4 bg-colombia-blue text-white py-3.5 rounded-3xl font-black uppercase tracking-widest hover:brightness-110 hover:scale-[1.01] transition-all shadow-xl shadow-colombia-blue/25 active:scale-[0.99] text-xs"
              >
                <div className="bg-white p-1 rounded-full shrink-0 flex items-center justify-center">
                  <ColombIAIcon size="sm" isProcessing={false} />
                </div>
                Ingresar con Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3 text-left">
              {/* Reset Password Form Header when custom mode is active */}
              {emailMode === 'forgot_password' && (
                <div className="space-y-1 mb-2 bg-zinc-50 p-3 flex flex-col border border-zinc-100 rounded-2xl">
                  <h3 className="text-xs font-black uppercase text-zinc-700 tracking-wide">Recuperación de Contraseña</h3>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                    Ingresa el correo con el que te registraste. Te enviaremos un correo para que cambies tu clave de forma guiada y segura.
                  </p>
                </div>
              )}

              {emailMode === 'register' && (
                <div className="space-y-1 focus-within:text-colombia-blue transition-colors">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                    Nombre del Ciudadano <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    disabled={authLoading}
                    placeholder="Escribe tu nombre y apellido"
                    className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-colombia-blue focus:bg-white transition-all disabled:opacity-60"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1 focus-within:text-colombia-blue transition-colors">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email"
                  disabled={authLoading}
                  placeholder="ejemplo@correo.gov.co"
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-colombia-blue focus:bg-white transition-all disabled:opacity-60"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              {emailMode !== 'forgot_password' && (
                <div className="space-y-1.5 focus-within:text-colombia-blue transition-colors">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <label>Contraseña <span className="text-red-500">*</span></label>
                    {emailMode === 'register' && <span className="text-[8px] text-zinc-400 lowercase">mín. 6 caracteres</span>}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      disabled={authLoading}
                      placeholder="••••••••••••"
                      className="w-full pr-12 pl-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-colombia-blue focus:bg-white transition-all disabled:opacity-60"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 transition-colors p-1"
                      title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Indicator during Signup */}
                  {emailMode === 'register' && authPassword.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1 pt-1"
                    >
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="text-zinc-400 uppercase">Seguridad:</span>
                        <span className="uppercase text-zinc-700 tracking-wider font-extrabold">{strengthInfo.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthInfo.color} transition-all duration-350`}
                          style={{ width: `${strengthInfo.score}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Forgot Password link during conventional sign-in */}
              {emailMode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('forgot_password');
                      setAuthError(null);
                      setAuthSuccessMessage(null);
                    }}
                    className="text-[9px] font-extrabold uppercase tracking-widest text-[#003087]/80 hover:text-[#003087] transition-all"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-colombia-blue text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all text-[11px] shadow-lg shadow-colombia-blue/15 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {emailMode === 'login' ? 'Iniciar Sesión' : emailMode === 'register' ? 'Registrar Ciudadano' : 'Enviar Enlace de Recuperación'}
              </button>

              {/* Advanced UI Modes Switcher */}
              <div className="text-center pt-2 space-y-1.5 border-t border-zinc-100 mt-2">
                {emailMode === 'forgot_password' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('login');
                      setAuthError(null);
                      setAuthSuccessMessage(null);
                    }}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-colombia-blue transition-all"
                  >
                    Volver al Inicio de Sesión
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode(emailMode === 'login' ? 'register' : 'login');
                        setAuthError(null);
                        setAuthSuccessMessage(null);
                      }}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-[#003087] hover:underline hover:brightness-95 transition-all text-center block w-full"
                    >
                      {emailMode === 'login' ? '¿No tienes cuenta? Registrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
          
          <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed px-4">
            Al ingresar, aceptas el tratamiento de datos personales para la consulta de información pública nacional conforme a la Ley 1581 de Protección de Datos.
          </p>
        </motion.div>
      </div>
    );
  }

  if (user && user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
    return (
      <div className="min-h-screen py-10 w-full flex items-center justify-center bg-[#E5E7EB] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 text-center space-y-6 sm:space-y-8 border border-zinc-200"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 text-[32px] text-colombia-blue rounded-full flex items-center justify-center font-bold">
              ✉
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Valida tu Cuenta</h1>
              <p className="text-xs font-bold text-colombia-blue uppercase tracking-widest leading-none">Verificación de Correo</p>
            </div>
          </div>
          
          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-left space-y-3">
            <p className="text-xs text-zinc-600 font-bold leading-relaxed">
              Hemos enviado un enlace de confirmación al correo: <strong className="text-zinc-800">{user.email}</strong>.
            </p>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Por favor revisa tu bandeja de entrada o la carpeta de spam para activar tu perfil de ciudadano de datos.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                  try {
                    await reload(currentUser);
                    
                    if (currentUser.emailVerified) {
                      const userRef = doc(db, 'users', currentUser.uid);
                      await updateDoc(userRef, { emailVerified: true }).catch(() => {});
                      setDbEmailVerified(true);
                      alert("¡Tu cuenta ha sido validada con éxito!");
                    } else {
                      alert("Aún no hemos detectado la confirmación. Haz clic en el enlace adjunto en el correo.");
                    }

                    // Create a clone preserving prototype properties (like providerData, emailVerified getters)
                    const clonedUser = Object.create(
                      Object.getPrototypeOf(currentUser),
                      Object.getOwnPropertyDescriptors(currentUser)
                    );
                    setUser(clonedUser);
                  } catch (reloadErr: any) {
                    console.error("Error reloading user auth status:", reloadErr);
                    alert(`Error al verificar estado de la cuenta: ${reloadErr.message || reloadErr}`);
                  }
                }
              }}
              className="w-full bg-colombia-blue text-white py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-colombia-blue/20 active:scale-95 text-xs"
            >
              Ya lo he verificado
            </button>

            <button 
              type="button"
              disabled={isSendingVerification || verificationCooldown > 0}
              onClick={async () => {
                if (!auth.currentUser) {
                  alert("No se detectó un usuario activo. Por favor inicia sesión de nuevo.");
                  return;
                }
                
                setIsSendingVerification(true);
                try {
                  // Standard direct email verification is the most robust & deliverable method
                  await sendEmailVerification(auth.currentUser);
                  
                  alert("¡Enlace de validación enviado! Revisa tu bandeja de entrada y no te olvides de la carpeta de Correo No Deseado / Spam.\n\nNota: Los servidores de correo (especialmente Hotmail y Outlook) pueden tardar un par de minutos en procesar y entregar el mensaje.");
                  setVerificationCooldown(60);
                } catch (err: any) {
                  const isTooManyRequests = err?.code === 'auth/too-many-requests' || err?.message?.includes('too-many-requests');
                  if (isTooManyRequests) {
                    alert("¡Límite de envíos alcanzado!\n\nPor seguridad y para evitar spam, el sistema de correo restringe temporalmente el envío de correos de verificación repetitivos. Por favor, espera de 1 a 2 minutos antes de intentarlo de nuevo.\n\nTe sugerimos revisar con calma tu carpeta de Spam / Correo No Deseado, ya que el último enlace enviado debe estar en camino a tu bandeja.");
                    setVerificationCooldown(120);
                    setIsSendingVerification(false);
                    return;
                  }

                  console.warn("Primary sendEmailVerification failed, trying fallback with custom settings:", err);
                  try {
                    const actionCodeSettings = {
                      url: window.location.origin,
                      handleCodeInApp: false
                    };
                    await sendEmailVerification(auth.currentUser, actionCodeSettings);
                    alert("¡Enlace de validación enviado con configuración alternativa! Revisa tu bandeja de entrada y tu carpeta de Spam.");
                    setVerificationCooldown(60);
                  } catch (fallbackErr: any) {
                    const isFallbackTooManyRequests = fallbackErr?.code === 'auth/too-many-requests' || fallbackErr?.message?.includes('too-many-requests');
                    if (isFallbackTooManyRequests) {
                      console.warn("Resend email verification hit rate limit (handled gracefully).");
                      alert("¡Límite de envíos alcanzado!\n\nEl sistema de seguridad ha restringido temporalmente los envíos de correo para evitar spam. Por favor, espera de 1 a 2 minutos y no olvides revisar tu bandeja de Spam / Correo No Deseado.");
                      setVerificationCooldown(120);
                    } else {
                      console.error("Both verification attempts failed:", fallbackErr);
                      alert(`Error al enviar el correo: ${fallbackErr.message || fallbackErr}. Por favor intenta de nuevo en unos minutos o revisa tu conexión.`);
                    }
                  }
                } finally {
                  setIsSendingVerification(false);
                }
              }}
              className={`w-full py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
                isSendingVerification || verificationCooldown > 0
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:scale-95"
              }`}
            >
              {isSendingVerification 
                ? "Enviando..." 
                : verificationCooldown > 0 
                  ? `Reenviar en ${verificationCooldown}s` 
                  : "Reenviar Correo de Validación"
              }
            </button>

            <button 
              onClick={() => signOut(auth)}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 text-[10px]"
            >
              Cerrar Sesión / Salir
            </button>
          </div>
          
          <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
            Si tienes inconvenientes, comunícate con el soporte del administrador.
          </p>
        </motion.div>
      </div>
    );
  }

  if (userStatus === 'suspended') {
    return (
      <div className="min-h-screen py-10 w-full flex items-center justify-center bg-[#E5E7EB] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 text-center space-y-6 sm:space-y-8 border border-zinc-200"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-50 text-colombia-red rounded-full flex items-center justify-center font-bold text-3xl">
              🚫
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase">Acceso Restringido</h1>
              <p className="text-xs font-bold text-colombia-red uppercase tracking-widest">Cuenta Suspendida</p>
            </div>
          </div>
          
          <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 text-left">
            <p className="text-xs text-zinc-600 font-semibold leading-relaxed">
              Tu cuenta ha sido suspendida temporalmente por un administrador de ColombIA Datos. No tienes permitido realizar consultas, explorar el catálogo o interactuar con la plataforma de datos abiertos.
            </p>
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-zinc-900 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.01] transition-all shadow-xl active:scale-[0.99] text-xs"
          >
            Cerrar Sesión / Salir
          </button>
          
          <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">
            Si consideras que se trata de un error, por favor comunícate con el Administrador de MINTIC.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#E5E7EB] text-zinc-900 font-sans p-0 lg:p-4 gap-4 overflow-hidden">
      {renderOnboardingModal()}
      {renderSignOutConfirmationModal()}
      {renderRequestAperturaModal()}
      {renderNoteModal()}
      {renderResearchNotebook()}

      <AnimatePresence>
        {selectedText && selectedTextPos && (
          <div 
            style={{ 
              position: 'fixed', 
              left: `${selectedTextPos.x}px`, 
              top: `${selectedTextPos.y}px`, 
              transform: 'translate(-50%, -100%)' 
            }}
            className="z-[200] pointer-events-auto"
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 10 }}
              onClick={() => {
                setNoteText(selectedText);
                setActiveNoteMessageId(selectedTextMsgId);
                setSelectedText('');
                setSelectedTextMsgId(null);
                setSelectedTextPos(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="convert-selection-btn flex items-center gap-2 px-5 py-3 bg-colombia-blue text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-2xl border border-white/10 hover:brightness-110 active:scale-95 transition-all"
            >
              <Highlighter className="w-4 h-4 text-colombia-yellow" />
              <span>Crear nota de selección</span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>


      {/* Global Visualization Modal */}
      <AnimatePresence>
        {activeVisualization && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVisualization(null)}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative"
            >
              <div className="flex-1 overflow-auto bg-white">
                <DataChart 
                  config={activeVisualization} 
                  isDefaultExpanded={true} 
                  onClose={() => setActiveVisualization(null)} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-colombia-red/10 text-colombia-red rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">¿Eliminar Conversación?</h3>
                  <p className="text-sm text-zinc-500">Esta acción no se puede deshacer y se perderán todos los mensajes del chat.</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setChatToDelete(null)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => deleteChat(chatToDelete)}
                    className="flex-1 py-4 bg-colombia-red text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-colombia-red/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {userToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-colombia-red/10 text-colombia-red rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">¿Eliminar Ciudadano?</h3>
                  <p className="text-sm text-zinc-500">¿Estás seguro de que deseas eliminar permanentemente el perfil de {userToDelete.email || 'este ciudadano'}? Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      const u = userToDelete;
                      setUserToDelete(null);
                      await deleteDoc(doc(db, 'users', u.uid))
                        .then(() => {
                          logAuditEvent(
                            'ELIMINAR_USUARIO',
                            `Se eliminó permanentemente el perfil del ciudadano con email: ${u.email || 'Anónimo'} (ID: ${u.uid})`
                          );
                        })
                        .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${u.uid}`));
                    }}
                    className="flex-1 py-4 bg-colombia-red text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-colombia-red/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {sourceToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSourceToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-colombia-red/10 text-colombia-red rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">¿Eliminar Fuente?</h3>
                  <p className="text-sm text-zinc-500">¿Estás seguro de que deseas eliminar la fuente "{sourceToDelete.name}" de forma permanente del catálogo nacional?</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setSourceToDelete(null)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      const source = sourceToDelete;
                      setSourceToDelete(null);
                      await deleteDoc(doc(db, 'dataSources', source.id))
                        .then(() => {
                          logAuditEvent(
                            'ELIMINAR_FUENTE_DATOS',
                            `Se eliminó permanentemente la fuente de datos '${source.name}' (ID: ${source.id})`
                          );
                        })
                        .catch(err => handleFirestoreError(err, OperationType.DELETE, `dataSources/${source.id}`));
                    }}
                    className="flex-1 py-4 bg-colombia-red text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-colombia-red/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {clearLogsConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setClearLogsConfirm(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-colombia-red/10 text-colombia-red rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">¿Limpiar errores?</h3>
                  <p className="text-sm text-zinc-500">¿Estás seguro de que deseas limpiar todo el historial de fallos y errores del sistema de forma permanente?</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setClearLogsConfirm(false)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      setClearLogsConfirm(false);
                      const logsToDelete = [...appErrorsList];
                      for (const log of logsToDelete) {
                        await deleteDoc(doc(db, 'appErrors', log.id)).catch(() => {});
                      }
                      logAuditEvent('LIMPIAR_REGISTRO_ERRORES', 'Se vació completamente el registro de excepciones de tiempo de ejecución.');
                    }}
                    className="flex-1 py-4 bg-colombia-red text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-colombia-red/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Dark Colombian Blue */}
      <aside className={`
        ${isSidebarCollapsed ? 'lg:p-4 lg:w-24' : 'lg:p-6 lg:w-80'} 
        p-6 w-72 xs:w-80 
        fixed top-4 bottom-4 left-4 z-50 lg:static 
        flex flex-col bg-colombia-blue rounded-3xl text-white gap-6 overflow-hidden shadow-2xl border border-white/10
        transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)] lg:translate-x-0'}
      `}>
        <div className="flex-shrink-0">
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col justify-center' : 'justify-between'} mb-8 transition-all duration-300`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <ColombIAIcon size="md" className="transform -rotate-3 transition-transform hover:rotate-0" />
                <h1 className="text-xl font-black tracking-tighter">ColombIA <span className="text-colombia-yellow">Datos</span></h1>
              </div>
            ) : (
              <div className="p-1" title="ColombIA Datos">
                <ColombIAIcon size="sm" className="transform -rotate-3 transition-transform hover:rotate-0" />
              </div>
            )}
            
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all font-bold"
              title="Cerrar menú"
            >
              <span className="lg:hidden">
                <X className="w-4 h-4" />
              </span>
              <span className="hidden lg:block">
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </span>
            </button>
          </div>
          
          <button 
            onClick={() => {
              createNewChat();
              setActiveView('chat');
              setIsMobileMenuOpen(false);
              setIsNotebookOpen(false);
            }}
            className={`flex items-center justify-center bg-colombia-yellow text-colombia-blue hover:brightness-110 transition-all shadow-xl shadow-black/10 active:scale-95 mb-8 ${isSidebarCollapsed ? 'w-12 h-12 rounded-full mx-auto p-0' : 'w-full px-4 py-4 text-sm font-black rounded-2xl'}`}
            title="Nueva Consulta"
          >
            <Plus className={`${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} stroke-[3px]`} />
            {!isSidebarCollapsed && <span className="ml-3">NUEVA CONSULTA</span>}
          </button>

          <nav className="space-y-1 mb-8">
            <button 
              onClick={() => {
                setIsNotebookOpen(!isNotebookOpen);
                setIsMobileMenuOpen(false);
              }}
              title="Cuaderno de Investigación"
              className={`w-full flex items-center transition-all relative ${isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider'} rounded-xl ${isNotebookOpen ? 'bg-white/10 text-colombia-yellow shadow-inner' : 'text-zinc-200 hover:bg-white/10 hover:text-white'}`}
            >
              <Library className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="truncate">Cuaderno de Investigación</span>
                  {notes.length > 0 && (
                    <span className="ml-auto bg-colombia-yellow text-colombia-blue text-[8px] px-2 py-0.5 rounded-full font-black shrink-0">
                      {notes.length}
                    </span>
                  )}
                </>
              )}
              {isSidebarCollapsed && notes.length > 0 && (
                <div className="relative">
                  <span className="absolute -top-1 right-0 w-2.5 h-2.5 bg-colombia-yellow rounded-full"></span>
                </div>
              )}
              {isNotebookOpen && (
                <div className="absolute right-0 top-2.5 bottom-2.5 w-1 bg-colombia-yellow rounded-l-md" />
              )}
            </button>
            <button 
              onClick={() => {
                setActiveView('catalog');
                setIsMobileMenuOpen(false);
                setIsNotebookOpen(false);
              }}
              title="Catálogo Nacional"
              className={`w-full flex items-center transition-all relative ${isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider'} rounded-xl ${activeView === 'catalog' ? 'bg-white/10 text-colombia-yellow shadow-inner' : 'text-zinc-200 hover:bg-white/10 hover:text-white'}`}
            >
              <Database className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Catálogo Nacional</span>}
              {activeView === 'catalog' && (
                <div className="absolute right-0 top-2.5 bottom-2.5 w-1 bg-colombia-yellow rounded-l-md" />
              )}
            </button>
            <button 
              onClick={() => {
                setActiveView('profile');
                setIsMobileMenuOpen(false);
                setIsNotebookOpen(false);
              }}
              title="Mi Perfil"
              className={`w-full flex items-center transition-all relative ${isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider'} rounded-xl ${activeView === 'profile' ? 'bg-white/10 text-colombia-yellow shadow-inner' : 'text-zinc-200 hover:bg-white/10 hover:text-white'}`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Mi Perfil</span>}
              {activeView === 'profile' && (
                <div className="absolute right-0 top-2.5 bottom-2.5 w-1 bg-colombia-yellow rounded-l-md" />
              )}
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  setActiveView('admin');
                  setIsMobileMenuOpen(false);
                  setIsNotebookOpen(false);
                }}
                title="Administración"
                className={`w-full flex items-center transition-all relative ${isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider'} rounded-xl ${activeView === 'admin' ? 'bg-white/10 text-colombia-red shadow-inner' : 'text-zinc-200 hover:bg-white/10 hover:text-white'}`}
              >
                <ShieldCheck className="w-4 h-4 text-colombia-red shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Administración</span>}
                {activeView === 'admin' && (
                  <div className="absolute right-0 top-2.5 bottom-2.5 w-1 bg-colombia-red rounded-l-md" />
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-1 custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-4 mb-4 animate-fadeIn">
              <h2 className="text-[10px] font-black text-white/60 uppercase tracking-[0.25em] mb-3 px-0 leading-none">Conversaciones</h2>
              <div className="relative group">
                <input 
                  type="text"
                  value={conversationSearchTerm}
                  onChange={(e) => setConversationSearchTerm(e.target.value)}
                  placeholder="Buscar chat..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-colombia-yellow/50 focus:border-colombia-yellow/50 focus:bg-white/15 transition-all font-bold shadow-inner"
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-300 group-focus-within:text-colombia-yellow transition-colors" />
                {conversationSearchTerm && (
                  <button 
                    onClick={() => setConversationSearchTerm('')}
                    className="absolute right-3 top-2.5 text-zinc-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {activeConversations
              .filter(chat => 
                isSidebarCollapsed ? true : chat.title.toLowerCase().includes(conversationSearchTerm.toLowerCase())
              )
              .map((chat) => (
                <div 
                  key={chat.id}
                  className={`w-full group flex items-center justify-between ${isSidebarCollapsed ? 'justify-center p-1' : 'px-2 py-1'} rounded-xl transition-all ${activeChatId === chat.id && activeView === 'chat' ? 'bg-white/15 border border-white/10 shadow-lg shadow-black/10' : 'hover:bg-white/10'}`}
                  title={chat.title}
                >
                  {isSidebarCollapsed ? (
                    <button 
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setActiveView('chat');
                        setIsMobileMenuOpen(false);
                        setIsNotebookOpen(false);
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${activeChatId === chat.id && activeView === 'chat' ? 'bg-colombia-yellow text-colombia-blue font-black shadow-md shadow-colombia-yellow/10' : 'text-zinc-200 hover:text-white bg-white/10 hover:bg-white/15'}`}
                    >
                      <span className="text-[10px] uppercase font-black">{chat.title.trim().substring(0, 2)}</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setActiveView('chat');
                          setIsMobileMenuOpen(false);
                          setIsNotebookOpen(false);
                        }}
                        className={`flex-1 text-left px-3 py-2.5 transition-all ${activeChatId === chat.id && activeView === 'chat' ? 'text-white font-black' : 'text-zinc-200 hover:text-white'}`}
                      >
                        <span className="text-xs truncate block">{chat.title}</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat.id);
                        }}
                        className={`p-2 mr-1 rounded-xl text-zinc-300 hover:bg-colombia-red hover:text-white transition-all ${activeChatId === chat.id ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
                        title="Eliminar conversación"
                        aria-label="Eliminar conversación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            {activeConversations.length > 0 && activeConversations.filter(chat => 
                isSidebarCollapsed ? true : chat.title.toLowerCase().includes(conversationSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="px-4 py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/5">
                  <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Sin resultados</p>
                </div>
              )}
          </div>
        </div>

        <div className="mt-auto flex-shrink-0 pt-6">
          <div className="flag-stripe mb-4 rounded-full overflow-hidden h-1.5 shadow-lg border border-white/5">
            <div className="flag-yellow"></div>
            <div className="flag-blue"></div>
            <div className="flag-red"></div>
          </div>
          {!isSidebarCollapsed && (
            <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-colombia-yellow mb-2">Transparencia Ciudadana</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold italic">
                Empoderando al ciudadano con datos reales.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area - White container with rounded corners */}
      <main className="flex-1 flex flex-col bg-white rounded-none lg:rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-zinc-200">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop side menu toggle */}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2.5 bg-zinc-50 hover:bg-zinc-150 text-zinc-650 hover:text-zinc-800 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-200 active:scale-95"
              title={isSidebarCollapsed ? "Expandir Menú Lateral" : "Minimizar Menú Lateral"}
            >
              <Menu className="w-4 h-4" />
            </button>
            {/* Mobile side menu toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 bg-zinc-50 hover:bg-zinc-150 text-zinc-650 hover:text-zinc-800 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-200 active:scale-95 mr-1"
              title="Abrir Menú"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden xs:block lg:hidden">
              <ColombIAIcon size="sm" />
            </div>
            <span className="font-black text-base lg:text-xl text-zinc-800 tracking-tighter uppercase">
              ColombIA <span className="text-colombia-blue">Datos</span> 
              <span className="hidden sm:inline-flex items-center text-zinc-400 font-bold ml-4 text-[10px] gap-2 tracking-widest leading-none">
                <span className="w-2 h-2 bg-colombia-yellow rounded-full animate-pulse shadow-[0_0_8px_rgba(255,205,0,0.8)]"></span>
                Portal de Inteligencia Pública
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                createNewChat();
                setActiveView('chat');
                setIsNotebookOpen(false);
              }}
              className="p-3 text-zinc-400 hover:text-colombia-blue hover:bg-zinc-50 rounded-2xl transition-all" 
              title="Nuevo Chat"
            >
              <Plus className="w-6 h-6" />
            </button>
            <div className="h-8 w-px bg-zinc-100 hidden sm:block"></div>
            <button 
              onClick={() => {
                setActiveView('profile');
                setIsNotebookOpen(false);
              }}
              className="flex items-center gap-3 p-1.5 pr-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all border border-zinc-200 group h-11"
            >
              <UserAvatar size="sm" name={userDocData?.displayName || user?.displayName} photoURL={userDocData?.photoURL || user?.photoURL} className="transition-transform group-hover:scale-105 border-2 border-white shadow-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Perfil</span>
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  setActiveView('admin');
                  setIsNotebookOpen(false);
                }}
                className={`flex items-center gap-2 px-4 h-11 rounded-2xl transition-all border ${activeView === 'admin' ? 'bg-colombia-red text-white border-colombia-red shadow-lg shadow-colombia-red/20' : 'bg-zinc-50 text-colombia-red border-zinc-200 hover:bg-colombia-red/5'}`}
                title="Administración"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Admin</span>
              </button>
            )}
            <button 
              onClick={() => setIsSignOutConfirmOpen(true)}
              className="flex items-center gap-2 px-5 h-11 bg-zinc-50 rounded-2xl text-zinc-500 hover:text-colombia-red hover:bg-colombia-red/5 transition-all border border-zinc-200 shadow-sm whitespace-nowrap"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        {activeView === 'catalog' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <CatalogView />
          </div>
        ) : activeView === 'admin' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AdminView />
          </div>
        ) : activeView === 'profile' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ProfileView 
              user={user}
              setUser={setUser}
              userDocData={userDocData}
              setUserDocData={setUserDocData}
              userRole={userRole}
              setIsSignOutConfirmOpen={setIsSignOutConfirmOpen}
            />
          </div>
        ) : (
          <>
            {/* Chat Area - Subtle background color for depth */}
            <div 
              ref={scrollRef}
              className={`flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth bg-zinc-50/50 custom-scrollbar ${isLandingPage ? 'flex flex-col' : 'space-y-6 sm:space-y-8'}`}
            >
              {/* Only show Hero if it's a fresh chat with only the welcome message, or no messages at all */}
              {isLandingPage ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5 md:space-y-6 max-w-2xl w-full mx-auto my-auto py-2 sm:py-4"
                >
                  <div className="relative">
                    <ColombIAIcon size="lg" className="mb-1 animate-pulse" />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 leading-none uppercase font-sans">
                      Democratizando <br/> 
                      <span className="text-colombia-blue">los datos</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 font-semibold leading-relaxed max-w-xs sm:max-w-md mx-auto">
                      Explora el ecosistema de datos abiertos de Colombia con <br className="hidden sm:inline" /> inteligencia artificial soberana.
                    </p>
                  </div>

                  {/* Initial Message Integrated into Hero - Styled without suggested query chips */}
                  <div className="w-full max-w-xl bg-white p-4 sm:p-5 px-5 sm:px-7 rounded-3xl shadow-xl border border-zinc-100/80 relative transition-all duration-300">
                    <div className="absolute -top-3 -left-3 sm:-top-3.5 sm:-left-3.5 shadow-md rounded-xl">
                      <ColombIAIcon size="sm" />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 font-bold leading-relaxed italic text-center">
                      "{messages[0]?.content || settings.welcomeMessage || '¡Hola! Soy ColombIA Datos, tu asistente de IA para explorar, entender y visualizar los datos abiertos de Colombia (datos.gov.co). ¿En qué te puedo ayudar hoy?'}"
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex gap-4 w-full ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex gap-4 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0 pt-1">
                          {msg.role === 'assistant' ? (
                            <ColombIAIcon isProcessing={false} size="sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-colombia-yellow text-colombia-blue shadow-lg ring-2 ring-colombia-yellow/10">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 min-w-0">
                        <div 
                          onMouseUp={(e) => {
                            if (msg.role === 'assistant') {
                              handleMessageMouseUp(e, msg.id);
                            }
                          }}
                          className={`shadow-xl px-7 py-5 rounded-[2.5rem] ${msg.role === 'assistant' ? 'bg-white border border-zinc-100 cursor-text select-text' : 'bg-colombia-blue text-white shadow-colombia-blue/20'}`}
                        >
                          <div className={`markdown-body flex flex-col gap-3 text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-zinc-700'}`}>
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </Markdown>
                          </div>
                        </div>

                        {/* AI Thinking Steps - Only shown during active processing */}
                        {msg.role === 'assistant' && isLoading && idx === messages.length - 1 && Array.isArray(msg.thinking) && msg.thinking.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.thinking.map((step, i) => (
                              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-100 rounded-full text-[10px] text-zinc-400 font-black uppercase tracking-widest shadow-sm">
                                <span className="w-2 h-2 bg-colombia-yellow rounded-full animate-pulse"></span>
                                {step}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action Bar - Tool de Decisión */}
                        {msg.role === 'assistant' && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <div className="flex bg-zinc-50 border border-zinc-100 rounded-2xl p-1 gap-1">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  // Simple visual feedback
                                }}
                                className="p-2.5 text-zinc-400 hover:text-colombia-blue hover:bg-white rounded-xl transition-all"
                                title="Copiar respuesta"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setFeedback(prev => ({...prev, [msg.id]: 'positive'}))}
                                className={`p-2.5 rounded-xl transition-all ${feedback[msg.id] === 'positive' ? 'bg-white text-green-500 shadow-sm' : 'text-zinc-400 hover:text-green-500 hover:bg-white'}`}
                                title="Favorable"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setFeedback(prev => ({...prev, [msg.id]: 'negative'}))}
                                className={`p-2.5 rounded-xl transition-all ${feedback[msg.id] === 'negative' ? 'bg-white text-red-500 shadow-sm' : 'text-zinc-400 hover:text-red-500 hover:bg-white'}`}
                                title="No favorable"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex bg-zinc-50 border border-zinc-100 rounded-2xl p-1 gap-1">
                              {msg.visualization && (
                                <button 
                                  onClick={() => setActiveVisualization(msg.visualization!)}
                                  className="p-2.5 text-zinc-400 hover:text-colombia-blue hover:bg-white rounded-xl transition-all flex items-center gap-2"
                                  title="Analizar Gráfica"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase hidden sm:inline">Análisis</span>
                                </button>
                              )}
                              {msg.datasets && msg.datasets.length > 0 && (
                                <button 
                                  onClick={() => window.open(msg.datasets![0].url, '_blank')}
                                  className="p-2.5 text-zinc-400 hover:text-colombia-blue hover:bg-white rounded-xl transition-all flex items-center gap-2"
                                  title={`Ver fuente: ${msg.datasets[0].name}`}
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase hidden sm:inline">Fuentes</span>
                                </button>
                              )}
                              <button 
                                onClick={() => setActiveNoteMessageId(msg.id)}
                                className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${notesByMessage[msg.id]?.length > 0 ? 'bg-colombia-yellow/20 text-zinc-900 shadow-sm border border-colombia-yellow/30' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white'}`}
                                title={notesByMessage[msg.id]?.length > 0 ? `${notesByMessage[msg.id].length} notas guardadas` : 'Añadir nota'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${notesByMessage[msg.id]?.length > 0 ? 'fill-colombia-yellow text-colombia-yellow' : ''}`} />
                                <span className="text-[9px] font-black uppercase hidden sm:inline">
                                  {notesByMessage[msg.id]?.length > 0 ? `Nota (${notesByMessage[msg.id].length})` : 'Nota'}
                                </span>
                              </button>
                              <button 
                                onClick={() => handleSubmit(undefined, msg.role === 'assistant' ? messages[idx-1]?.content : msg.content)}
                                className="p-2.5 text-zinc-400 hover:text-colombia-blue hover:bg-white rounded-xl transition-all"
                                title="Regenerar"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>


                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 max-w-[80%]">
                    <div className="flex-shrink-0">
                      <ColombIAIcon isProcessing={true} />
                    </div>
                    <div className="p-5 bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm italic text-zinc-400 text-sm font-medium">
                      Consultando el Catálogo Nacional de Datos Abiertos...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className={`px-6 pt-4 pb-3 transition-all duration-300 ease-in-out ${isLandingPage ? 'bg-transparent border-t-0 border-transparent pt-0' : 'bg-zinc-100/50 backdrop-blur-xl border-t border-zinc-200'}`}>
            <div className="max-w-3xl mx-auto space-y-4">

              {/* Inteligencia de Contexto: Objetivo de Investigación y Atajos */}
              {!isLandingPage && !isLoading && !isContextCollapsed && (researchObjective || shortcutChips.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white border border-zinc-200/85 p-5 rounded-[2rem] shadow-xl animate-in fade-in duration-200 space-y-4"
                >
                  <div className="flex justify-between items-center select-none pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-colombia-blue shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Sugerencias Contextuales</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsContextCollapsed(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase text-zinc-400 hover:text-zinc-650 hover:bg-zinc-50 rounded-xl transition-all"
                      title="Ocultar panel"
                    >
                      <span>Ocultar</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {researchObjective && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block ml-1">Objetivo Detectado:</span>
                        <div className="bg-colombia-blue/[0.03] border border-colombia-blue/10 px-4 py-3 rounded-2xl text-xs text-zinc-700 font-medium leading-relaxed italic shadow-inner">
                          {researchObjective}
                        </div>
                      </div>
                    )}
                    {shortcutChips.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block ml-1">Preguntas y Atajos Sugeridos:</span>
                        <div className="flex flex-wrap gap-2">
                          {shortcutChips.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setInput(chip);
                                handleSubmit(undefined, chip);
                              }}
                              className="bg-zinc-50 hover:bg-colombia-blue/10 border border-zinc-200 hover:border-colombia-blue/30 text-zinc-700 hover:text-colombia-blue px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                            >
                              <span className="text-colombia-yellow text-[11px]">★</span>
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Input Form */}
              <form 
                onSubmit={handleSubmit}
                className="relative group"
              >
                <div className="relative">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregúntame sobre cualquier dato público de Colombia..."
                    className={`w-full p-5 pl-8 ${(!isLandingPage && !isLoading && (researchObjective || shortcutChips.length > 0)) ? 'pr-44' : 'pr-28'} bg-white border-2 border-zinc-100 rounded-3xl shadow-2xl focus:outline-none focus:border-colombia-blue/30 transition-all font-medium text-zinc-700 text-base placeholder:text-zinc-400`}
                    id="user-query-input"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    {/* Trigger de Inteligencia de Contexto */}
                    {!isLandingPage && !isLoading && (researchObjective || shortcutChips.length > 0) && (
                      <button 
                        type="button"
                        onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                        title={isContextCollapsed ? "Ver sugerencias de investigación" : "Ocultar sugerencias"}
                        className={`p-3 rounded-2xl transition-all relative flex items-center justify-center ${
                          !isContextCollapsed 
                            ? "text-colombia-blue bg-colombia-blue/10 scale-105" 
                            : "text-zinc-400 hover:text-colombia-blue hover:bg-colombia-blue/5"
                        }`}
                      >
                        <Sparkles className="w-5 h-5 shrink-0" />
                        {isContextCollapsed && shortcutChips.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-colombia-blue text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                            {shortcutChips.length}
                          </span>
                        )}
                      </button>
                    )}

                    <button 
                      type="button"
                      title="Modo voz"
                      className="p-3 text-zinc-400 hover:text-colombia-blue hover:bg-colombia-blue/5 rounded-2xl transition-all"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-3 bg-colombia-blue text-white rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:bg-zinc-300 transition-all shadow-lg shadow-colombia-blue/30 active:scale-95 flex items-center justify-center px-4"
                      id="send-button"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
        )}
      </main>
    </div>
  );
}

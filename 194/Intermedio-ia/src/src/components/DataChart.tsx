import React, { useState, useEffect, useMemo } from 'react';
import { 
  Maximize2, 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Database, 
  X, 
  Download, 
  Check 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  Brush,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { VisualizationData } from '../types';

interface DataChartProps {
  config: VisualizationData;
  isDefaultExpanded?: boolean;
  onClose?: () => void;
}

export const DataChart = ({ config, isDefaultExpanded = false, onClose }: DataChartProps) => {
  const [viewType, setViewType] = useState<'bar' | 'line' | 'pie' | 'table'>(config.type);
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  const [renderChart, setRenderChart] = useState(false);

  useEffect(() => {
    setIsExpanded(isDefaultExpanded);
  }, [isDefaultExpanded]);

  useEffect(() => {
    // Small delay to ensure layout and animations are stabilized
    const timer = setTimeout(() => setRenderChart(true), 300);
    return () => clearTimeout(timer);
  }, [isExpanded, viewType]);

  if (!config.data || config.data.length === 0) return null;

  // Robust value getter to handle key mismatch (spaces, case, underscores, "de/del" variations)
  const getRowValue = (row: any, key: string) => {
    if (row === null || row === undefined) return '-';
    if (row[key] !== undefined && row[key] !== null) return row[key];
    
    const normalize = (k: string) => {
      if (typeof k !== 'string') return '';
      return k.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/_/g, '')
        .replace(/de/g, '')
        .replace(/del/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    const normalizedTarget = normalize(key);
    if (!normalizedTarget) return '-';
    
    // Find key by normalized comparison
    const allKeys = Object.keys(row);
    const matchedKey = allKeys.find(k => normalize(k) === normalizedTarget);
    
    if (matchedKey) return row[matchedKey];

    // Fuzzy fallback: check if target is contained in any key or vice versa
    const fuzzyMatch = allKeys.find(k => {
      const nk = normalize(k);
      return nk && (nk.includes(normalizedTarget) || normalizedTarget.includes(nk));
    });

    if (fuzzyMatch) return row[fuzzyMatch];
    
    return '-';
  };

  const normalizedData = useMemo(() => {
    if (!config.data) return [];
    return config.data.map(row => {
      const xVal = getRowValue(row, config.xAxis);
      const yRaw = getRowValue(row, config.yAxis);
      // Try to parse Y axis as number for charts
      let yVal = 0;
      if (typeof yRaw === 'number') {
        yVal = yRaw;
      } else if (typeof yRaw === 'string') {
        // Handle Colombian currency format often returned (e.g. $ 1.000.000,00)
        const cleanStr = yRaw.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
        yVal = parseFloat(cleanStr) || 0;
      }
      
      return {
        ...row,
        x: xVal,
        y: yVal,
        _originalY: yRaw // Keep for table display
      };
    }).filter(row => row.x !== '-' || row.y !== 0);
  }, [config.data, config.xAxis, config.yAxis]);

  if (normalizedData.length === 0) return null;

  const renderChartContent = () => (
    <div className="w-full h-full flex flex-col">
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-4 relative">
        <div className="flex items-center gap-3 pr-12 sm:pr-0">
          <h3 className="text-base font-black text-zinc-900 truncate tracking-tight uppercase max-w-[200px] md:max-w-md">{config.title}</h3>
          {!isExpanded && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-colombia-blue transition-colors"
              title="Expandir vista"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 rounded-2xl p-1.5 self-start sm:self-auto">
            <button 
              onClick={() => setViewType('bar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${viewType === 'bar' ? 'bg-colombia-blue text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Barras</span>
            </button>
            <button 
              onClick={() => setViewType('line')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${viewType === 'line' ? 'bg-colombia-blue text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Líneas</span>
            </button>
            <button 
              onClick={() => setViewType('pie')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${viewType === 'pie' ? 'bg-colombia-blue text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'}`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Torta</span>
            </button>
            <button 
              onClick={() => setViewType('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${viewType === 'table' ? 'bg-colombia-blue text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'}`}
            >
              <Database className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Datos</span>
            </button>
          </div>
          
          {isExpanded && (
            <button 
              onClick={() => onClose ? onClose() : setIsExpanded(false)}
              className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-900 transition-all ml-2"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="w-full flex-1 p-6 overflow-hidden" style={{ height: isExpanded ? 'calc(100vh - 300px)' : '400px', minHeight: '350px' }}>
        {viewType === 'table' ? (
          <div className="h-full overflow-auto text-xs rounded-2xl border border-zinc-100">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-zinc-50 shadow-sm z-10">
                <tr>
                  <th className="text-left py-4 px-6 font-black text-zinc-400 border-b border-zinc-100 uppercase tracking-[0.2em]">{config.xAxis}</th>
                  <th className="text-right py-4 px-6 font-black text-zinc-400 border-b border-zinc-100 uppercase tracking-[0.2em]">{config.yAxis}</th>
                </tr>
              </thead>
              <tbody>
                {normalizedData.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 px-6 border-b border-zinc-50 font-bold text-zinc-700">{row.x}</td>
                    <td className="py-4 px-6 border-b border-zinc-50 text-right font-mono text-colombia-blue font-black">
                      {(() => {
                        const val = row._originalY;
                        const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
                        return (typeof num === 'number' && !isNaN(num)) ? num.toLocaleString() : val;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : renderChart ? (
          <div className="w-full h-full min-w-0">
            <ResponsiveContainer width="99%" height="100%" key={`${isExpanded}-${viewType}-${renderChart}`}>
              {viewType === 'bar' ? (
                <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#003087" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#003087" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="x" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#71717a', fontWeight: 600 }} 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#71717a', fontWeight: 600 }}
                    tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: '#003087', fillOpacity: 0.05 }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#003087', textTransform: 'uppercase' }}
                    labelStyle={{ fontWeight: 900, color: '#18181b', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Bar dataKey="y" fill="url(#barGradient)" name={config.yAxis} radius={[8, 8, 0, 0]} />
                  {config.data.length > 8 && <Brush dataKey="x" height={30} stroke="#e4e4e7" fill="#fafafa" startIndex={0} endIndex={Math.min(config.data.length - 1, 8)} />}
                </BarChart>
              ) : viewType === 'line' ? (
                <LineChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis 
                    dataKey="x" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#71717a', fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#71717a', fontWeight: 600 }}
                    tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#003087', textTransform: 'uppercase' }}
                    labelStyle={{ fontWeight: 900, color: '#18181b', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    name={config.yAxis} 
                    stroke="#003087" 
                    strokeWidth={4} 
                    dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                  {config.data.length > 8 && <Brush dataKey="x" height={30} stroke="#e4e4e7" fill="#fafafa" startIndex={0} endIndex={Math.min(config.data.length - 1, 8)} />}
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={normalizedData}
                    dataKey="y"
                    nameKey="x"
                    cx="50%"
                    cy="40%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    fill="#003087"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {config.data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#FFCD00', '#003087', '#C8102E', '#0072CE', '#54B848'][index % 5]} className="stroke-white stroke-[6px]" />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{value}</span>}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center min-h-[300px]">
             <div className="w-8 h-8 border-4 border-zinc-200 border-t-colombia-blue rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center px-8">
        <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">CATÁLOGO ABIERTO • COLOMBIA</span>
        <div className="flex items-center gap-6">
          <button 
            onClick={(e) => {
              const target = e.currentTarget;
              const originalText = target.innerHTML;
              
              const BOM = '\uFEFF';
              const csv = [
                [config.xAxis, config.yAxis],
                ...config.data.map(row => [row[config.xAxis], row[config.yAxis]])
              ].map(e => e.join(";")).join("\n");
              
              const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', `${config.title.replace(/\s+/g, '_')}.csv`);
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              target.innerHTML = `<span class="flex items-center gap-2 text-emerald-600"><Check class="w-3.5 h-3.5" /> LISTO</span>`;
              setTimeout(() => {
                target.innerHTML = originalText;
              }, 2000);
            }}
            className="text-[9px] text-zinc-500 hover:text-colombia-blue flex items-center gap-2 font-black uppercase tracking-widest transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );

  if (isDefaultExpanded) {
    return (
      <div className="w-full h-full bg-white flex flex-col" id={`chart-${config.title.replace(/\s+/g, '-').toLowerCase()}`}>
        {renderChartContent()}
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 flex flex-col mb-4 overflow-hidden" id={`chart-${config.title.replace(/\s+/g, '-').toLowerCase()}`}>
        {renderChartContent()}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative"
            >
              <div className="flex-1 overflow-auto bg-white">
                {renderChartContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

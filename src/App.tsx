/* Chronos AI Productivity | v1.0.0 */
import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Zap, 
  BookOpen, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  History,
  Timer,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { getProductivityAdvice, type TimeWindow, type ProductivityResponse, type Priority } from './services/geminiService';
import { soundService } from './services/soundService';
import { cn, formatDate } from './lib/utils';
import { TIME_OPTIONS, PRIORITY_OPTIONS } from './lib/constants';

interface HistoryItem {
  id: string;
  task: string;
  timeWindow: TimeWindow;
  priority: Priority;
  response: ProductivityResponse;
  timestamp: number;
}

export default function App() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(() => {
    const saved = localStorage.getItem('chronos_time_window');
    return (saved as TimeWindow) || '30-60m';
  });
  const [priority, setPriority] = useState<Priority>(() => {
    const saved = localStorage.getItem('chronos_priority');
    return (saved as Priority) || 'medium';
  });
  const [task, setTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ProductivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTimeAgnostic, setIsTimeAgnostic] = useState(true);
  const [isPromptingTime, setIsPromptingTime] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!response) return;
    const text = `${response.title}\n\n${response.summary}\n\nSteps:\n${response.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}${response.miniExercise ? `\n\nExercise:\n${response.miniExercise}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      soundService.playClick();
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('chronos_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('chronos_history', JSON.stringify(history));
  }, [history]);

  // Sync preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chronos_time_window', timeWindow);
    localStorage.setItem('chronos_priority', priority);
  }, [timeWindow, priority]);

  const handleConsult = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!task.trim()) return;

    if (isTimeAgnostic) {
      setIsPromptingTime(true);
      soundService.playClick();
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsPromptingTime(false);
    try {
      const data = await getProductivityAdvice(task, timeWindow, priority);
      setResponse(data);
      
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        task,
        timeWindow,
        priority,
        response: data,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Missing GEMINI_API_KEY")) {
        setError("API CONFIGURATION ERROR: Please set your GEMINI_API_KEY environment variable in your local environment.");
      } else if (msg.includes("QUOTA EXHAUSTED") || msg.includes("MODEL NOT FOUND") || msg.includes("connectivity issue")) {
        setError(msg);
      } else {
        setError('Failed to distill practical intelligence. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTimeAndProcess = (window: TimeWindow) => {
    setTimeWindow(window);
    setIsTimeAgnostic(false);
    // Slight delay to allow state to settle
    setTimeout(() => handleConsult(), 50);
  };

  const deleteHistoryItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    soundService.playClick();
  };

  const clearAllHistory = () => {
    if (confirm("Clear all session chronology? This cannot be undone.")) {
      setHistory([]);
      soundService.playSubmit();
    }
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setResponse(item.response);
    setTask(item.task);
    setTimeWindow(item.timeWindow);
    setPriority(item.priority || 'medium');
    setShowHistory(false);
    soundService.playClick();
  };

  const priorityOptions = PRIORITY_OPTIONS;
  const timeOptions = TIME_OPTIONS;

  const Tooltip = ({ text, isFocusMode }: { text: string; isFocusMode: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap z-50 pointer-events-none shadow-xl border transition-colors duration-700",
        isFocusMode 
          ? "bg-white text-black border-white" 
          : "bg-black text-white border-black"
      )}
    >
      {text}
      <div className={cn(
        "absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent",
        isFocusMode ? "border-t-white" : "border-t-black"
      )} />
    </motion.div>
  );

  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<string | null>(null);

  const [isFocusMode, setIsFocusMode] = useState(false);

  const DistillationLoader = ({ isFocusMode }: { isFocusMode: boolean, key?: string }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-20 flex flex-col items-center justify-center text-center"
    >
      <div className="relative w-32 h-32 mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute inset-0 border-2 border-dashed rounded-full opacity-20",
            isFocusMode ? "border-white" : "border-black"
          )}
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute inset-4 border-2 border-solid rounded-full",
            isFocusMode ? "border-blue-400" : "border-amber-500"
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
             animate={{ opacity: [0.4, 1, 0.4] }}
             transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Timer size={32} className={isFocusMode ? "text-white" : "text-black"} />
          </motion.div>
        </div>
      </div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="space-y-2"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Recalibrating Time Currency</h3>
        <p className={cn(
          "text-[10px] font-mono opacity-40 uppercase tracking-widest",
          isFocusMode ? "text-white" : "text-black"
        )}>Distilling actionable intelligence...</p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={cn(
      "min-h-screen transition-all duration-700 selection:bg-black selection:text-white relative overflow-hidden",
      isFocusMode ? "bg-[#0A0A0A] text-white" : "bg-[#FBFBF9] text-[#1A1A1A]"
    )}>
      {/* Spotlight Effect for Focus Mode */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 70%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar/Rail (Desktop) */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 w-16 border-r hidden lg:flex flex-col items-center py-8 gap-8 z-20 transition-colors duration-700",
        isFocusMode ? "bg-black border-white/10" : "bg-white border-[#E8E8E6]"
      )}>
        <button 
          aria-label="Toggle Focus Mode"
          onClick={() => {
            const nextMode = !isFocusMode;
            setIsFocusMode(nextMode);
            soundService.playToggle(nextMode);
          }}
          className={cn(
            "p-2 rounded-lg transition-all",
            isFocusMode ? "bg-white text-black" : "bg-black text-white"
          )}
        >
          {isFocusMode ? <Zap size={20} /> : <Timer size={24} />}
        </button>
        <button 
          aria-label="View History"
          onClick={() => {
            setShowHistory(!showHistory);
            soundService.playClick();
          }}
          className={cn(
            "p-2 rounded-lg transition-all",
            showHistory 
              ? (isFocusMode ? "bg-white text-black" : "bg-black text-white")
              : (isFocusMode ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600")
          )}
        >
          <History size={20} />
        </button>
        <div className="flex-1 flex flex-col gap-6 justify-center">
           <div className={cn(
             "[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-widest font-medium transition-colors duration-700",
             isFocusMode ? "text-white/40" : "text-gray-400"
           )}>
             Practical Intelligence
           </div>
        </div>
        <div className={cn(
          "text-[10px] font-mono transition-colors duration-700",
          isFocusMode ? "text-white/20" : "text-gray-400"
        )}>v1.0</div>
      </div>

      <main className="lg:pl-16 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* Header Section */}
        <header className="mb-16">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-6 opacity-60">
            <Sparkles size={14} className={isFocusMode ? "text-blue-400" : "text-amber-500"} />
            <span>Chronos Productivity AI</span>
          </div>
          <h1 className="font-serif text-6xl lg:text-8xl font-normal tracking-tight mb-6 leading-[0.9]">
            Time is <span className="italic">currency.</span>
          </h1>
          <p className={cn(
            "max-w-xl text-xl font-light leading-relaxed transition-colors duration-700",
            isFocusMode ? "text-white/60" : "text-gray-500"
          )}>
            Our Practical Intelligence engine recalibrates your goals into the most effective actions possible for your current window.
          </p>
        </header>

        {/* Current Time Widget */}
        <div className={cn(
          "mb-12 p-8 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm transition-all duration-700",
          isFocusMode ? "bg-white/5 border-white/10" : "bg-white border-[#E8E8E6]"
        )}>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold mb-2">Live Session Monitor</div>
            <div className="font-mono text-3xl font-medium tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">Priority Weight</div>
             <div className={cn(
               "flex p-1 rounded-2xl gap-1 transition-colors duration-700",
               isFocusMode ? "bg-white/10" : "bg-[#F5F5F3]"
             )}>
               {priorityOptions.map((opt) => {
                 const isActive = priority === opt.value;
                 return (
                   <div key={opt.value} className="relative group/btn">
                     {isActive && (
                       <motion.div
                         layoutId="activePriority"
                         className={cn(
                           "absolute inset-0 rounded-xl z-0",
                           isFocusMode ? "bg-white" : "bg-white shadow-sm"
                         )}
                         transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                       />
                     )}
                     <button
                       onMouseEnter={() => setHoveredPriority(opt.value)}
                       onMouseLeave={() => setHoveredPriority(null)}
                       onClick={() => {
                         setPriority(opt.value);
                         soundService.playClick();
                       }}
                       className={cn(
                         "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider",
                         isActive 
                          ? "text-black scale-105"
                          : (isFocusMode ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600")
                       )}
                     >
                       <span>{opt.value}</span>
                     </button>
                     <AnimatePresence>
                       {hoveredPriority === opt.value && (
                         <Tooltip text={opt.description} isFocusMode={isFocusMode} />
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
             </div>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className={cn(
               "flex p-1 rounded-2xl gap-1 transition-colors duration-700",
               isFocusMode ? "bg-white/10" : "bg-[#F5F5F3]"
             )}>
               {timeOptions.map((opt) => {
                 const Icon = opt.icon;
                 const isActive = timeWindow === opt.value;
                 return (
                   <div key={opt.value} className="relative group/btn">
                     {isActive && (
                       <motion.div
                         layoutId="activeTime"
                         className={cn(
                           "absolute inset-0 rounded-xl z-0",
                           isFocusMode ? "bg-white" : "bg-white shadow-sm"
                         )}
                         transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                       />
                     )}
                     <button
                       onMouseEnter={() => setHoveredTime(opt.value)}
                       onMouseLeave={() => setHoveredTime(null)}
                       onClick={() => {
                         setTimeWindow(opt.value);
                         soundService.playClick();
                       }}
                       className={cn(
                         "relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider",
                         isActive 
                          ? "text-black scale-105"
                          : (isFocusMode ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-600")
                       )}
                     >
                       <Icon size={14} />
                       <span>{opt.label}</span>
                     </button>
                     <AnimatePresence>
                       {hoveredTime === opt.value && (
                         <Tooltip text={opt.description} isFocusMode={isFocusMode} />
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Goal Input */}
        <section className="mb-16">
          <form onSubmit={handleConsult} className="relative">
            <input
              type="text"
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                setIsTimeAgnostic(true);
              }}
              placeholder="What are you trying to accomplish?"
              className={cn(
                "w-full border rounded-[2rem] px-10 py-8 text-xl lg:text-3xl font-light focus:outline-none shadow-sm transition-all placeholder:text-gray-300",
                isFocusMode 
                  ? "bg-white/5 border-white/10 text-white focus:border-white/30" 
                  : "bg-white border-[#E8E8E6] text-black focus:border-black/10"
              )}
            />
            <button
              type="submit"
              disabled={isLoading || !task}
              className={cn(
                "absolute right-4 top-4 bottom-4 px-8 rounded-2xl transition-all flex items-center gap-2 group",
                isFocusMode 
                  ? "bg-white text-black hover:bg-gray-200" 
                  : "bg-black text-white hover:bg-gray-800",
                "disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              )}
            >
              <span className="font-bold text-xs uppercase tracking-widest">{isPromptingTime ? "Adjusting..." : "Distill"}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Interactive Time Prompt */}
          <AnimatePresence>
            {isPromptingTime && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={cn(
                  "mt-6 p-10 rounded-[3rem] border text-center relative overflow-hidden",
                  isFocusMode ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-2xl"
                )}
              >
                <div className="relative z-10">
                  <h3 className="font-serif italic text-3xl mb-8">How much time can we allocate?</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {timeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => selectTimeAndProcess(opt.value)}
                        className={cn(
                          "flex items-center gap-3 px-8 py-5 rounded-[1.5rem] transition-all font-bold uppercase tracking-widest text-xs",
                          isFocusMode 
                            ? "bg-white/10 hover:bg-white text-white hover:text-black border border-white/10" 
                            : "bg-black hover:bg-gray-800 text-white shadow-lg"
                        )}
                      >
                        <opt.icon size={18} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsPromptingTime(false)}
                    className="mt-8 text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 hover:opacity-100 transition-opacity"
                  >
                    Cancel Recalibration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-4 text-red-400 text-xs flex items-center gap-1 font-bold uppercase tracking-widest">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <DistillationLoader key="loader" isFocusMode={isFocusMode} />
          ) : response ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              {/* Main Insight */}
              <div className="lg:col-span-2 space-y-10">
                <div className={cn(
                  "border p-10 rounded-[3rem] shadow-sm transition-colors duration-700",
                  isFocusMode ? "bg-white/5 border-white/10" : "bg-white border-[#E8E8E6]"
                )}>
                  <div className="flex items-center gap-4 mb-10">
                    <div className={cn(
                      "w-14 h-14 rounded-3xl flex items-center justify-center transition-colors duration-700",
                      isFocusMode ? "bg-white text-black" : "bg-black text-white"
                    )}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif italic mb-1">{response.title}</h2>
                      <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Practical Intelligence Stream</div>
                    </div>
                    <button
                      aria-label="Copy to clipboard"
                      onClick={copyToClipboard}
                      className={cn(
                        "ml-auto p-3 rounded-2xl transition-all flex items-center gap-2",
                        isFocusMode 
                          ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                      )}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                        {isCopied ? "Copied" : "Copy"}
                      </span>
                    </button>
                  </div>
                  
                  <p className={cn(
                    "text-xl leading-relaxed mb-10 font-light transition-colors duration-700",
                    isFocusMode ? "text-white/80" : "text-gray-600"
                  )}>
                    {response.summary}
                  </p>

                  <div className="space-y-6">
                    {response.steps.map((step, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 + 0.3 }}
                        key={i} 
                        className={cn(
                          "flex gap-6 p-6 rounded-3xl group transition-all duration-700",
                          isFocusMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-50/50 hover:bg-gray-100/50"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-2xl border flex items-center justify-center text-[10px] font-mono group-hover:scale-110 transition-all duration-500",
                          isFocusMode ? "border-white/20 text-white/40" : "border-gray-200 text-gray-400"
                        )}>
                          {i + 1}
                        </div>
                        <p className={cn(
                          "leading-relaxed transition-colors duration-700",
                          isFocusMode ? "text-white/90" : "text-gray-700"
                        )}>{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {response.miniExercise && (
                  <div className={cn(
                    "p-12 rounded-[3.5rem] relative overflow-hidden transition-all duration-700",
                    isFocusMode ? "bg-white text-black" : "bg-[#1A1A1A] text-white"
                  )}>
                    <div className="relative z-10">
                      <div className={cn(
                        "flex items-center gap-2 mb-6 text-[10px] uppercase tracking-[0.4em] font-bold opacity-60",
                        isFocusMode ? "text-black" : "text-white"
                      )}>
                        <Sparkles size={14} className={isFocusMode ? "text-blue-600" : "text-amber-400"} />
                        <span>Core Training Component</span>
                      </div>
                      <h3 className="text-4xl font-serif mb-8 italic">The Focus Exercise</h3>
                      <p className={cn(
                        "text-xl font-light leading-extended opacity-80",
                        isFocusMode ? "text-black/80" : "text-white/80"
                      )}>
                        {response.miniExercise}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar/Context */}
              <div className="space-y-6">
                {response.warning ? (
                  <div className={cn(
                    "p-8 rounded-3xl border transition-colors duration-700",
                    isFocusMode ? "bg-amber-400/10 border-amber-400/20" : "bg-amber-50 border-amber-100"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 mb-4 font-bold text-[10px] uppercase tracking-[0.2em]",
                      isFocusMode ? "text-amber-400" : "text-amber-700"
                    )}>
                      <AlertCircle size={16} />
                      Warning Signal
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed font-medium transition-colors duration-700",
                      isFocusMode ? "text-amber-200" : "text-amber-900/80"
                    )}>
                      {response.warning}
                    </p>
                  </div>
                ) : (
                  <div className={cn(
                    "p-8 rounded-3xl border transition-colors duration-700",
                    isFocusMode ? "bg-emerald-400/10 border-emerald-400/20" : "bg-emerald-50 border-emerald-100"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 mb-4 font-bold text-[10px] uppercase tracking-[0.2em]",
                      isFocusMode ? "text-emerald-400" : "text-emerald-700"
                    )}>
                      <CheckCircle2 size={16} />
                      Success Path
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed font-medium transition-colors duration-700",
                      isFocusMode ? "text-emerald-200" : "text-emerald-900/80"
                    )}>
                      Your goal is highly compatible with the selected window. Maximum productivity expected.
                    </p>
                  </div>
                )}

                <div className={cn(
                  "p-8 border rounded-3xl transition-colors duration-700",
                  isFocusMode ? "bg-white/5 border-white/10" : "bg-white border-[#E8E8E6]"
                )}>
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mb-6">Efficiency Breakdown</div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Cognitive Load</span>
                      <span className="text-xs font-mono">{isFocusMode ? 'Optimized' : 'Normal'}</span>
                    </div>
                    <div className={cn("h-1 rounded-full overflow-hidden transition-colors", isFocusMode ? "bg-white/10" : "bg-gray-100")}>
                      <div className={cn("h-full transition-all duration-1000", isFocusMode ? "bg-blue-400 w-[45%]" : "bg-black w-[65%]")} />
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Expected Mastery</span>
                      <span className="text-xs font-mono">{timeWindow === '2h+' ? 'Incremental' : 'Surface'}</span>
                    </div>
                    <div className={cn("h-1 rounded-full overflow-hidden transition-colors", isFocusMode ? "bg-white/10" : "bg-gray-100")}>
                      <div className={cn("h-full transition-all duration-1000", isFocusMode ? "bg-purple-400 w-[25%]" : "bg-black w-[25%]")} />
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-8 border border-dashed rounded-3xl text-center transition-colors duration-700",
                  isFocusMode ? "border-white/10" : "border-gray-200"
                )}>
                  <p className={cn(
                    "text-[11px] italic opacity-40 transition-colors duration-700",
                    isFocusMode ? "text-white" : "text-gray-900"
                  )}>
                    "Intelligence is the ability to adapt to change." — Hawking
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* History Drawer Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  "fixed right-0 top-0 bottom-0 w-full max-w-md z-50 p-8 shadow-2xl flex flex-col",
                  isFocusMode ? "bg-[#1A1A1A] text-white border-l border-white/10" : "bg-white text-black"
                )}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <History size={20} className={isFocusMode ? "text-blue-400" : "text-amber-500"} />
                    <h2 className="font-serif text-2xl italic">Chronology</h2>
                    {history.length > 0 && (
                      <button 
                        aria-label="Clear All History"
                        onClick={clearAllHistory}
                        className={cn(
                          "ml-4 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md transition-all",
                          isFocusMode ? "text-red-400 hover:bg-white/10" : "text-red-500 hover:bg-red-50"
                        )}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <button 
                    aria-label="Close History"
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowRight size={20} className="rotate-180" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <Clock size={48} className="mb-4 stroke-1" />
                      <p className="text-sm font-medium tracking-widest uppercase">No history detected</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className={cn(
                          "group p-6 rounded-2xl border transition-all cursor-pointer relative",
                          isFocusMode 
                            ? "bg-white/5 border-white/10 hover:bg-white/10" 
                            : "bg-gray-50 border-gray-100 hover:border-gray-300 shadow-sm"
                        )}
                      >
                        <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2 flex justify-between">
                          <span>{formatDate(item.timestamp)} • {item.timeWindow} • {item.priority}</span>
                          <button 
                            aria-label="Delete history item"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2 leading-relaxed">
                          {item.task}
                        </h3>
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                          Re-distill <ArrowRight size={10} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className={cn(
        "py-12 border-t text-center transition-colors duration-700",
        isFocusMode ? "border-white/10" : "border-[#E8E8E6]"
      )}>
        <p className={cn(
          "text-[10px] uppercase tracking-[0.5em] font-bold opacity-20 transition-colors duration-700",
          isFocusMode ? "text-white" : "text-black"
        )}>
          Engineered for Deep Work & Practical Intelligence
        </p>
      </footer>
    </div>
  );
}

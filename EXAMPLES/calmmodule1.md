import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  CheckSquare, 
  Target, 
  Heart, 
  Users, 
  Wine, 
  Ban, 
  AlertTriangle, 
  Activity, 
  Brain, 
  Map, 
  Film,
  Menu,
  X,
  Printer,
  ChevronRight,
  ChevronLeft,
  Save,
  Check,
  Upload,
  Trash2,
  Download,
  UploadCloud,
  FileText,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileCheck,
  RotateCcw
} from 'lucide-react';

// --- SHARED UI COMPONENTS (PLAYFUL EDTECH / CLAYMORPHISM) ---

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[2rem] p-6 md:p-10 mb-8 border-2 border-slate-100 shadow-[0_8px_0_0_#e2e8f0,0_15px_40px_rgba(0,0,0,0.05)] transition-all duration-300 print:break-inside-avoid print:shadow-none print:border-slate-300 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children, subtitle }) => (
  <div className="mb-10 text-center md:text-left print:break-after-avoid">
    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
      {children}
    </h2>
    {subtitle && (
      <div className="mt-3 inline-block bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-bold border-2 border-violet-200 print:border-none print:bg-transparent print:p-0 print:text-slate-600">
        {subtitle}
      </div>
    )}
  </div>
);

const Label = ({ children, description }) => (
  <div className="mb-2 mt-6 print:break-after-avoid">
    <label className="block text-base font-bold text-slate-700">
      {children}
    </label>
    {description && <p className="text-sm font-medium text-slate-500 mt-1">{description}</p>}
  </div>
);

const HintToggle = ({ example }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-3 mt-1 print:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-black uppercase tracking-wider text-violet-500 hover:text-violet-700 transition-colors flex items-center bg-violet-50 px-3 py-1.5 rounded-xl border-2 border-violet-100 hover:border-violet-300 active:bg-violet-100"
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        {isOpen ? "Hide Idea" : "Need an idea?"}
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 bg-slate-50 text-slate-600 text-sm font-medium rounded-2xl border-2 border-slate-200 border-dashed">
          <strong className="text-slate-800 block mb-1">Example Answer:</strong> 
          "{example}"
        </div>
      </div>
    </div>
  );
};

const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 outline-none hover:border-violet-300 print:bg-white print:border-slate-300 print:shadow-none"
  />
);

// SMART AUTO-EXPANDING TEXTAREA
const Textarea = ({ value, onChange, placeholder, rows = 3 }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-colors duration-200 outline-none hover:border-violet-300 resize-none leading-relaxed overflow-hidden print:bg-white print:border-slate-300 print:shadow-none"
    />
  );
};

const PillRadioGroup = ({ options, name, value, onChange }) => (
  <div className="flex flex-wrap gap-3 mt-3 mb-6 print:break-inside-avoid">
    {options.map((opt) => {
      const isSelected = value === opt;
      return (
        <label 
          key={opt} 
          className={`
            cursor-pointer select-none inline-flex items-center px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border-2
            ${isSelected 
              ? 'bg-violet-500 border-violet-600 text-white shadow-[0_4px_0_0_#5b21b6] translate-y-[-2px] print:bg-violet-100 print:text-violet-900 print:border-violet-400 print:shadow-none print:translate-y-0' 
              : 'bg-white border-slate-200 text-slate-600 shadow-[0_4px_0_0_#e2e8f0] hover:border-violet-200 hover:text-violet-600 active:translate-y-[2px] active:shadow-none print:shadow-none'}
          `}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={isSelected}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          {opt}
        </label>
      )
    })}
  </div>
);

const KnowledgeDrop = ({ title, children, defaultOpen = true, color = "sky" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorStyles = {
    sky: "bg-sky-50 border-sky-200 text-sky-900 shadow-[0_4px_0_0_#bae6fd]",
    amber: "bg-amber-50 border-amber-200 text-amber-900 shadow-[0_4px_0_0_#fde68a]",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-[0_4px_0_0_#a7f3d0]",
    rose: "bg-rose-50 border-rose-200 text-rose-900 shadow-[0_4px_0_0_#fecdd3]",
    violet: "bg-violet-50 border-violet-200 text-violet-900 shadow-[0_4px_0_0_#ddd6fe]"
  };

  const iconColors = {
    sky: "bg-sky-200 text-sky-700",
    amber: "bg-amber-200 text-amber-700",
    emerald: "bg-emerald-200 text-emerald-700",
    rose: "bg-rose-200 text-rose-700",
    violet: "bg-violet-200 text-violet-700"
  };

  return (
    <div className={`rounded-2xl border-2 mb-8 transition-all duration-300 overflow-hidden print:break-inside-avoid print:shadow-none ${colorStyles[color]}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 focus:outline-none focus:bg-white/50 transition-colors print:hidden"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${iconColors[color]}`}>
            <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="font-black text-lg md:text-xl tracking-tight">Read This First: {title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-6 h-6 opacity-60" /> : <ChevronDown className="w-6 h-6 opacity-60" />}
      </button>

      {/* Print-only title */}
      <div className="hidden print:flex items-center gap-3 p-4 border-b-2 border-slate-200">
        <Lightbulb className="w-5 h-5" />
        <span className="font-black text-lg tracking-tight">Read This First: {title}</span>
      </div>
      
      <div className={`transition-all duration-300 ease-in-out print:max-h-none print:opacity-100 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 md:p-6 pt-0 text-base font-medium leading-relaxed opacity-90 border-t-2 border-white/40 mt-2 print:border-none print:pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const prevStatsRef = useRef();

  // --- STATE FOR FORM DATA ---
  // REMOVED: studentName (Brightspace tracks identity via submission)
  const defaultFormData = {
    invSleep: '', invSnacks: '', invEatTimes: '', invEnergyHigh: '', invEnergyLow: '',
    invExerciseEnergize: '', invExerciseTired: '', invRelax: '',
    invPencilsPens: '', invOrganized: '', invWriteType: '', invElectronics: '', invMusic: '',
    invSit: '', invReadFrom: '', invColor: '', invPrintType: '', invSizeSpacing: '', invGoals: '',
    invDirections: {}, invFocusTricks: '', invTeacherHelp: '',
    goalAchieve: '', goalMeasure: '', goalWho: '', goalWhat: '', goalWhen: '', goalHow: '',
    goalAttainable: '', goalRealistic: '', goalTimed: '', goalImportance: '', goalOther: '',
    romRankings: {}, romEasiest: '', romHardest: '', romNormal: '', romUnhealthyProg: '',
    evalRels: ['', '', '', '', ''],
    evalHealthyList: ['', '', '', '', ''], evalUnhealthyList: ['', '', '', '', ''],
    evalFeelHealthy: '', evalFeelUnhealthy: '', evalWhyStay: '',
    alcWhyDrink: '', alcThoughts: '', alcCelebrate: '', alcOffered: '', alcHowMuch: '',
    alcProsCons: [{pro: '', con: ''}, {pro: '', con: ''}, {pro: '', con: ''}], alcResources: '',
    tobKnow: '', tobNeg: '', tobPos: '', tobWhyStart: '', tobConvince: '',
    vapeKnow: '', vapeWhy: '', weedThoughts: '',
    riskRatings: {}, riskHealthy: ['', '', '', '', ''], riskUnhealthy: ['', '', '', '', ''],
    riskDetermine: '', riskWhyUnhealthy: '',
    addDefine: '', addTypes: '', addScen1: '', addScen2: '', addScen3: '',
    mhHardTalk: '', mhEmotions: '', mhKnowWrong: '', mhHelpFriend: '', mhHelpSelf: '',
    mapAccomplish: '', mapObstacle: '', mapStrategies: '', mapSkills: '', mapImageData: '',
    ioQ1: '', ioQ2: '', ioQ3: '', ioQ4: '', ioQ5: '', ioQ6: '', ioQ7: '', ioQ8: '', ioQ9: '', ioQ10: ''
  };

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('calm_workbook_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved data", e);
    }
    return defaultFormData;
  });

  // Inject Confetti Script on Mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Auto-save effect
  useEffect(() => {
    setSaveStatus('Saving...');
    localStorage.setItem('calm_workbook_data', JSON.stringify(formData));
    const timeoutId = setTimeout(() => setSaveStatus('Saved'), 500);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateArrayField = (field, index, value) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    updateForm(field, newArr);
  };

  const handleResetWorkbook = () => {
    if (window.confirm("🚨 WARNING: This will completely delete all your answers. Are you sure you want to start over?")) {
      setFormData(defaultFormData);
      localStorage.removeItem('calm_workbook_data');
      setActiveTab('overview');
      window.scrollTo(0, 0);
    }
  };

  // --- PROGRESS TRACKING ENGINE ---
  const progressData = useMemo(() => {
    const getCompletedCount = (fields) => {
      return fields.reduce((acc, f) => {
        if (typeof f === 'string' && f.trim() !== '') return acc + 1;
        if (typeof f === 'number') return acc + 1;
        return acc;
      }, 0);
    };

    const stats = {
      overview: { completed: 1, total: 1 }, // Overview requires no inputs now
      inventory: { 
        completed: getCompletedCount([
          formData.invSleep, formData.invSnacks, formData.invEatTimes, formData.invEnergyHigh, formData.invEnergyLow,
          formData.invExerciseEnergize, formData.invExerciseTired, formData.invRelax, formData.invPencilsPens,
          formData.invOrganized, formData.invWriteType, formData.invElectronics, formData.invMusic, formData.invSit,
          formData.invReadFrom, formData.invColor, formData.invPrintType, formData.invSizeSpacing, formData.invGoals,
          formData.invFocusTricks, formData.invTeacherHelp
        ]) + Object.keys(formData.invDirections).length, 
        total: 21 + 8 
      },
      goals: { 
        completed: getCompletedCount([
          formData.goalAchieve, formData.goalMeasure, formData.goalWho, formData.goalHow, formData.goalWhat,
          formData.goalWhen, formData.goalAttainable, formData.goalRealistic, formData.goalTimed,
          formData.goalImportance, formData.goalOther
        ]), 
        total: 11 
      },
      romantic: { 
        completed: getCompletedCount([
          formData.romEasiest, formData.romHardest, formData.romNormal, formData.romUnhealthyProg
        ]) + Object.keys(formData.romRankings).length, 
        total: 4 + 16 
      },
      evaluating: { 
        completed: getCompletedCount([
          ...formData.evalRels, ...formData.evalHealthyList, ...formData.evalUnhealthyList,
          formData.evalFeelHealthy, formData.evalFeelUnhealthy, formData.evalWhyStay
        ]), 
        total: 5 + 5 + 5 + 3 
      },
      alcohol: { 
        completed: getCompletedCount([
          formData.alcWhyDrink, formData.alcThoughts, formData.alcCelebrate, formData.alcOffered, formData.alcHowMuch,
          formData.alcResources, ...formData.alcProsCons.flatMap(pc => [pc.pro, pc.con])
        ]), 
        total: 6 + 6 
      },
      tobacco: { 
        completed: getCompletedCount([
          formData.tobKnow, formData.tobNeg, formData.tobPos, formData.tobWhyStart, formData.tobConvince,
          formData.vapeKnow, formData.vapeWhy, formData.weedThoughts
        ]), 
        total: 8 
      },
      risk: { 
        completed: getCompletedCount([
          formData.riskDetermine, formData.riskWhyUnhealthy,
          ...formData.riskHealthy, ...formData.riskUnhealthy
        ]) + Object.keys(formData.riskRatings).length, 
        total: 2 + 10 + 20 
      },
      addictions: { 
        completed: getCompletedCount([
          formData.addDefine, formData.addTypes, formData.addScen1, formData.addScen2, formData.addScen3
        ]), 
        total: 5 
      },
      mentalhealth: { 
        completed: getCompletedCount([
          formData.mhHardTalk, formData.mhEmotions, formData.mhKnowWrong, formData.mhHelpFriend, formData.mhHelpSelf
        ]), 
        total: 5 
      },
      taskA: { 
        completed: getCompletedCount([
          formData.mapAccomplish, formData.mapObstacle, formData.mapStrategies, formData.mapSkills, formData.mapImageData
        ]), 
        total: 5 
      },
      taskB: { 
        completed: getCompletedCount([
          formData.ioQ1, formData.ioQ2, formData.ioQ3, formData.ioQ4, formData.ioQ5,
          formData.ioQ6, formData.ioQ7, formData.ioQ8, formData.ioQ9, formData.ioQ10
        ]), 
        total: 10 
      }
    };

    let totalCompleted = 0;
    let totalFields = 0;
    
    Object.keys(stats).forEach(key => {
      totalCompleted += stats[key].completed;
      totalFields += stats[key].total;
      stats[key].isComplete = stats[key].completed >= stats[key].total;
    });

    const overallPercentage = totalFields === 0 ? 0 : Math.round((totalCompleted / totalFields) * 100);
    
    return { stats, overallPercentage };
  }, [formData]);

  // Confetti Trigger Effect
  useEffect(() => {
    if (!prevStatsRef.current) {
      prevStatsRef.current = progressData.stats;
      return;
    }

    let newlyCompleted = false;
    Object.keys(progressData.stats).forEach(key => {
      const isNowComplete = progressData.stats[key].isComplete;
      const wasComplete = prevStatsRef.current[key]?.isComplete;
      
      if (isNowComplete && !wasComplete) {
        newlyCompleted = true;
      }
    });

    if (newlyCompleted && window.confetti) {
      const duration = 2000;
      const end = Date.now() + duration;

      (function frame() {
        window.confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'],
          zIndex: 9999
        });
        window.confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'],
          zIndex: 9999
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }

    prevStatsRef.current = progressData.stats;
  }, [progressData]);

  const relationshipSteps = [
    "Intercourse", "Talking On The Phone", "Basic Communication (Shared Interests)",
    "Exchanging Messages", "\"Steady\" Dating (Exclusive)", "Dating",
    "Basic Trust (Keeping Secrets)", "Birth Control and STI Protection",
    "Simple Kissing", "Minor Touching (Holding Hands)", "Intimacy (Non-Sexual)",
    "Love", "Eye Contact", "Long-Term Commitment", "Touching (Long Embraces)", "Flirting"
  ];

  const riskQuestions = [
    "1. Rate the risk of singing in a choir in front of the entire school.",
    "2. What if there is a long solo part where you have to sing by yourself?",
    "3. How would you rate the risk of trying cannabis at a party for the first time?",
    "4. What if you know people who are dependent on using cannabis on a regular basis?",
    "5. How would you rate driving 15 km over the speed limit on the highway?",
    "6. What if the road is dry and there is hardly any traffic?",
    "7. Rate the risk of standing up for something you strongly believe in?",
    "8. What if your friends are against you and this creates conflict?",
    "9. Rate the risk of drinking two beers before going to a party.",
    "10. What if you have \"blacked out\" at parties before?",
    "11. Rate the risk of buying a $5.00 raffle ticket.",
    "12. What if it is your last $5.00 until the end of the week?",
    "13. Rate the risk of speaking in a debate.",
    "14. What if your opponent is the Prime Minister of Canada?",
    "15. How risky would you find being involved in a sporting event?",
    "16. What if your skill level is very low in this sport?",
    "17. Rate the risk of injecting a drug using a needle.",
    "18. What if someone else has used the needle before?",
    "19. Rate the risk of smoking a cigarette every so often.",
    "20. What if you knew that this would lead to a pack-a-day habit?"
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-100' },
    { id: 'inventory', label: 'My Inventory', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 'goals', label: 'Goal Setting', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { id: 'romantic', label: 'Romance', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100' },
    { id: 'evaluating', label: 'Relationships', icon: Users, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'alcohol', label: 'Alcohol', icon: Wine, color: 'text-fuchsia-500', bg: 'bg-fuchsia-100' },
    { id: 'tobacco', label: 'Vapes & Tobacco', icon: Ban, color: 'text-slate-500', bg: 'bg-slate-200' },
    { id: 'risk', label: 'Risk Taking', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'addictions', label: 'Addictions', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'mentalhealth', label: 'Mental Health', icon: Brain, color: 'text-cyan-500', bg: 'bg-cyan-100' },
    { id: 'taskA', label: 'Life Map', icon: Map, color: 'text-lime-600', bg: 'bg-lime-100' },
    { id: 'taskB', label: 'Inside Out', icon: Film, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'submit', label: 'Finish & Submit', icon: FileCheck, color: 'text-blue-500', bg: 'bg-blue-100' },
  ];

  const handlePrint = () => {
    setPrintMode(true);
    // Expand all knowledge drops for printing
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 500);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CALM_Workbook_Backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    let content = `CALM Module 1 Workbook Submission\n`;
    content += `=========================================\n\n`;
    
    const addQA = (q, a) => {
      content += `${q}\n-> ${a || 'Not answered'}\n\n`;
    };

    content += `--- SECTION: WHAT WORKS FOR ME ---\n`;
    addQA("Sleep needed", formData.invSleep);
    addQA("Energy snacks", formData.invSnacks);
    addQA("Tricks to focus", formData.invFocusTricks);

    content += `--- SECTION: GOAL SETTING ---\n`;
    addQA("Specific Goal Statement", `${formData.goalWho} ${formData.goalHow} ${formData.goalWhat} ${formData.goalWhen}`);
    addQA("Is it attainable?", formData.goalAttainable);

    content += `--- SECTION: RELATIONSHIPS ---\n`;
    addQA("Easiest to rank", formData.romEasiest);
    addQA("Network Top Contact", formData.evalRels[0]);
    addQA("Why stay in unhealthy relationships?", formData.evalWhyStay);
    
    content += `--- SECTION: ALCOHOL & DRUGS ---\n`;
    addQA("Thoughts on alcohol", formData.alcThoughts);
    addQA("Vaping knowledge", formData.vapeKnow);
    addQA("Thoughts on cannabis", formData.weedThoughts);

    content += `--- SECTION: MENTAL HEALTH ---\n`;
    addQA("Why is depression hard to talk about?", formData.mhHardTalk);
    addQA("How to help a friend", formData.mhHelpFriend);

    content += `--- SECTION: TASKS ---\n`;
    addQA("Task A: Proudest accomplishment", formData.mapAccomplish);
    addQA("Task B: Q1 (Joy in charge)", formData.ioQ1);

    content += `\n[Note: This is a generated Brightspace Export view. Some minor fields omitted for brevity.]\n`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CALM_Module1_Submission.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        setFormData(prev => ({ ...prev, ...importedData }));
      } catch (error) {
        console.error("Invalid backup file.", error);
        alert("Oops! This doesn't look like a valid workbook backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); 
        updateForm('mapImageData', compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const renderOverview = () => (
    <Card className="border-t-[8px] border-t-violet-500">
      <div className="flex flex-col items-center text-center mb-12 print:mb-6">
        <div className="w-20 h-20 bg-violet-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_4px_0_0_#ddd6fe] print:shadow-none print:border-2 print:border-violet-200">
          <BookOpen className="w-10 h-10 text-violet-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">nextSTEP High School</h1>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm border-2 border-slate-200">Fort Saskatchewan</span>
          <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm border-2 border-slate-200">Sherwood Park</span>
          <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm border-2 border-slate-200">Vegreville</span>
        </div>
      </div>
      
      <div className="mb-10 bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 text-center">
        <p className="font-bold text-blue-800">
          👋 Welcome! You don't need to type your name here. When you submit your final file, Brightspace automatically links your work to your profile!
        </p>
      </div>

      <SectionTitle>Career & Life Management</SectionTitle>
      <div className="text-slate-600 space-y-6 text-lg font-medium leading-relaxed print:text-base">
        <p>CALM is a compulsory course for Alberta High School students. It is the final component of the grade 1-12 Health Promotion Program. It is a 3 credit course, and is broken up into 3 modules.</p>
        <p>The aim of CALM is to enable students to make well informed, considered decisions and choices in all aspects of their lives.</p>
        
        <div className="bg-slate-50 rounded-[2rem] p-8 mt-8 border-2 border-slate-200 shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)] print:bg-white print:shadow-none print:border-slate-300 print:break-inside-avoid">
          <h3 className="font-black text-slate-800 mb-6 text-2xl">The 3 Pillars of Life Choices:</h3>
          <div className="space-y-4">
            <div className="flex items-start bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm print:shadow-none print:border-slate-300">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-black text-xl mr-4 flex-shrink-0">1</div>
              <div>
                <strong className="text-slate-800 text-lg block mb-1">Personal Choices</strong>
                <span className="text-sm">Apply understanding of well-being and personal health to daily teenage decisions.</span>
              </div>
            </div>
            <div className="flex items-start bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm print:shadow-none print:border-slate-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl mr-4 flex-shrink-0">2</div>
              <div>
                <strong className="text-slate-800 text-lg block mb-1">Resource Choices</strong>
                <span className="text-sm">Understand and make responsible decisions in the use of your resources.</span>
              </div>
            </div>
            <div className="flex items-start bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm print:shadow-none print:border-slate-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xl mr-4 flex-shrink-0">3</div>
              <div>
                <strong className="text-slate-800 text-lg block mb-1">Career & Life Choices</strong>
                <span className="text-sm">Develop processes for managing personal and lifelong career growth.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderInventory = () => (
    <Card>
      <SectionTitle subtitle="Consider who you are, what you value, and what works best for you.">
        What Works For Me
      </SectionTitle>
      
      <div className="mb-12 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
          <span className="bg-sky-100 text-sky-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 border-2 border-sky-200 shadow-sm print:shadow-none">1</span>
          Looking after myself
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 bg-sky-50 p-6 md:p-8 rounded-[2rem] border-2 border-sky-100 print:bg-white print:border-slate-300">
          <div><Label>How much sleep do I need?</Label><Input value={formData.invSleep} onChange={(e) => updateForm('invSleep', e.target.value)} /></div>
          <div><Label>Best snacks for energy?</Label><Input value={formData.invSnacks} onChange={(e) => updateForm('invSnacks', e.target.value)} /></div>
          <div><Label>Times of day I need to eat?</Label><Input value={formData.invEatTimes} onChange={(e) => updateForm('invEatTimes', e.target.value)} /></div>
          <div><Label>Time I have the MOST energy?</Label><Input value={formData.invEnergyHigh} onChange={(e) => updateForm('invEnergyHigh', e.target.value)} /></div>
          <div><Label>Time I have the LEAST energy?</Label><Input value={formData.invEnergyLow} onChange={(e) => updateForm('invEnergyLow', e.target.value)} /></div>
          <div><Label>Exercise that energizes me?</Label><Input value={formData.invExerciseEnergize} onChange={(e) => updateForm('invExerciseEnergize', e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Activities that help me relax?</Label><Input value={formData.invRelax} onChange={(e) => updateForm('invRelax', e.target.value)} /></div>
        </div>
      </div>

      <div className="mb-12 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
          <span className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 border-2 border-amber-200 shadow-sm print:shadow-none">2</span>
          Tools that help me learn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 bg-amber-50 p-6 md:p-8 rounded-[2rem] border-2 border-amber-100 print:bg-white print:border-slate-300">
          <div><Label>Pencils or pens?</Label><Input value={formData.invPencilsPens} onChange={(e) => updateForm('invPencilsPens', e.target.value)} /></div>
          <div><Label>How do I stay organized?</Label><Input value={formData.invOrganized} onChange={(e) => updateForm('invOrganized', e.target.value)} /></div>
          <div><Label>Write or type assignments?</Label><Input value={formData.invWriteType} onChange={(e) => updateForm('invWriteType', e.target.value)} /></div>
          <div><Label>Are electronics distracting?</Label><Input value={formData.invElectronics} onChange={(e) => updateForm('invElectronics', e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Does music help me study?</Label><Input value={formData.invMusic} onChange={(e) => updateForm('invMusic', e.target.value)} /></div>
        </div>
      </div>

      <div className="mb-12 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
          <span className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 border-2 border-emerald-200 shadow-sm print:shadow-none">3</span>
          In the classroom
        </h3>
        <div className="space-y-2 bg-emerald-50 p-6 md:p-8 rounded-[2rem] border-2 border-emerald-100 print:bg-white print:border-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div><Label>Where do I prefer to sit?</Label><Input value={formData.invSit} onChange={(e) => updateForm('invSit', e.target.value)} /></div>
            <div><Label>Best reading format?</Label><Input value={formData.invReadFrom} onChange={(e) => updateForm('invReadFrom', e.target.value)} /></div>
            <div><Label>Does paper color matter?</Label><Input value={formData.invColor} onChange={(e) => updateForm('invColor', e.target.value)} /></div>
            <div><Label>Does print type matter?</Label><Input value={formData.invPrintType} onChange={(e) => updateForm('invPrintType', e.target.value)} /></div>
          </div>
          <div><Label>Do I prefer to make my own goals, or have a teacher make them? Explain.</Label><Textarea value={formData.invGoals} onChange={(e) => updateForm('invGoals', e.target.value)} /></div>
        </div>
      </div>

      <div className="mb-8 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-slate-800 mb-2 flex items-center">
          <span className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 border-2 border-purple-200 shadow-sm print:shadow-none">4</span>
          Directions that work for me
        </h3>
        <p className="text-sm font-bold text-purple-600 mb-6 ml-14 bg-purple-100 inline-block px-3 py-1 rounded-lg print:bg-transparent print:border-2 print:border-slate-300 print:text-slate-600">1 = Least Effective, 5 = Most Effective</p>
        
        <div className="space-y-4 bg-purple-50 p-6 md:p-8 rounded-[2rem] border-2 border-purple-100 print:bg-white print:border-slate-300">
          {[
            "Teacher explains out loud", "Teacher writes directions on paper",
            "Teacher does an example for me", "Teacher asks another student to explain",
            "Teacher reads the instructions to me", "I read the directions on my own",
            "I try it and then check with teacher", "I try it and compare with another student"
          ].map((dir) => (
            <div key={dir} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl border-2 border-purple-100 shadow-sm print:shadow-none print:border-slate-200 print:break-inside-avoid">
              <span className="text-slate-800 font-bold text-base md:w-1/2 mb-4 md:mb-0">{dir}</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <label key={num} className="cursor-pointer relative group">
                    <input 
                      type="radio" 
                      name={`dir_${dir}`} 
                      className="sr-only peer"
                      checked={formData.invDirections[dir] === num}
                      onChange={() => setFormData(prev => ({
                        ...prev, invDirections: { ...prev.invDirections, [dir]: num }
                      }))}
                    />
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 flex items-center justify-center text-base font-black transition-all ${formData.invDirections[dir] === num ? 'bg-purple-500 text-white border-purple-600 shadow-[0_4px_0_0_#7e22ce] -translate-y-1 print:bg-purple-100 print:text-purple-900 print:shadow-none print:translate-y-0' : 'border-slate-200 text-slate-400 bg-white print:border-slate-300'}`}>
                      {num}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-6 print:break-inside-avoid">
          <div><Label>Tricks I use to keep myself focused:</Label><Textarea value={formData.invFocusTricks} onChange={(e) => updateForm('invFocusTricks', e.target.value)} /></div>
          <div><Label>Special things teachers can do to help me:</Label><Textarea value={formData.invTeacherHelp} onChange={(e) => updateForm('invTeacherHelp', e.target.value)} /></div>
        </div>
      </div>
    </Card>
  );

  const renderGoals = () => (
    <Card>
      <SectionTitle subtitle="Set clear targets (e.g., getting a car, graduating, starting a career).">
        Goal Setting Builder
      </SectionTitle>

      <KnowledgeDrop title="The SMART Method" color="emerald">
        <p className="mb-3">A goal without a plan is just a wish! To make sure you actually hit your targets, use the <strong>SMART</strong> method. Your goals should be:</p>
        <ul className="space-y-2 list-disc pl-5">
          <li><strong>Specific:</strong> What exactly are you trying to do? (Don't just say "get better at guitar", say "learn to play Wonderwall on guitar").</li>
          <li><strong>Measurable:</strong> How will you know when you've succeeded?</li>
          <li><strong>Attainable:</strong> Is it within your power to do this, or does it rely on luck/other people?</li>
          <li><strong>Realistic:</strong> Do you have the resources, skill, and time to pull this off right now?</li>
          <li><strong>Timed:</strong> When is the exact deadline?</li>
        </ul>
      </KnowledgeDrop>
      
      <div className="space-y-10">
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300 print:break-inside-avoid">
          <Label description="e.g.: Learn to speak Spanish">1. Here's what I want to achieve:</Label>
          <Input value={formData.goalAchieve} onChange={(e) => updateForm('goalAchieve', e.target.value)} />
        </div>

        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300 print:break-inside-avoid">
          <Label description="What will I see/hear/feel when it's done? e.g.: All 10 modules completed.">
            2. My main MEASURE for this achievement:
          </Label>
          <Textarea value={formData.goalMeasure} onChange={(e) => updateForm('goalMeasure', e.target.value)} />
        </div>

        <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-200 relative print:bg-white print:border-slate-300 print:break-inside-avoid">
          <div className="absolute -top-5 right-10 bg-emerald-500 text-white font-black px-6 py-2 rounded-full border-4 border-white shadow-sm transform rotate-3 print:hidden">Mad Libs Style!</div>
          <Label description="Combine your answers into one epic sentence.">
            3. Specific Goal Statement:
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 print:border-slate-300">
              <label className="text-sm font-black text-emerald-600 uppercase mb-2 block print:text-slate-600">Who?</label>
              <Input placeholder="I am..." value={formData.goalWho} onChange={(e) => updateForm('goalWho', e.target.value)} />
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 print:border-slate-300">
              <label className="text-sm font-black text-emerald-600 uppercase mb-2 block print:text-slate-600">How?</label>
              <Input placeholder="proudly finishing..." value={formData.goalHow} onChange={(e) => updateForm('goalHow', e.target.value)} />
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 print:border-slate-300">
              <label className="text-sm font-black text-emerald-600 uppercase mb-2 block print:text-slate-600">What?</label>
              <Input placeholder="module ten..." value={formData.goalWhat} onChange={(e) => updateForm('goalWhat', e.target.value)} />
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 print:border-slate-300">
              <label className="text-sm font-black text-emerald-600 uppercase mb-2 block print:text-slate-600">When?</label>
              <Input placeholder="by December 31st." value={formData.goalWhen} onChange={(e) => updateForm('goalWhen', e.target.value)} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border-4 border-emerald-400 border-dashed mt-8 text-center transform rotate-1 shadow-sm transition-all duration-300 print:transform-none print:border-slate-300">
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3 print:text-slate-600">Your Dynamic Goal Statement:</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-800 leading-tight">
              "{formData.goalWho || '[Who]'} {formData.goalHow || '[How]'} {formData.goalWhat || '[What]'} {formData.goalWhen || '[When]'}"
            </p>
          </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-200 print:bg-white print:border-slate-300 print:break-inside-avoid">
          <Label>4. The Reality Check:</Label>
          <div className="space-y-4 mt-4">
            <div className="p-5 border-2 border-white bg-amber-100/50 rounded-2xl print:bg-white print:border-slate-200">
              <label className="flex items-start mb-3 cursor-pointer">
                <input type="checkbox" className="mt-1 mr-3 h-6 w-6 rounded-lg border-2 border-amber-300 text-amber-500 focus:ring-amber-500 transition-colors print:border-slate-400" />
                <span className="text-base font-bold text-slate-800">Is it ATTAINABLE (in your control)? Explain.</span>
              </label>
              <Textarea value={formData.goalAttainable} onChange={(e) => updateForm('goalAttainable', e.target.value)} rows={2} />
            </div>
            <div className="p-5 border-2 border-white bg-amber-100/50 rounded-2xl print:bg-white print:border-slate-200">
              <label className="flex items-start mb-3 cursor-pointer">
                <input type="checkbox" className="mt-1 mr-3 h-6 w-6 rounded-lg border-2 border-amber-300 text-amber-500 focus:ring-amber-500 transition-colors print:border-slate-400" />
                <span className="text-base font-bold text-slate-800">Is it REALISTIC? Explain.</span>
              </label>
              <Textarea value={formData.goalRealistic} onChange={(e) => updateForm('goalRealistic', e.target.value)} rows={2} />
            </div>
            <div className="p-5 border-2 border-white bg-amber-100/50 rounded-2xl print:bg-white print:border-slate-200">
              <label className="flex items-start mb-3 cursor-pointer">
                <input type="checkbox" className="mt-1 mr-3 h-6 w-6 rounded-lg border-2 border-amber-300 text-amber-500 focus:ring-amber-500 transition-colors print:border-slate-400" />
                <span className="text-base font-bold text-slate-800">Is it TIMED (has a deadline)? Explain.</span>
              </label>
              <Textarea value={formData.goalTimed} onChange={(e) => updateForm('goalTimed', e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
          <div>
            <Label>Why is goal setting important?</Label>
            <HintToggle example="It gives me a clear roadmap so I don't get distracted. It helps me measure my progress so I know if I'm actually moving forward." />
            <Textarea value={formData.goalImportance} onChange={(e) => updateForm('goalImportance', e.target.value)} />
          </div>
          <div>
            <Label>What other goals could you set?</Label>
            <HintToggle example="Saving $500 for a car, getting an 80% in Math, or learning how to cook 3 healthy meals by summer." />
            <Textarea value={formData.goalOther} onChange={(e) => updateForm('goalOther', e.target.value)} />
          </div>
        </div>
      </div>
    </Card>
  );

  const renderRomantic = () => (
    <Card>
      <SectionTitle subtitle="Mapping how relationships grow and develop.">
        Romantic Relationships
      </SectionTitle>
      
      <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 mb-10 shadow-sm relative overflow-hidden print:bg-white print:border-slate-300 print:break-inside-avoid">
        <Heart className="absolute -right-10 -bottom-10 w-64 h-64 text-rose-100 opacity-50 print:hidden" />
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-rose-900 mb-3">Relationship Timeline</h3>
          <p className="text-base font-medium text-rose-700 mb-8 max-w-2xl print:text-slate-600">Rank the 16 steps below from 1 (First) to 16 (Last) to show how you think a relationship usually progresses.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relationshipSteps.map((step, idx) => (
              <div key={idx} className="flex items-center space-x-4 bg-white p-3 rounded-2xl border-2 border-rose-100 focus-within:border-rose-400 focus-within:shadow-[0_4px_0_0_#fda4af] transition-all group print:border-slate-200 print:shadow-none">
                <input 
                  type="number" 
                  min="1" max="16"
                  className="w-16 h-12 text-center bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-900 font-black text-lg focus:outline-none focus:bg-white focus:border-rose-400 transition-colors print:bg-white print:border-slate-300 print:text-slate-800"
                  value={formData.romRankings[step] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, romRankings: { ...prev.romRankings, [step]: e.target.value }
                  }))}
                />
                <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 print:break-inside-avoid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>What was easiest to rank? Explain.</Label>
            <Textarea value={formData.romEasiest} onChange={(e) => updateForm('romEasiest', e.target.value)} />
          </div>
          <div>
            <Label>What was most difficult? Explain.</Label>
            <Textarea value={formData.romHardest} onChange={(e) => updateForm('romHardest', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Where do your ideas about a 'normal' relationship come from?</Label>
          <HintToggle example="Mostly from movies, TV shows, and seeing how my parents or older siblings act in their relationships." />
          <Textarea value={formData.romNormal} onChange={(e) => updateForm('romNormal', e.target.value)} />
        </div>
        <div>
          <Label>What happens if a relationship skips steps or progresses unhealthily?</Label>
          <HintToggle example="Someone might get emotionally hurt, trust could be broken, or the relationship might crash and burn because it moved too fast." />
          <Textarea value={formData.romUnhealthyProg} onChange={(e) => updateForm('romUnhealthyProg', e.target.value)} />
        </div>
      </div>
    </Card>
  );

  const renderEvaluating = () => (
    <Card>
      <SectionTitle subtitle="Identify which relationships are supportive and which are toxic.">
        Evaluating Relationships
      </SectionTitle>

      <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-orange-200 mb-10 print:bg-white print:border-slate-300 print:break-inside-avoid">
        <Label description="List 5 people you have a relationship with (family, school, work, online).">Your Network Map</Label>
        <div className="space-y-4 mt-6">
          {[0, 1, 2, 3, 4].map(idx => (
            <div key={idx} className="flex items-center bg-white p-2 rounded-2xl border-2 border-orange-100 print:border-slate-200">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 font-black rounded-xl flex items-center justify-center mr-3 print:bg-slate-100 print:text-slate-600 print:border-2 print:border-slate-300">{idx + 1}</div>
              <input 
                className="flex-1 bg-transparent border-none font-bold text-slate-700 focus:outline-none focus:ring-0 px-2"
                placeholder={`Name & Type (e.g., Mom - Family)`}
                value={formData.evalRels[idx]}
                onChange={(e) => updateArrayField('evalRels', idx, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-3xl font-black text-slate-800 mb-8 text-center print:break-before-page print:mt-10">The Vibe Check</h3>

      <KnowledgeDrop title="Green Flags vs. Red Flags" color="amber" defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <strong className="text-emerald-700 block mb-2">✅ Green Flags (Healthy)</strong>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>They respect your boundaries and the word "No".</li>
              <li>You feel energized and happy after hanging out with them.</li>
              <li>They celebrate your wins and encourage your goals.</li>
              <li>You can communicate openly without fear of them exploding.</li>
            </ul>
          </div>
          <div>
            <strong className="text-rose-700 block mb-2">🚩 Red Flags (Unhealthy)</strong>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>They try to isolate you from your other friends or family.</li>
              <li>They constantly make you feel guilty or "crazy" (gaslighting).</li>
              <li>They pressure you into doing things you aren't comfortable with.</li>
              <li>The relationship feels like a rollercoaster (extreme highs and terrible lows).</li>
            </ul>
          </div>
        </div>
      </KnowledgeDrop>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 print:break-inside-avoid">
        <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-200 shadow-[0_8px_0_0_#a7f3d0] print:bg-white print:border-slate-300 print:shadow-none">
          <h4 className="font-black text-emerald-800 text-2xl mb-6 flex items-center print:text-slate-800">
            <span className="bg-emerald-200 p-2 rounded-xl mr-3 print:bg-transparent print:p-0"><CheckSquare className="w-6 h-6 text-emerald-700 print:text-slate-800" /></span>
            Green Flags
          </h4>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map(idx => (
              <Input 
                key={idx}
                placeholder={`Healthy trait ${idx + 1}`}
                value={formData.evalHealthyList[idx]}
                onChange={(e) => updateArrayField('evalHealthyList', idx, e.target.value)}
              />
            ))}
          </div>
        </div>
        <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 shadow-[0_8px_0_0_#fecdd3] print:bg-white print:border-slate-300 print:shadow-none">
          <h4 className="font-black text-rose-800 text-2xl mb-6 flex items-center print:text-slate-800">
            <span className="bg-rose-200 p-2 rounded-xl mr-3 print:bg-transparent print:p-0"><AlertTriangle className="w-6 h-6 text-rose-700 print:text-slate-800" /></span>
            Red Flags
          </h4>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map(idx => (
              <Input 
                key={idx}
                placeholder={`Toxic trait ${idx + 1}`}
                value={formData.evalUnhealthyList[idx]}
                onChange={(e) => updateArrayField('evalUnhealthyList', idx, e.target.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 print:break-inside-avoid">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Think about your relationship with {formData.evalRels[0] ? <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded-md print:bg-transparent print:border print:border-slate-300">{formData.evalRels[0]}</span> : "someone close to you"}. How do you feel in a healthy relationship?</Label>
            <Textarea value={formData.evalFeelHealthy} onChange={(e) => updateForm('evalFeelHealthy', e.target.value)} />
          </div>
          <div>
            <Label>Think about your relationship with {formData.evalRels[1] ? <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded-md print:bg-transparent print:border print:border-slate-300">{formData.evalRels[1]}</span> : "another person"}. How do you feel in an unhealthy relationship?</Label>
            <Textarea value={formData.evalFeelUnhealthy} onChange={(e) => updateForm('evalFeelUnhealthy', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Why do people stay in unhealthy relationships?</Label>
          <HintToggle example="They might be afraid of being alone, they might hope the person will change, or they might not even realize it's toxic because they are used to it." />
          <Textarea value={formData.evalWhyStay} onChange={(e) => updateForm('evalWhyStay', e.target.value)} />
        </div>
      </div>
    </Card>
  );

  const renderAlcohol = () => (
    <Card>
      <SectionTitle subtitle="Navigating the choices and consequences surrounding drinking.">
        Alcohol Awareness
      </SectionTitle>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 print:break-inside-avoid">
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>Why do you think people drink?</Label>
          <HintToggle example="To fit in, to relax after a stressful day, or because it's socially expected at events like weddings." />
          <Textarea value={formData.alcWhyDrink} onChange={(e) => updateForm('alcWhyDrink', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>What do you personally think about alcohol?</Label>
          <Textarea value={formData.alcThoughts} onChange={(e) => updateForm('alcThoughts', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>Why is it tied to holidays/celebrations?</Label>
          <Textarea value={formData.alcCelebrate} onChange={(e) => updateForm('alcCelebrate', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>What would you say if offered a drink?</Label>
          <HintToggle example="I might say 'No thanks, I'm driving today' or 'I'm good with soda right now'." />
          <Textarea value={formData.alcOffered} onChange={(e) => updateForm('alcOffered', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 md:col-span-2 print:bg-white print:border-slate-300">
          <Label>How much should you drink? Explain.</Label>
          <Textarea value={formData.alcHowMuch} onChange={(e) => updateForm('alcHowMuch', e.target.value)} />
        </div>
      </div>

      <div className="bg-fuchsia-50 p-4 md:p-8 rounded-[2rem] border-2 border-fuchsia-200 mb-8 print:bg-white print:border-slate-300 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-fuchsia-900 mb-6 print:text-slate-800">Action & Consequence</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-fuchsia-800 print:text-slate-700">
                <th className="px-4 pb-2 font-black uppercase tracking-wider text-sm w-1/4">The Choice</th>
                <th className="px-4 pb-2 font-black uppercase tracking-wider text-sm text-emerald-600 print:text-slate-700 w-3/8">The Good (Pros)</th>
                <th className="px-4 pb-2 font-black uppercase tracking-wider text-sm text-rose-600 print:text-slate-700 w-3/8">The Bad (Cons)</th>
              </tr>
            </thead>
            <tbody>
              {['Not to Drink', 'Drink Moderately', 'Drink Too Much'].map((choice, idx) => (
                <tr key={choice} className="bg-white">
                  <td className="p-4 border-2 border-r-0 border-fuchsia-100 rounded-l-2xl font-black text-slate-800 text-lg print:border-slate-300">{choice}</td>
                  <td className="p-4 border-y-2 border-fuchsia-100 print:border-slate-300">
                    <Textarea 
                      rows={2} placeholder="e.g. Healthier body..."
                      value={formData.alcProsCons[idx].pro}
                      onChange={(e) => {
                        const newArr = [...formData.alcProsCons];
                        newArr[idx].pro = e.target.value;
                        updateForm('alcProsCons', newArr);
                      }}
                    />
                  </td>
                  <td className="p-4 border-2 border-l-0 border-fuchsia-100 rounded-r-2xl print:border-slate-300">
                    <Textarea 
                      rows={2} placeholder="e.g. Missing out socially..."
                      value={formData.alcProsCons[idx].con}
                      onChange={(e) => {
                        const newArr = [...formData.alcProsCons];
                        newArr[idx].con = e.target.value;
                        updateForm('alcProsCons', newArr);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="print:break-inside-avoid">
        <Label>Who could you speak to if you wanted to learn more about alcohol? List 2 resources.</Label>
        <Textarea value={formData.alcResources} onChange={(e) => updateForm('alcResources', e.target.value)} />
      </div>
    </Card>
  );

  const renderTobacco = () => (
    <Card>
      <SectionTitle subtitle="Understanding the effects and choices surrounding vaping, cannabis, and tobacco use.">
        Vaping & Tobacco Awareness
      </SectionTitle>
      
      <div className="bg-red-50 border-4 border-red-500 p-6 md:p-8 rounded-[2rem] mb-10 shadow-[0_8px_0_0_#ef4444] transform rotate-1 print:transform-none print:shadow-none print:border-2 print:border-slate-400 print:bg-white">
        <h3 className="text-2xl md:text-3xl font-black text-red-700 uppercase tracking-widest flex items-center justify-center print:text-slate-800">
          <AlertTriangle className="mr-4 w-10 h-10 text-red-600 print:text-slate-800" />
          Warning: Highly Addictive
        </h3>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
          <div><Label>What do you know about traditional cigarettes?</Label><Textarea value={formData.tobKnow} onChange={(e) => updateForm('tobKnow', e.target.value)} /></div>
          <div><Label>What do you know about Vapes / E-cigarettes?</Label><Textarea value={formData.vapeKnow} onChange={(e) => updateForm('vapeKnow', e.target.value)} /></div>
        </div>

        <div className="my-10 p-8 bg-slate-800 text-slate-100 rounded-[2rem] border-4 border-slate-900 shadow-[0_8px_0_0_#0f172a] text-lg font-medium leading-relaxed print:bg-white print:text-slate-800 print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <p className="mb-4">Tobacco and most vape juices contain <strong>nicotine</strong>, a highly addictive chemical that rewires how your developing brain handles stress and reward. People develop a tolerance quickly, needing more just to feel "normal".</p>
          <p className="mb-6">Vaping carries serious risks for lung health and delivers massive nicotine concentrations. Quitting is tough but highly possible with support!</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <div className="bg-emerald-400 text-slate-900 px-6 py-4 rounded-xl font-black text-lg text-center shadow-[0_4px_0_0_#047857] -rotate-1 print:transform-none print:bg-transparent print:border-2 print:border-slate-300 print:shadow-none">
              AlbertaQuits: 1-866-710-QUIT
            </div>
            <div className="bg-sky-400 text-slate-900 px-6 py-4 rounded-xl font-black text-lg text-center shadow-[0_4px_0_0_#0369a1] rotate-1 print:transform-none print:bg-transparent print:border-2 print:border-slate-300 print:shadow-none">
              KidsHelpPhone: Text CONNECT to 686868
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
          <div><Label>Why do you think teens start vaping?</Label><Textarea value={formData.vapeWhy} onChange={(e) => updateForm('vapeWhy', e.target.value)} /></div>
          <div><Label>Cannabis is legal in Canada. What are your thoughts on its use among teenagers?</Label><Textarea value={formData.weedThoughts} onChange={(e) => updateForm('weedThoughts', e.target.value)} /></div>
        </div>
        <div className="bg-sky-50 p-6 rounded-[2rem] border-2 border-sky-200 print:bg-white print:border-slate-300 print:break-inside-avoid">
          <Label>If a friend wanted to start vaping or smoking, how would you convince them not to?</Label>
          <Textarea value={formData.tobConvince} onChange={(e) => updateForm('tobConvince', e.target.value)} />
        </div>
      </div>
    </Card>
  );

  const renderRisk = () => (
    <Card>
      <SectionTitle subtitle="Learning the difference between calculated risks and careless ones.">
        Risk Taking
      </SectionTitle>
      
      <div className="mb-12">
        <h3 className="text-3xl font-black text-slate-800 mb-8">The Risk Meter</h3>

        <div className="space-y-6">
          {riskQuestions.map((q, idx) => (
            <div key={idx} className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border-2 border-slate-200 hover:border-violet-300 transition-colors print:bg-white print:border-slate-300 print:break-inside-avoid">
              <p className="font-bold text-slate-800 mb-4 text-lg">{q}</p>
              <PillRadioGroup 
                options={["No risk", "Minimal", "Some risk", "Significant", "High risk"]}
                name={`risk_${idx}`}
                value={formData.riskRatings[idx]}
                onChange={(val) => setFormData(prev => ({
                  ...prev, riskRatings: { ...prev.riskRatings, [idx]: val }
                }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-200 mb-12 print:bg-white print:border-slate-300 print:break-inside-avoid">
        <Label>How did you determine how "risky" a situation was? Explain your logic.</Label>
        <HintToggle example="I asked myself: Could this physically hurt me? Could it ruin my reputation or get me arrested? Do the benefits outweigh the potential bad consequences?" />
        <Textarea value={formData.riskDetermine} onChange={(e) => updateForm('riskDetermine', e.target.value)} />
      </div>

      <h3 className="text-3xl font-black text-slate-800 mb-8 text-center print:break-before-page print:mt-10">Healthy vs Unhealthy Risks</h3>

      <KnowledgeDrop title="Not all risks are bad!" color="sky">
        <p className="mb-3">When we hear the word "risk", we usually think of danger. But growing up requires taking risks! The trick is knowing the difference:</p>
        <ul className="space-y-3">
          <li>📈 <strong>Healthy Risks:</strong> Pushing yourself outside your comfort zone to grow. The "worst-case scenario" might be feeling embarrassed or failing, but you won't get hurt. <em>(e.g., trying out for a play, applying for a hard job, standing up for a friend).</em></li>
          <li>☠️ <strong>Unhealthy Risks:</strong> Actions that are needlessly dangerous, illegal, or could cause long-term physical/mental harm to you or others. <em>(e.g., driving drunk, trying addictive drugs, sharing inappropriate photos online).</em></li>
        </ul>
      </KnowledgeDrop>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 print:break-inside-avoid">
        <div className="bg-lime-50 p-8 rounded-[2rem] border-2 border-lime-200 shadow-[0_8px_0_0_#d9f99d] print:bg-white print:border-slate-300 print:shadow-none">
          <h4 className="font-black text-lime-800 text-2xl mb-2 print:text-slate-800">Healthy Risks</h4>
          <p className="text-sm font-bold text-lime-600 mb-6 uppercase tracking-wider print:text-slate-500">Growth-oriented activities</p>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map(idx => (
              <Input key={idx} placeholder={`Good Risk ${idx + 1}`} value={formData.riskHealthy[idx]} onChange={(e) => updateArrayField('riskHealthy', idx, e.target.value)} />
            ))}
          </div>
        </div>
        <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 shadow-[0_8px_0_0_#fecdd3] print:bg-white print:border-slate-300 print:shadow-none">
          <h4 className="font-black text-rose-800 text-2xl mb-2 print:text-slate-800">Unhealthy Risks</h4>
          <p className="text-sm font-bold text-rose-600 mb-6 uppercase tracking-wider print:text-slate-500">Needlessly dangerous</p>
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map(idx => (
              <Input key={idx} placeholder={`Bad Risk ${idx + 1}`} value={formData.riskUnhealthy[idx]} onChange={(e) => updateArrayField('riskUnhealthy', idx, e.target.value)} />
            ))}
          </div>
        </div>
      </div>

      <div className="print:break-inside-avoid">
        <Label>Why do you think someone would WANT to take an unhealthy risk?</Label>
        <Textarea value={formData.riskWhyUnhealthy} onChange={(e) => updateForm('riskWhyUnhealthy', e.target.value)} />
      </div>
    </Card>
  );

  const renderAddictions = () => (
    <Card>
      <SectionTitle subtitle="Understanding the spectrum of addiction.">
        Addictions
      </SectionTitle>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 print:break-inside-avoid">
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300"><Label>Define the term "addiction" using a dictionary:</Label><Textarea value={formData.addDefine} onChange={(e) => updateForm('addDefine', e.target.value)} /></div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300"><Label>List 3 different things people can be addicted to:</Label><Textarea value={formData.addTypes} onChange={(e) => updateForm('addTypes', e.target.value)} /></div>
      </div>

      <div className="bg-indigo-600 p-8 md:p-10 rounded-[3rem] shadow-[0_12px_0_0_#3730a3] mb-12 text-white print:bg-white print:text-slate-800 print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
        <h3 className="text-3xl font-black text-white mb-8 text-center print:text-slate-800">The Addiction Continuum</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white/10 border-2 border-white/20 backdrop-blur-sm print:bg-transparent print:border-slate-300">
            <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center font-black text-xl text-emerald-900 mb-4 print:bg-slate-200 print:text-slate-800">1</div>
            <strong className="text-xl block mb-2">No Use</strong>
            <p className="text-sm font-medium opacity-90 print:opacity-100">No use due to age, religion, or health risks.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 border-2 border-white/20 backdrop-blur-sm print:bg-transparent print:border-slate-300">
            <div className="w-12 h-12 bg-sky-400 rounded-2xl flex items-center justify-center font-black text-xl text-sky-900 mb-4 print:bg-slate-200 print:text-slate-800">2</div>
            <strong className="text-xl block mb-2">Use</strong>
            <p className="text-sm font-medium opacity-90 print:opacity-100">Experimentation or "social use" to enhance good experiences.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 border-2 border-white/20 backdrop-blur-sm print:bg-transparent print:border-slate-300">
            <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center font-black text-xl text-amber-900 mb-4 print:bg-slate-200 print:text-slate-800">3</div>
            <strong className="text-xl block mb-2">Misuse</strong>
            <p className="text-sm font-medium opacity-90 print:opacity-100">Experiencing negative consequences (trouble, regret) but ignoring them.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/10 border-2 border-white/20 backdrop-blur-sm print:bg-transparent print:border-slate-300">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center font-black text-xl text-white mb-4 print:bg-slate-200 print:text-slate-800">4</div>
            <strong className="text-xl block mb-2">Dependency</strong>
            <p className="text-sm font-medium opacity-90 print:opacity-100">Interferes with major life areas. No longer a choice.</p>
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-black text-slate-800 mb-8 print:break-before-page print:mt-10">Scenario Analysis</h3>

      <div className="space-y-8">
        <div className="bg-sky-50 rounded-[2rem] border-2 border-sky-200 overflow-hidden print:bg-white print:border-slate-300 print:break-inside-avoid">
          <div className="p-6 bg-sky-100/50 border-b-2 border-sky-200 print:bg-slate-50 print:border-slate-300">
            <p className="font-bold text-sky-900 text-lg print:text-slate-800"><strong>Scenario 1:</strong> Rachel can't wait to finish school so she can get home and start drinking. Every day after school, Rachel has at least 5 beers to mellow her out. Her friends and family have expressed concern. She has a hard time sleeping without it.</p>
          </div>
          <div className="p-6">
            <Textarea value={formData.addScen1} onChange={(e) => updateForm('addScen1', e.target.value)} placeholder="Identify the stage and justify..." />
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-[2rem] border-2 border-amber-200 overflow-hidden print:bg-white print:border-slate-300 print:break-inside-avoid">
          <div className="p-6 bg-amber-100/50 border-b-2 border-amber-200 print:bg-slate-50 print:border-slate-300">
            <p className="font-bold text-amber-900 text-lg print:text-slate-800"><strong>Scenario 2:</strong> Antoine has never touched a cigarette. After losing his father to lung cancer, Antoine has decided that he will never try one.</p>
          </div>
          <div className="p-6">
            <Textarea value={formData.addScen2} onChange={(e) => updateForm('addScen2', e.target.value)} placeholder="Identify the stage and justify..." />
          </div>
        </div>

        <div className="bg-rose-50 rounded-[2rem] border-2 border-rose-200 overflow-hidden print:bg-white print:border-slate-300 print:break-inside-avoid">
          <div className="p-6 bg-rose-100/50 border-b-2 border-rose-200 print:bg-slate-50 print:border-slate-300">
            <p className="font-bold text-rose-900 text-lg print:text-slate-800"><strong>Scenario 3:</strong> Bailey has a craving. She wants one, but doesn't have one. She notices a half full pack on the table beside her, and decides to steal one when no one is looking.</p>
          </div>
          <div className="p-6">
            <Textarea value={formData.addScen3} onChange={(e) => updateForm('addScen3', e.target.value)} placeholder="Identify the stage and justify..." />
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-slate-900 text-white rounded-[3rem] text-center shadow-[0_8px_0_0_#0f172a] print:bg-white print:border-2 print:border-slate-300 print:text-slate-800 print:shadow-none print:break-inside-avoid">
        <Activity className="w-12 h-12 mx-auto mb-4 text-emerald-400 print:text-slate-800" />
        <p className="font-bold text-slate-300 mb-2 text-lg print:text-slate-800">For more information, or to find support for addictions, contact Alberta Health Services (AHS):</p>
        <p className="text-sm font-black text-slate-900 bg-emerald-400 inline-block px-6 py-3 rounded-xl mt-4 border-2 border-emerald-500 print:bg-transparent print:border-slate-300">Addiction Help Line: 1-866-332-2322</p>
      </div>
    </Card>
  );

  const renderMentalHealth = () => (
    <Card>
      <SectionTitle subtitle="Recognizing signs of depression and seeking support.">
        Mental Health
      </SectionTitle>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 print:break-inside-avoid">
        <div className="bg-cyan-50 p-8 rounded-[2rem] border-2 border-cyan-200 print:bg-white print:border-slate-300">
          <h3 className="text-2xl font-black text-cyan-900 mb-4 print:text-slate-800">You are not alone</h3>
          <p className="text-base font-medium text-cyan-800 leading-relaxed print:text-slate-600">When you're depressed, it can feel like no one understands. But depression is far more common in teens than you may think. It is not a hopeless case. With proper treatment and healthy choices, that fog eventually lifts.</p>
        </div>
        <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 shadow-[0_8px_0_0_#fecdd3] print:bg-white print:border-slate-300 print:shadow-none">
          <h3 className="text-2xl font-black text-rose-900 mb-4 print:text-slate-800">Warning Signs</h3>
          <ul className="text-base font-bold text-rose-800 space-y-3 print:text-slate-600">
            <li>🚨 Irritable, sad, or angry</li>
            <li>🚨 Nothing seems fun anymore</li>
            <li>🚨 Feeling worthless or guilty</li>
            <li>🚨 Sleeping too much or not enough</li>
            <li className="text-red-600 bg-red-100 p-3 rounded-xl mt-4 border-2 border-red-200 print:bg-transparent print:border-slate-300">🔥 Thinking about death or suicide. (Seek help immediately!)</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 print:break-inside-avoid">
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>Why is it hard to talk about?</Label>
          <HintToggle example="People often feel embarrassed, worry that others will judge them, or fear being seen as 'weak'." />
          <Textarea value={formData.mhHardTalk} onChange={(e) => updateForm('mhHardTalk', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>Emotions tied to depression?</Label>
          <Textarea value={formData.mhEmotions} onChange={(e) => updateForm('mhEmotions', e.target.value)} />
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300">
          <Label>How to spot it in a friend?</Label>
          <Textarea value={formData.mhKnowWrong} onChange={(e) => updateForm('mhKnowWrong', e.target.value)} />
        </div>
      </div>

      <div className="bg-indigo-50 p-8 rounded-[3rem] border-2 border-indigo-200 mb-10 print:bg-white print:border-slate-300 print:break-inside-avoid">
        <h3 className="text-3xl font-black text-indigo-900 mb-8 text-center print:text-slate-800">How to fight back</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-base font-medium text-indigo-800 print:text-slate-700">
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm print:border-slate-300 print:shadow-none">
            <strong className="text-xl font-black block mb-2">1. One day at a time</strong>
            Start with small goals. Stay connected.
          </div>
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm print:border-slate-300 print:shadow-none">
            <strong className="text-xl font-black block mb-2">2. Don't isolate</strong>
            Spend time with upbeat friends. Avoid toxic people.
          </div>
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm print:border-slate-300 print:shadow-none">
            <strong className="text-xl font-black block mb-2">3. Body Health</strong>
            Exercise releases endorphins. Eat good food.
          </div>
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm print:border-slate-300 print:shadow-none">
            <strong className="text-xl font-black block mb-2">4. Ask for help</strong>
            Talk to a teacher or doctor. Avoid drugs/alcohol.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-inside-avoid">
        <div><Label>How to help a friend who is depressed?</Label><Textarea value={formData.mhHelpFriend} onChange={(e) => updateForm('mhHelpFriend', e.target.value)} /></div>
        <div><Label>What to do if YOU feel depressed?</Label><Textarea value={formData.mhHelpSelf} onChange={(e) => updateForm('mhHelpSelf', e.target.value)} /></div>
      </div>
    </Card>
  );

  const renderTaskA = () => (
    <Card>
      <SectionTitle subtitle="Draw your journey so far.">
        Summative Task A: Life Map
      </SectionTitle>
      
      <div className="bg-lime-400 p-8 md:p-10 rounded-[3rem] mb-10 shadow-[0_12px_0_0_#4d7c0f] transform -rotate-1 print:transform-none print:bg-white print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
        <h3 className="font-black text-3xl text-lime-900 mb-6 flex items-center print:text-slate-800">
          <Map className="w-10 h-10 mr-4 text-lime-800 print:text-slate-800" />
          The Mission
        </h3>
        <ol className="list-decimal pl-6 space-y-4 text-lime-900 font-bold text-lg print:text-slate-600">
          <li>Create a colourful map showing your life to date (Physical paper, slides, etc).</li>
          <li>Start with birth. Mark the ups and downs along your road.</li>
          <li>Identify the TRANSITIONS (How did you get through it? What did you learn?).</li>
          <li>Include 10 major events.</li>
          <li>Add: Dates, Places, Symbols, Pictures.</li>
        </ol>
      </div>

      <div className="mb-12 print:break-inside-avoid">
        <Label>Upload your map</Label>
        <p className="text-sm font-medium text-slate-500 mb-4">Take a photo of your drawing and upload it here!</p>
        
        {formData.mapImageData ? (
          <div className="relative bg-slate-50 border-4 border-slate-200 p-4 rounded-[2rem] inline-block max-w-full shadow-sm group">
            <img src={formData.mapImageData} alt="Student Life Map" className="rounded-2xl max-h-[500px] object-contain print:max-h-full" />
            {!printMode && (
              <button 
                onClick={() => updateForm('mapImageData', '')}
                className="absolute -top-4 -right-4 bg-rose-500 text-white p-3 rounded-xl border-2 border-rose-600 shadow-[0_4px_0_0_#9f1239] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#9f1239] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 bg-lime-50 border-4 border-dashed border-lime-300 rounded-[2rem] cursor-pointer hover:bg-lime-100 hover:border-lime-400 transition-all group shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)] print:bg-white print:border-slate-300 print:shadow-none">
            <div className="w-20 h-20 bg-lime-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 print:hidden">
              <Upload className="w-10 h-10 text-lime-700" />
            </div>
            <p className="font-black text-xl text-lime-800 mb-2 print:text-slate-500">[ Map Image Will Appear Here ]</p>
            <p className="text-lime-600 font-medium print:hidden">JPEG, PNG, or take a photo</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-200 print:bg-white print:border-slate-300 print:break-inside-avoid">
        <h3 className="text-2xl font-black text-slate-800 mb-6">Reflection</h3>
        <div className="space-y-6">
          <div><Label>1. Proudest accomplishment? Why?</Label><Textarea value={formData.mapAccomplish} onChange={(e) => updateForm('mapAccomplish', e.target.value)} /></div>
          <div><Label>2. Hardest obstacle? Why?</Label><Textarea value={formData.mapObstacle} onChange={(e) => updateForm('mapObstacle', e.target.value)} /></div>
          <div>
            <Label>3. Strategies used to manage changes?</Label>
            <HintToggle example="I talked to my parents, I took a break from social media, and I started writing my thoughts down." />
            <Textarea value={formData.mapStrategies} onChange={(e) => updateForm('mapStrategies', e.target.value)} />
          </div>
          <div><Label>4. Skills gained from obstacles?</Label><Textarea value={formData.mapSkills} onChange={(e) => updateForm('mapSkills', e.target.value)} /></div>
        </div>
      </div>
    </Card>
  );

  const renderTaskB = () => (
    <Card>
      <SectionTitle subtitle="Analyze emotions and decision making through film.">
        Summative Task B: Inside Out
      </SectionTitle>
      
      <div className="bg-purple-100 border-4 border-purple-300 p-6 md:p-8 rounded-[3rem] mb-10 shadow-[0_8px_0_0_#d8b4fe] print:bg-white print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
        
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 print:hidden">
          <Film className="w-16 h-16 md:w-20 md:h-20 text-purple-500 flex-shrink-0" />
          <p className="text-purple-900 text-lg md:text-xl font-bold leading-relaxed">
            Study the Pixar film "Inside Out". It explores how emotions drive our decisions. Need a refresher? Watch the trailer below, then answer the questions! (3 marks each)
          </p>
        </div>

        {/* Embedded Video Player */}
        <div className="relative w-full overflow-hidden rounded-2xl border-4 border-purple-300 shadow-md bg-black print:hidden" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/yRUAzGQ3nSY?rel=0" 
            title="Inside Out Official Trailer" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Character Glossary */}
        <div className="mt-8 bg-white/60 p-6 rounded-2xl border-2 border-purple-200 print:mt-0 print:border-none print:bg-transparent">
          <h4 className="font-black text-purple-900 mb-3 print:text-slate-800">Quick Character Recap:</h4>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-xl border-2 border-yellow-300 print:border-slate-300 print:bg-white print:text-slate-600">Joy (Yellow)</span>
            <span className="bg-blue-200 text-blue-800 px-3 py-1.5 rounded-xl border-2 border-blue-300 print:border-slate-300 print:bg-white print:text-slate-600">Sadness (Blue)</span>
            <span className="bg-red-200 text-red-800 px-3 py-1.5 rounded-xl border-2 border-red-300 print:border-slate-300 print:bg-white print:text-slate-600">Anger (Red)</span>
            <span className="bg-green-200 text-green-800 px-3 py-1.5 rounded-xl border-2 border-green-300 print:border-slate-300 print:bg-white print:text-slate-600">Disgust (Green)</span>
            <span className="bg-purple-200 text-purple-800 px-3 py-1.5 rounded-xl border-2 border-purple-300 print:border-slate-300 print:bg-white print:text-slate-600">Fear (Purple)</span>
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-slate-50 p-6 md:p-8 rounded-[2rem] border-2 border-slate-200 print:bg-transparent print:border-none print:p-0">
        {[
          { id: 'ioQ1', q: "1. Joy is usually in charge of Riley. Which emotion(s) do you feel most often? Explain." },
          { id: 'ioQ2', q: "2. Riley moves to San Francisco. Have you ever gone through a big transition? Explain." },
          { id: 'ioQ3', q: "3. How are the glowing 'core memories' made? What might yours be?" },
          { id: 'ioQ4', q: "4. What do the core memories have to do with Riley's personality? Explain." },
          { id: 'ioQ5', q: "5. Sadness colors a memory blue. Can our current moods color our past memories? Explain." },
          { id: 'ioQ6', q: "6. Were the core memories changed forever, or just temporarily filtered? Explain." },
          { id: 'ioQ7', q: "7. Riley feels pressure to be a 'happy girl'. Is this fair of her mom to ask? Explain." },
          { id: 'ioQ8', q: "8. Does society value certain emotions over others? Which ones? Explain." },
          { id: 'ioQ9', q: "9. Why does Joy learn that Sadness is also important?" },
          { id: 'ioQ10', q: "10. Is it easier for certain demographics (age/gender) to express different emotions? Why?" },
        ].map(({ id, q }) => (
          <div key={id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm transition-all focus-within:border-purple-300 print:break-inside-avoid print:border-slate-300 print:shadow-none">
            <Label>{q}</Label>
            <Textarea value={formData[id]} onChange={(e) => updateForm(id, e.target.value)} />
          </div>
        ))}
      </div>
    </Card>
  );

  const renderSubmit = () => {
    const is100Percent = progressData.overallPercentage === 100;

    return (
      <Card className="border-t-[8px] border-t-blue-500">
        <SectionTitle subtitle="You're at the finish line! Let's review your work before you export.">
          Final Review & Submission
        </SectionTitle>

        {!is100Percent && (
          <div className="bg-amber-50 border-4 border-amber-400 p-6 md:p-8 rounded-[2rem] mb-10 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left transform -rotate-1 print:hidden">
            <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_0_0_#f59e0b]">
              <AlertTriangle className="w-8 h-8 text-amber-700" />
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-2xl mb-2">Wait up! You have missing answers.</h4>
              <p className="text-amber-800 font-medium text-lg leading-relaxed">
                Your workbook is only <strong className="text-xl bg-amber-200 px-2 py-1 rounded-lg">{progressData.overallPercentage}%</strong> complete. Make sure you haven't skipped anything important before sending this to your teacher. Check the list below!
              </p>
            </div>
          </div>
        )}

        {is100Percent && (
          <div className="bg-emerald-50 border-4 border-emerald-400 p-6 md:p-8 rounded-[2rem] mb-10 shadow-[0_8px_0_0_#34d399] flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left transform rotate-1 print:hidden">
            <div className="w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_0_0_#059669]">
              <Check className="w-10 h-10 text-white font-black stroke-[3px]" />
            </div>
            <div>
              <h4 className="font-black text-emerald-900 text-2xl mb-2">Amazing job! 100% Complete!</h4>
              <p className="text-emerald-800 font-medium text-lg leading-relaxed">
                You've answered every single question in the workbook. Give yourself a high-five, generate your file below, and hand it in!
              </p>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-black text-slate-800 mb-6 print:hidden">Module Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 print:hidden">
          {tabs.filter(t => t.id !== 'submit').map(tab => {
            const stats = progressData.stats[tab.id];
            const isComplete = stats?.isComplete;
            return (
              <button 
                key={tab.id} 
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-4 rounded-2xl border-4 flex items-center justify-between transition-all hover:-translate-y-1 active:translate-y-0 text-left ${isComplete ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 shadow-[0_4px_0_0_#e2e8f0]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isComplete ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                    <tab.icon className={`w-5 h-5 ${isComplete ? 'text-emerald-700' : 'text-slate-500'}`} />
                  </div>
                  <span className={`font-bold text-lg ${isComplete ? 'text-emerald-900' : 'text-slate-700'}`}>{tab.label}</span>
                </div>
                <span className={`font-black text-sm px-3 py-1 rounded-xl ${isComplete ? 'bg-emerald-400 text-emerald-900' : 'bg-white border-2 border-slate-200 text-slate-600'}`}>
                  {stats?.completed}/{stats?.total}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t-4 border-slate-100 pt-10 print:hidden">
          <h3 className="text-3xl font-black text-slate-800 mb-2 text-center">Ready to submit?</h3>
          <p className="text-slate-600 font-medium text-center mb-8">
            Click below to generate your submission file, then upload it to the <strong>Module 1 Assignment Folder</strong> in Brightspace!
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button 
              onClick={handleExportText}
              className="flex-1 flex flex-col items-center justify-center p-8 bg-emerald-500 hover:bg-emerald-400 rounded-[2rem] text-white transition-all shadow-[0_8px_0_0_#059669] active:translate-y-[8px] active:shadow-none border-2 border-emerald-600 group"
            >
              <FileText className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-black text-2xl mb-2">Download Submission File</span>
              <span className="font-medium text-emerald-100 text-sm text-center px-4">This generates a clean, readable text file specifically designed for Brightspace dropbox.</span>
            </button>
            
            <button 
              onClick={handlePrint}
              className="flex-1 flex flex-col items-center justify-center p-8 bg-yellow-400 hover:bg-yellow-300 rounded-[2rem] text-yellow-900 transition-all shadow-[0_8px_0_0_#b45309] active:translate-y-[8px] active:shadow-none border-2 border-yellow-500 group"
            >
              <Printer className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-black text-2xl mb-2">Print to PDF</span>
              <span className="font-medium text-yellow-800 text-sm text-center px-4">Saves a full color, visual copy of your entire workbook for your own records.</span>
            </button>
          </div>
        </div>

        {/* Danger Zone: Reset Workbook */}
        <div className="mt-16 pt-8 border-t-2 border-slate-200 border-dashed text-center print:hidden">
          <p className="text-slate-500 font-medium mb-4">Sharing this computer with another student? Clear your data so they can start fresh.</p>
          <button 
            onClick={handleResetWorkbook}
            className="inline-flex items-center px-6 py-3 bg-white text-rose-600 font-bold border-2 border-rose-200 hover:border-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset entire workbook
          </button>
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    if (printMode) {
      return (
        <div className="space-y-12">
          {renderOverview()}
          {renderInventory()}
          {renderGoals()}
          {renderRomantic()}
          {renderEvaluating()}
          {renderAlcohol()}
          {renderTobacco()}
          {renderRisk()}
          {renderAddictions()}
          {renderMentalHealth()}
          {renderTaskA()}
          {renderTaskB()}
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'inventory': return renderInventory();
      case 'goals': return renderGoals();
      case 'romantic': return renderRomantic();
      case 'evaluating': return renderEvaluating();
      case 'alcohol': return renderAlcohol();
      case 'tobacco': return renderTobacco();
      case 'risk': return renderRisk();
      case 'addictions': return renderAddictions();
      case 'mentalhealth': return renderMentalHealth();
      case 'taskA': return renderTaskA();
      case 'taskB': return renderTaskB();
      case 'submit': return renderSubmit();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row font-sans selection:bg-violet-300 selection:text-violet-900 print:bg-white">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-violet-600 text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b-4 border-violet-800 print:hidden">
        <div className="font-black text-xl tracking-tight">CALM Workbook</div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="p-2 bg-violet-500 hover:bg-violet-400 rounded-xl transition-colors border-2 border-violet-400">
            <Printer size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-violet-500 hover:bg-violet-400 rounded-xl transition-colors border-2 border-violet-400">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION - PLAYFUL VIBRANT */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:flex w-full md:w-72 lg:w-80 bg-violet-600 text-violet-100 flex-shrink-0 flex-col h-auto md:h-screen md:sticky md:top-0 z-40 overflow-y-auto print:hidden shadow-[8px_0_30px_rgba(0,0,0,0.1)] border-r-4 border-violet-800
      `}>
        <div className="p-8 hidden md:block border-b-4 border-violet-500/50">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-black text-4xl mb-6 shadow-[0_6px_0_0_#4c1d95] transform -rotate-3">C</div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">CALM</h1>
          <h2 className="text-sm font-bold bg-violet-800 text-violet-200 inline-block px-3 py-1 rounded-lg uppercase tracking-widest">Module 1</h2>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* PROGRESS BAR COMPONENT */}
          <div className="mb-8 bg-violet-700/40 p-5 rounded-2xl border-2 border-violet-500/50 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-black text-violet-200 uppercase tracking-widest">Progress</span>
              <span className="text-sm font-black text-white bg-violet-500 px-3 py-1 rounded-xl shadow-[0_2px_0_0_#4c1d95]">{progressData.overallPercentage}%</span>
            </div>
            <div className="h-4 bg-violet-900/60 rounded-full overflow-hidden border-2 border-violet-800/80 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progressData.overallPercentage}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white/20"></div>
              </div>
            </div>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !printMode;
            const tabStats = progressData.stats[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPrintMode(false);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center px-4 py-4 rounded-2xl text-base font-bold transition-all duration-200 border-2 ${
                  isActive 
                    ? `bg-white text-slate-800 border-white shadow-[0_4px_0_0_#4c1d95] transform scale-[1.02] z-10 relative` 
                    : 'bg-violet-500/30 border-transparent text-violet-100 hover:bg-violet-500/50 hover:border-violet-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isActive ? tab.bg : 'bg-violet-500/50'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-violet-200'}`} />
                </div>
                {tab.label}
                
                {/* COMPLETION INDICATORS */}
                {tabStats?.isComplete && tab.id !== 'submit' ? (
                  <div className="ml-auto w-7 h-7 bg-emerald-400 text-emerald-900 rounded-[0.6rem] flex items-center justify-center shadow-[0_3px_0_0_#059669] transform rotate-3">
                    <Check className="w-5 h-5 font-black stroke-[3px]" />
                  </div>
                ) : tabStats?.completed > 0 && tab.id !== 'submit' ? (
                  <div className={`ml-auto text-xs font-black px-2 py-1.5 rounded-xl border-2 ${isActive ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-violet-800/50 text-violet-300 border-violet-500/30'}`}>
                    {tabStats.completed}/{tabStats.total}
                  </div>
                ) : null}
              </button>
            )
          })}
        </nav>
        
        <div className="p-6 border-t-4 border-violet-500/50 space-y-4">
          <div className="flex gap-3">
            <button 
              onClick={handleExportJSON}
              className="flex-1 flex items-center justify-center px-3 py-3 bg-sky-400 hover:bg-sky-300 rounded-2xl text-sky-900 font-black text-sm transition-all shadow-[0_4px_0_0_#0284c7] active:translate-y-[4px] active:shadow-none border-2 border-sky-500 group"
              title="Download Backup File"
            >
              <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Backup
            </button>
            <label 
              className="flex-1 flex items-center justify-center px-3 py-3 bg-fuchsia-400 hover:bg-fuchsia-300 rounded-2xl text-fuchsia-900 font-black text-sm transition-all shadow-[0_4px_0_0_#c026d3] active:translate-y-[4px] active:shadow-none border-2 border-fuchsia-500 cursor-pointer group"
              title="Restore from Backup File"
            >
              <UploadCloud className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Restore
              <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            </label>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-10 lg:p-14 overflow-y-auto print:p-0 print:max-w-full print:overflow-visible">
        
        {/* Name & Save Banner */}
        {!printMode && (
          <div className="mb-10 flex flex-wrap items-center justify-end gap-4">
            <div className="inline-flex items-center bg-white px-4 py-2 rounded-xl shadow-[0_4px_0_0_#e2e8f0] border-2 border-slate-200 transform rotate-1">
              <Save className={`w-4 h-4 mr-2 transition-colors ${saveStatus === 'Saving...' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
              <span className="text-sm font-bold text-slate-600">{saveStatus}</span>
            </div>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 print:animate-none">
          {renderContent()}
        </div>
        
        {/* Module Completion Banner & Navigation */}
        {!printMode && (
          <div className="mt-12 space-y-6">
            
            {/* Dynamic Celebration Banner */}
            {progressData.stats[activeTab]?.isComplete && activeTab !== 'submit' && (
              <div className="bg-emerald-400 p-6 rounded-[2rem] border-4 border-emerald-500 shadow-[0_8px_0_0_#059669] flex flex-col sm:flex-row items-center justify-between text-emerald-900 animate-in zoom-in duration-500">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="text-2xl font-black">Section Complete!</h3>
                </div>
                <button 
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === activeTab);
                    if (idx < tabs.length - 1) {
                      setActiveTab(tabs[idx+1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  Go to Next Module ➡️
                </button>
              </div>
            )}

            <div className="flex justify-between items-center px-2">
              <button 
                className={`flex items-center px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_6px_0_0_#e2e8f0] text-slate-700 font-black text-lg hover:bg-slate-50 hover:-translate-y-1 hover:shadow-[0_8px_0_0_#e2e8f0] active:translate-y-[6px] active:shadow-none transition-all ${tabs.findIndex(t => t.id === activeTab) === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx > 0) {
                    setActiveTab(tabs[idx-1].id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                tabIndex={tabs.findIndex(t => t.id === activeTab) === 0 ? -1 : 0}
              >
                <ChevronLeft className="w-6 h-6 mr-2" />
                Back
              </button>
              
              <button 
                className={`flex items-center px-8 py-4 bg-violet-500 border-2 border-violet-600 rounded-2xl shadow-[0_6px_0_0_#5b21b6] text-white font-black text-lg hover:bg-violet-400 hover:-translate-y-1 hover:shadow-[0_8px_0_0_#5b21b6] active:translate-y-[6px] active:shadow-none transition-all ${tabs.findIndex(t => t.id === activeTab) === tabs.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}
                onClick={() => {
                  const idx = tabs.findIndex(t => t.id === activeTab);
                  if (idx < tabs.length - 1) {
                    setActiveTab(tabs[idx+1].id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                tabIndex={tabs.findIndex(t => t.id === activeTab) === tabs.length - 1 ? -1 : 0}
              >
                Next
                <ChevronRight className="w-6 h-6 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
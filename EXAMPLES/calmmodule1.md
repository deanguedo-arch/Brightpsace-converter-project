<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CALM Module 2: Resource Choices</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'] }
                }
            }
        }
    </script>
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- React & ReactDOM (Development versions for standalone usage) -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    
    <!-- Babel for inline JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Canvas Confetti -->
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        
        body {
            background-color: #f8fafc;
            color: #334155;
            -webkit-font-smoothing: antialiased;
        }

        /* Custom Scrollbar for Textareas and window */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .clay-card {
            background: white;
            border-radius: 2rem;
            border: 2px solid #f1f5f9;
            box-shadow: 0 8px 0 0 #e2e8f0, 0 15px 40px rgba(0,0,0,0.05);
        }
        
        .clay-input {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 1rem;
            transition: all 0.2s ease;
        }
        .clay-input:focus {
            background-color: white;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
            outline: none;
        }

        .clay-btn {
            background-color: #8b5cf6;
            color: white;
            font-weight: bold;
            border: 2px solid #6d28d9;
            box-shadow: 0 4px 0 0 #5b21b6;
            border-radius: 1rem;
            transition: all 0.1s ease;
        }
        .clay-btn:active {
            transform: translateY(4px);
            box-shadow: 0 0 0 0 #5b21b6;
        }
        .clay-btn-secondary {
            background-color: #f8fafc;
            color: #475569;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 0 0 #cbd5e1;
        }
        .clay-btn-secondary:active {
            box-shadow: 0 0 0 0 #cbd5e1;
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel" data-presets="react,env">
        const { useState, useEffect, useRef } = React;

        // --- CONSTANTS & INITIAL STATE ---
        const DEFAULT_STATE = {
            studentName: "",
            defMarketing: "", defPackaging: "", influenceExample: "", favoriteStore: "",
            purchases: Array(10).fill({ item: "", influence: "" }),
            biggestInfluence: "",
            joeDecision: "", sallyDecision: "", betterDecision: "",
            purchaseReflection: "",
            honestyNorma: "", honestyGertrude: "", honestyHerman: "", honestyAsif: "", honestyFrank: "", honestyCharlotte: "", honestySalima: "",
            honestyImportant: "", honestyAcceptable: "", honestyEasiest: "", honestyHardest: "", honestyReflection1: "", honestyReflection2: "",
            defConflict: "", conflictAbout: "", conflictResolve: "", conflictEffective: "",
            commSkills: [
                { poor: "Yelling at one another", good: "Speaking at a reasonable volume" },
                { poor: "Aggressive or standoffish body language", good: "Warm, or calm, body language" },
                { poor: "Interrupting", good: "" }, { poor: "Not listening", good: "" },
                { poor: "Not considering the other person's perspective", good: "" }, { poor: "Having to be right", good: "" },
                { poor: "Not accepting criticism", good: "" }, { poor: "Speaking more than you listen", good: "" },
                { poor: "Making generalizations", good: "" }, { poor: "Blowing things out of proportion", good: "" },
                { poor: "Not being open-minded", good: "" }
            ],
            incomeCurrent: "", incomeFuture: "", purchaseDecision: "", purchaseFactors: "",
            budget: { 
                job: "", parents: "", other: "", otherExp: "",
                rent: "", utilities: "", phone: "", groceries: "", car: "", insurance: "", gas: "", entertainment: "", dining: "", clothes: "", etc: "", etcExp: ""
            },
            budgetWhereFrom: "", budgetWhereGo: "", budgetEndMonth: "", budgetChange: "",
            caseJonCraig1: "", caseJonCraig2: "", caseJonCraig3: "",
            caseAmandaJoanne1: "", caseAmandaJoanne2: "", caseAmandaJoanne3: "",
            caseMayaLeticia1: "", caseMayaLeticia2: "", caseMayaLeticia3: "",
            supplementaryImage: null
        };

        const SECTIONS = [
            { id: 'intro', title: 'Start Here', icon: 'fa-rocket' },
            { id: 'advertising', title: '1. Advertising', icon: 'fa-bullhorn' },
            { id: 'waiting', title: '2. What Are You Waiting For?', icon: 'fa-car' },
            { id: 'money', title: '3. Managing Money', icon: 'fa-wallet' },
            { id: 'honesty', title: '4. Honesty Quiz', icon: 'fa-scale-balanced' },
            { id: 'maintaining', title: '5. Maintaining Relationships', icon: 'fa-handshake-angle' },
            { id: 'sum_cases', title: '6. Task: Case Studies', icon: 'fa-users' },
            { id: 'finish', title: 'Review & Submit', icon: 'fa-flag-checkered' }
        ];

        // --- HELPER COMPONENTS ---
        
        const AutoExpandingTextarea = ({ value, onChange, placeholder, className = "" }) => {
            const textareaRef = useRef(null);
            useEffect(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                }
            }, [value]);
            return (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`clay-input w-full p-4 text-slate-700 resize-none overflow-hidden ${className}`}
                    rows={2}
                />
            );
        };

        const KnowledgeDrop = ({ title, children, defaultOpen = true }) => {
            const [isOpen, setIsOpen] = useState(defaultOpen);
            return (
                <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 mb-6 overflow-hidden transition-all">
                    <button 
                        onClick={() => setIsOpen(!isOpen)} 
                        className="w-full flex items-center justify-between p-4 bg-amber-100/50 hover:bg-amber-100 text-amber-900 font-bold"
                    >
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-lightbulb text-amber-500 text-xl"></i>
                            <span>{title}</span>
                        </div>
                        <i className={`fa-solid fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isOpen && <div className="p-6 text-amber-900 space-y-4 leading-relaxed">{children}</div>}
                </div>
            );
        };

        const HintToggle = ({ hint }) => {
            const [show, setShow] = useState(false);
            return (
                <div className="mt-2">
                    <button onClick={() => setShow(!show)} className="text-sm font-semibold text-violet-500 hover:text-violet-600 flex items-center gap-2">
                        <i className="fa-solid fa-circle-question"></i> {show ? 'Hide Hint' : 'Stuck? Show Hint'}
                    </button>
                    {show && <div className="mt-2 p-3 bg-violet-50 rounded-xl border border-violet-100 text-sm text-violet-800 italic">{hint}</div>}
                </div>
            );
        };

        const ImageUploader = ({ image, onImageChange }) => {
            const canvasRef = useRef(null);

            const handleFile = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        
                        // Scale down if too large (Max width 800px)
                        const MAX_WIDTH = 800;
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Compress to JPEG to save localStorage quota
                        const base64 = canvas.toDataURL('image/jpeg', 0.6);
                        onImageChange(base64);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };

            return (
                <div className="mt-4 p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center hover:bg-slate-100 transition-colors relative">
                    {image ? (
                        <div className="relative inline-block">
                            <img src={image} alt="Uploaded evidence" className="max-w-full h-auto rounded-xl border shadow-sm" />
                            <button 
                                onClick={() => onImageChange(null)}
                                className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl shadow-sm">
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <div>
                                <span className="font-bold text-slate-700">Click to upload</span> or drag and drop
                                <p className="text-sm text-slate-500 mt-1">PNG, JPG up to 5MB (Auto-compressed)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                        </label>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
            );
        };

        // --- MAIN APPLICATION ---

        const App = () => {
            const [formData, setFormData] = useState(DEFAULT_STATE);
            const [activeTab, setActiveTab] = useState('intro');
            const [isLoaded, setIsLoaded] = useState(false);
            const completedSectionsRef = useRef(new Set());

            // 1. Auto-Load Data
            useEffect(() => {
                const saved = localStorage.getItem('calmModule2Data');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        // Merge parsed with default to ensure no missing keys crash the app
                        setFormData(prev => ({ ...prev, ...parsed }));
                    } catch (e) {
                        console.error("Failed to parse saved data", e);
                    }
                }
                setIsLoaded(true);
            }, []);

            // 2. Auto-Save Data
            useEffect(() => {
                if (isLoaded) {
                    localStorage.setItem('calmModule2Data', JSON.stringify(formData));
                }
            }, [formData, isLoaded]);

            // Helper to update specific fields easily
            const updateField = (key, value) => {
                setFormData(prev => ({ ...prev, [key]: value }));
            };

            const updateNested = (parent, indexOrKey, keyOrValue, value) => {
                setFormData(prev => {
                    const newParent = Array.isArray(prev[parent]) ? [...prev[parent]] : { ...prev[parent] };
                    if (Array.isArray(newParent)) {
                        newParent[indexOrKey] = { ...newParent[indexOrKey], [keyOrValue]: value };
                    } else {
                        newParent[indexOrKey] = keyOrValue; // obj[key] = value
                    }
                    return { ...prev, [parent]: newParent };
                });
            };

            // Calculate Progress 
            const calcProgress = (sectionId) => {
                const fd = formData;
                let fields = [];
                switch(sectionId) {
                    case 'intro': fields = [fd.studentName]; break;
                    case 'advertising': 
                        fields = [fd.defMarketing, fd.defPackaging, fd.influenceExample, fd.favoriteStore, fd.biggestInfluence];
                        fd.purchases.forEach(p => { fields.push(p.item, p.influence) });
                        break;
                    case 'waiting': fields = [fd.joeDecision, fd.sallyDecision, fd.betterDecision]; break;
                    case 'money': 
                        fields = [
                            fd.purchaseReflection,
                            fd.incomeCurrent, fd.incomeFuture, fd.purchaseDecision, fd.purchaseFactors, 
                            fd.budgetWhereFrom, fd.budgetWhereGo, fd.budgetEndMonth, fd.budgetChange
                        ];
                        Object.values(fd.budget).forEach(v => fields.push(v));
                        break; 
                    case 'honesty': fields = [fd.honestyNorma, fd.honestyGertrude, fd.honestyHerman, fd.honestyAsif, fd.honestyFrank, fd.honestyCharlotte, fd.honestySalima, fd.honestyImportant, fd.honestyAcceptable, fd.honestyEasiest, fd.honestyHardest, fd.honestyReflection1, fd.honestyReflection2]; break;
                    case 'maintaining': 
                        fields = [fd.defConflict, fd.conflictAbout, fd.conflictResolve, fd.conflictEffective];
                        fd.commSkills.forEach(s => fields.push(s.good));
                        break;
                    case 'sum_cases': 
                        fields = [fd.caseJonCraig1, fd.caseJonCraig2, fd.caseJonCraig3, fd.caseAmandaJoanne1, fd.caseAmandaJoanne2, fd.caseAmandaJoanne3, fd.caseMayaLeticia1, fd.caseMayaLeticia2, fd.caseMayaLeticia3];
                        break;
                    default: return { completed: 0, total: 1, isDone: false };
                }
                
                const total = fields.length;
                const completed = fields.filter(f => {
                    if (typeof f === 'string') return f.trim().length > 0;
                    if (f === null || f === undefined) return false;
                    return true;
                }).length;

                const isDone = total > 0 && completed === total;
                return { completed, total, isDone };
            };

            // Confetti effect when a section becomes fully done
            useEffect(() => {
                SECTIONS.forEach(sec => {
                    if (sec.id === 'finish') return;
                    const { isDone } = calcProgress(sec.id);
                    if (isDone && !completedSectionsRef.current.has(sec.id)) {
                        completedSectionsRef.current.add(sec.id);
                        fireConfettiEdges();
                    } else if (!isDone && completedSectionsRef.current.has(sec.id)) {
                        completedSectionsRef.current.delete(sec.id);
                    }
                });
            }, [formData]);

            const fireConfettiEdges = () => {
                const duration = 2 * 1000;
                const end = Date.now() + duration;
                (function frame() {
                    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#8b5cf6', '#a78bfa', '#fcd34d'] });
                    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#8b5cf6', '#a78bfa', '#fcd34d'] });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            };

            const generateTeacherExport = () => {
                const fd = formData;
                let out = `========================================================\n`;
                out += `  CALM MODULE 2: RESOURCE CHOICES - STUDENT SUBMISSION  \n`;
                out += `========================================================\n`;
                out += `Student Name: ${fd.studentName || "Not provided"}\n\n`;

                out += `--- 1. ADVERTISING & CONSUMERISM ---\n`;
                out += `Marketing Definition: ${fd.defMarketing}\n`;
                out += `Packaging Definition: ${fd.defPackaging}\n`;
                out += `Influence of friends/family: ${fd.influenceExample}\n`;
                out += `Favorite Store/Brand & Why: ${fd.favoriteStore}\n`;
                out += `Purchases:\n`;
                fd.purchases.forEach((p, i) => { if(p.item) out += `  ${i+1}. ${p.item} (Influence: ${p.influence})\n` });
                out += `Biggest Influence: ${fd.biggestInfluence}\n\n`;

                out += `--- 2. WHAT ARE YOU WAITING FOR? ---\n`;
                out += `Why Joe bought Camaro: ${fd.joeDecision}\n`;
                out += `Why Sally bought Escort: ${fd.sallyDecision}\n`;
                out += `Who made the better decision: ${fd.betterDecision}\n\n`;

                out += `--- 3. MANAGING MONEY ---\n`;
                out += `Purchase Reflection: ${fd.purchaseReflection}\n`;
                out += `Current income sources: ${fd.incomeCurrent}\n`;
                out += `Future income sources: ${fd.incomeFuture}\n`;
                out += `How decide what to purchase: ${fd.purchaseDecision}\n`;
                out += `Factors influencing decisions: ${fd.purchaseFactors}\n`;
                out += `Budget Income -> Job: ${fd.budget.job}, Parents: ${fd.budget.parents}, Other: ${fd.budget.other} (${fd.budget.otherExp})\n`;
                out += `Budget Exp -> Rent: ${fd.budget.rent}, Utils: ${fd.budget.utilities}, Phone: ${fd.budget.phone}, Groceries: ${fd.budget.groceries}\n`;
                out += `Budget Exp -> Car: ${fd.budget.car}, Ins: ${fd.budget.insurance}, Gas: ${fd.budget.gas}, Ent: ${fd.budget.entertainment}, Dining: ${fd.budget.dining}, Clothes: ${fd.budget.clothes}, Etc: ${fd.budget.etc} (${fd.budget.etcExp})\n`;
                out += `Where most money comes from: ${fd.budgetWhereFrom}\n`;
                out += `Where most money goes: ${fd.budgetWhereGo}\n`;
                out += `Saving or debt/Plans: ${fd.budgetEndMonth}\n`;
                out += `One thing to do differently: ${fd.budgetChange}\n\n`;

                out += `--- 4. HONESTY ---\n`;
                out += `Norma (Found $100): ${fd.honestyNorma}\n`;
                out += `Gertrude (Graffiti): ${fd.honestyGertrude}\n`;
                out += `Herman (Lying to friend): ${fd.honestyHerman}\n`;
                out += `Asif (Wrong change): ${fd.honestyAsif}\n`;
                out += `Frank (Found phone): ${fd.honestyFrank}\n`;
                out += `Charlotte (Test answers): ${fd.honestyCharlotte}\n`;
                out += `Salima (Tracing art): ${fd.honestySalima}\n`;
                out += `When important to be honest: ${fd.honestyImportant}\n`;
                out += `When acceptable to lie: ${fd.honestyAcceptable}\n`;
                out += `Easiest scenario: ${fd.honestyEasiest}\n`;
                out += `Hardest scenario: ${fd.honestyHardest}\n`;
                out += `Reflection (Time chose to lie): ${fd.honestyReflection1}\n`;
                out += `Reflection (Is honesty important?): ${fd.honestyReflection2}\n\n`;

                out += `--- 5. MAINTAINING RELATIONSHIPS ---\n`;
                out += `Conflict Definition: ${fd.defConflict}\n`;
                out += `Past Conflict (What about?): ${fd.conflictAbout}\n`;
                out += `Past Conflict (How resolved?): ${fd.conflictResolve}\n`;
                out += `Past Conflict (Was it effective?): ${fd.conflictEffective}\n`;
                out += `Communication Skills:\n`;
                fd.commSkills.forEach((s, i) => { if(i>1 && s.good) out += `  Instead of "${s.poor}" -> "${s.good}"\n` });
                out += `\n`;

                out += `--- 5. TASK: CASE STUDIES ---\n`;
                out += `Case 1 (Joe/Craig) - How handle: ${fd.caseJonCraig1}\n`;
                out += `Case 1 (Joe/Craig) - How react: ${fd.caseJonCraig2}\n`;
                out += `Case 1 (Joe/Craig) - What if fixing car: ${fd.caseJonCraig3}\n`;
                out += `Case 2 (Amanda/Joanne) - How handle: ${fd.caseAmandaJoanne1}\n`;
                out += `Case 2 (Amanda/Joanne) - How react: ${fd.caseAmandaJoanne2}\n`;
                out += `Case 2 (Amanda/Joanne) - What if kicked out: ${fd.caseAmandaJoanne3}\n`;
                out += `Case 3 (Maya/Leticia) - How handle: ${fd.caseMayaLeticia1}\n`;
                out += `Case 3 (Maya/Leticia) - How react: ${fd.caseMayaLeticia2}\n`;
                out += `Case 3 (Maya/Leticia) - What if BF threatens: ${fd.caseMayaLeticia3}\n`;
                
                if (fd.supplementaryImage) {
                    out += `\n[NOTE: Student attached an image to their submission. Please check the digital LMS view for the image.]\n`;
                }

                const blob = new Blob([out], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `CALM_Mod2_${fd.studentName.replace(/\s+/g, '_') || "Student"}.txt`;
                a.click();
            };

            const nextTab = () => {
                const idx = SECTIONS.findIndex(s => s.id === activeTab);
                if (idx < SECTIONS.length - 1) {
                    setActiveTab(SECTIONS[idx + 1].id);
                    window.scrollTo(0, 0);
                }
            };

            if (!isLoaded) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading your workbook...</div>;

            return (
                <div className="flex flex-col md:flex-row min-h-screen">
                    
                    {/* SIDEBAR NAVIGATION */}
                    <div className="md:w-72 bg-white border-r-2 border-slate-100 p-6 flex flex-col md:h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
                        <div className="mb-8">
                            <h1 className="text-2xl font-black tracking-tighter text-slate-800 leading-tight">CALM <span className="text-violet-500">Module 2</span></h1>
                            <p className="text-sm text-slate-500 font-semibold mt-1">Resource Choices</p>
                        </div>
                        
                        <nav className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {SECTIONS.map(sec => {
                                const { completed, total, isDone } = calcProgress(sec.id);
                                const isActive = activeTab === sec.id;
                                return (
                                    <button 
                                        key={sec.id}
                                        onClick={() => setActiveTab(sec.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${isActive ? 'bg-violet-500 text-white shadow-[0_4px_0_0_#5b21b6] font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium border-2 border-transparent'}`}
                                        style={isActive ? { transform: 'translateY(-2px)' } : {}}
                                    >
                                        <div className="flex items-center gap-3">
                                            <i className={`fa-solid ${sec.icon} ${isActive ? 'text-violet-200' : 'text-slate-400'}`}></i>
                                            <span className="text-sm text-left">{sec.title}</span>
                                        </div>
                                        {sec.id !== 'finish' && (
                                            <div className={`text-xs px-2 py-1 rounded-full font-bold ${isActive ? 'bg-violet-600 text-white' : (isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500')}`}>
                                                {isDone ? <i className="fa-solid fa-check"></i> : `${completed}/${total}`}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                        
                        <div className="mt-6 pt-6 border-t-2 border-slate-100">
                            <div className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Progress Saved Automatically</div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(SECTIONS.filter(s => s.id!=='finish' && calcProgress(s.id).isDone).length / (SECTIONS.length-1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 relative">
                        <div className="max-w-4xl mx-auto space-y-8 pb-32">
                            
                            {/* TAB: INTRO */}
                            {activeTab === 'intro' && (
                                <div className="clay-card p-8 md:p-12 animate-[fadeIn_0.3s_ease-out]">
                                    <div className="text-center mb-10">
                                        <div className="inline-block p-4 bg-violet-100 rounded-3xl mb-4">
                                            <i className="fa-solid fa-rocket text-4xl text-violet-500"></i>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Welcome to Module 2!</h2>
                                        <p className="text-lg text-slate-500 font-medium">Let's explore resource choices, money management, and healthy relationships.</p>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">To get started, enter your full name:</label>
                                        <input 
                                            type="text" 
                                            className="clay-input w-full p-4 text-xl font-bold" 
                                            placeholder="Your Name Here..."
                                            value={formData.studentName}
                                            onChange={(e) => updateField('studentName', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB: ADVERTISING */}
                            {activeTab === 'advertising' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <h2 className="text-3xl font-black mb-6">Who Decides What You Buy?</h2>
                                    
                                    <div className="clay-card p-8 space-y-6">
                                        <div>
                                            <label className="block font-bold mb-2">Using a dictionary, define the term <span className="text-violet-500">Marketing</span>:</label>
                                            <AutoExpandingTextarea value={formData.defMarketing} onChange={e => updateField('defMarketing', e.target.value)} placeholder="Marketing is..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">Using a dictionary, define the term <span className="text-violet-500">Packaging</span>:</label>
                                            <AutoExpandingTextarea value={formData.defPackaging} onChange={e => updateField('defPackaging', e.target.value)} placeholder="Packaging is..." />
                                        </div>
                                    </div>

                                    <KnowledgeDrop title="Influences in Marketing" defaultOpen={true}>
                                        <div className="space-y-4 text-sm">
                                            <p><strong>1. Significant Others:</strong> People who matter to us influence our opinions and buying decisions. Our families demonstrate "what to buy" from childhood. Friends and peer groups influence us to buy "trendy" items.</p>
                                            <p><strong>2. Habit:</strong> Consumers tend to buy what they have purchased in the past that was satisfactory. People are creatures of habit.</p>
                                            <p><strong>3. Changes in Lifestyle:</strong> A new job, moving away, or changes in money/time available affects purchases.</p>
                                            <p><strong>4. Personal Expectations:</strong> Changes in age, becoming a better consumer, negative past experiences, or conscious decisions (e.g., environmental protection).</p>
                                        </div>
                                    </KnowledgeDrop>

                                    <div className="clay-card p-8 space-y-6 mt-6">
                                        <div>
                                            <label className="block font-bold mb-2">How might friends or family influence what you spend your money on? List and explain one example from your own life.</label>
                                            <AutoExpandingTextarea value={formData.influenceExample} onChange={e => updateField('influenceExample', e.target.value)} placeholder="An example from my life..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">What is your favorite store/brand name to buy? Why?</label>
                                            <AutoExpandingTextarea value={formData.favoriteStore} onChange={e => updateField('favoriteStore', e.target.value)} placeholder="My favorite store/brand is..." />
                                        </div>
                                    </div>

                                    <div className="clay-card p-8 space-y-6 mt-6">
                                        <h3 className="font-black text-xl mb-4">Your Recent Purchases</h3>
                                        <p className="text-slate-500 text-sm mb-4">List up to 10 things you have purchased recently and what influenced you to buy them (e.g., needed it, saw an ad, friend had one).</p>
                                        
                                        <div className="space-y-3">
                                            {formData.purchases.map((p, i) => (
                                                <div key={i} className="flex flex-col md:flex-row gap-3">
                                                    <input 
                                                        type="text" 
                                                        className="clay-input flex-1 p-3" 
                                                        placeholder={`Item ${i+1}`}
                                                        value={p.item}
                                                        onChange={e => {
                                                            const newPurchases = [...formData.purchases];
                                                            newPurchases[i].item = e.target.value;
                                                            updateField('purchases', newPurchases);
                                                        }}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="clay-input flex-1 p-3" 
                                                        placeholder="Influence / Reason"
                                                        value={p.influence}
                                                        onChange={e => {
                                                            const newPurchases = [...formData.purchases];
                                                            newPurchases[i].influence = e.target.value;
                                                            updateField('purchases', newPurchases);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-6">
                                            <label className="block font-bold mb-2 text-violet-600">Looking at your list, what has been the BIGGEST influence on what you have purchased?</label>
                                            <AutoExpandingTextarea value={formData.biggestInfluence} onChange={e => updateField('biggestInfluence', e.target.value)} placeholder="The biggest influence seems to be..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: WAITING */}
                            {activeTab === 'waiting' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <h2 className="text-3xl font-black mb-6">What are you Waiting For?</h2>
                                    
                                    <KnowledgeDrop title="The Price of Cool: Joe vs. Sally">
                                        <div className="space-y-4 text-sm">
                                            <p><strong>Joe</strong><br/>
                                            Joe gets a job as a clerk at Wal-Mart. He’s living a home and saving every last dollar so he can make the $2,000 down payment on a $20,000 Camaro which the racing scoop on the hood. He takes out a car loan for the remaining $18,000. His parents had to sign for the loan, but Joe is making the payments. It’s a five year loan at 11.67 percent interest, so he sends $400 to the finance company every month. He cringes the first time he seals the envelope, kisses $400 goodbye, but he forgets all about that when he’s driving around in the Camaro and his friends are telling him what a cool car it is.</p>
                                            
                                            <p>A few months later, there are scratches on the door and stains on the carpet and nobody is oohing and aahing when the Camaro pulls into the parking lot. It’s just another car by then, but Joe is stuck with the payments. To be able to afford the car and a date to ride in the car, he works extra night shifts, which means he’s too busy to catch many dates.</p>
                                            
                                            <p>At the end of five years, he’s sick of the Camaro, which lost its cool a long time ago. He has finally paid off the car loan, which cost him an extra $6,000 in interest charges. Now between the loan and the original purchase price, Joe has invested $26,000 in this car, not including taxes and fees, insurance premiums, gas, oil, and maintenance.</p>
                                            
                                            <p>At this point, the Camaro has dents and stains and the engine sounds a bit rough. If he sold the thing he could get maybe $5,000 for it. So what he’s got to show for his $26,000 investment is a $5,000 care that he doesn’t even want any more.</p>

                                            <div className="h-px w-full bg-amber-200 my-4"></div>
                                            
                                            <p><strong>Sally</strong><br/>
                                            Sally also lives at home and works at the Wal-Mart checkout line a few feet away from Joe, but she didn’t buy a cool car. She took the $2,000 she’d saved up and bought a used Ford Escort. Since Sally paid cash, she didn’t have car payments. So instead of spending $400 a month to the finance company, she invested $400 a month in a mutual fund for stocks.</p>
                                            
                                            <p>Five years later, when Joe was mailing out his last car payment, the value of Sally’s mutual fund has doubled, Between the doubling of the fund itself and the steady stream of $400 contributions to the fund, Sally has an asset of nearly $30,000. She also has the Escort, which gets her back and forth OK, and she never worries about dents and stains because she never thought of her car as an investment. It’s only transportation.</p>
                                        </div>
                                    </KnowledgeDrop>

                                    <div className="clay-card p-8 space-y-8">
                                        <div>
                                            <label className="block font-bold mb-2 text-lg">Why do you think Joe bought a new Camaro? Explain your thinking.</label>
                                            <AutoExpandingTextarea value={formData.joeDecision} onChange={e => updateField('joeDecision', e.target.value)} placeholder="Joe likely bought the car because..." />
                                            <HintToggle hint="Think about social status, the desire to impress friends, and the allure of instant gratification." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-lg">Why do you think Sally bought a used Escort? Explain your thinking.</label>
                                            <AutoExpandingTextarea value={formData.sallyDecision} onChange={e => updateField('sallyDecision', e.target.value)} placeholder="Sally probably bought the used car because..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-lg">Who do you think made the better decision? Explain your thinking.</label>
                                            <AutoExpandingTextarea value={formData.betterDecision} onChange={e => updateField('betterDecision', e.target.value)} placeholder="I think [Joe/Sally] made the better decision because..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: MANAGING MONEY */}
                            {activeTab === 'money' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <h2 className="text-3xl font-black mb-6">Managing Your Money</h2>
                                    
                                    <p className="text-gray-700 mb-6 font-medium text-lg">
                                        Think about something significant you or a family member purchased. Review the checklist below to determine if enough research was done, then complete the reflection.
                                    </p>

                                    <KnowledgeDrop title="Smart Buyer Checklist">
                                        <div className="space-y-4 text-sm text-gray-800">
                                            <div>
                                                <strong className="text-amber-800">1. Ask yourself before buying:</strong>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li>Do you really need this? Could it be rented, borrowed, or substituted with something you already have?</li>
                                                    <li>Can you afford it? Will there be any other hidden costs with this purchase?</li>
                                                    <li>Did you read reviews and gather information to ensure it's the best price for the quality?</li>
                                                    <li>Can you return it if needed?</li>
                                                </ul>
                                            </div>
                                            
                                            <div>
                                                <strong className="text-amber-800">2. Understand advertising and labeling:</strong>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li>Did you confirm the item is actually being sold for the advertised price and conditions?</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <strong className="text-amber-800">3. Ask questions and get answers:</strong>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li>Did you talk to salespeople and ask questions?</li>
                                                    <li>If the article isn't being sold in a store, did you get the seller's "promises" in writing?</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <strong className="text-amber-800">4. Shop wisely:</strong>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li>Did you comparison shop, check prices month-to-month, or watch for advertisements of sales?</li>
                                                    <li>Did you shop out-of-season (e.g., buying winter clothing sales at the end of the season)?</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <strong className="text-amber-800">5. Know the return, exchange, and refund policy:</strong>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li>Do they require a receipt? Must the item be in "store-bought" condition?</li>
                                                    <li>Are sale items final sale? Do they only offer "in-store credit" for returns?</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </KnowledgeDrop>

                                    <div className="clay-card p-8 space-y-6 mt-6">
                                        <h3 className="font-black text-xl mb-4">Reflecting on a Purchase</h3>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                Reflecting: Do you think you did enough research into your purchase? Why or why not?
                                            </label>
                                            <AutoExpandingTextarea 
                                                value={formData.purchaseReflection} 
                                                onChange={(e) => updateField('purchaseReflection', e.target.value)} 
                                                placeholder="Consider the checklist above in your answer..."
                                            />
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-slate-200 my-10"></div>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-amber-400 text-amber-900 font-bold px-3 py-1 rounded-full text-sm tracking-wider uppercase">Task</div>
                                        <h3 className="text-2xl font-black">Budgeting Assignment</h3>
                                    </div>

                                    <div className="clay-card p-8 space-y-6 mb-8">
                                        <div>
                                            <label className="block font-bold mb-2">1. List your current source(s) of income.</label>
                                            <AutoExpandingTextarea value={formData.incomeCurrent} onChange={e => updateField('incomeCurrent', e.target.value)} placeholder="I make money from..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">2. What do you expect to be your source(s) of income in the near future?</label>
                                            <AutoExpandingTextarea value={formData.incomeFuture} onChange={e => updateField('incomeFuture', e.target.value)} placeholder="In the future, I expect to earn from..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">3. How do you decide what to purchase?</label>
                                            <AutoExpandingTextarea value={formData.purchaseDecision} onChange={e => updateField('purchaseDecision', e.target.value)} placeholder="I decide by..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">4. What factors do you think influence your purchasing decisions?</label>
                                            <AutoExpandingTextarea value={formData.purchaseFactors} onChange={e => updateField('purchaseFactors', e.target.value)} placeholder="Factors include..." />
                                        </div>
                                    </div>

                                    {/* BUDGET SHEET */}
                                    <div className="clay-card p-0 overflow-hidden mb-8 border-violet-200">
                                        <div className="bg-violet-500 p-6 text-white text-center">
                                            <h3 className="font-black text-2xl">Monthly Personal Budget</h3>
                                            <p className="text-violet-200 text-sm">Fill in estimated amounts (use $0 if not applicable)</p>
                                        </div>
                                        
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                            {/* INCOME */}
                                            <div className="flex-1 space-y-4">
                                                <h4 className="font-black text-xl text-emerald-600 flex items-center gap-2 border-b-2 border-emerald-100 pb-2"><i className="fa-solid fa-arrow-down"></i> Income (+)</h4>
                                                
                                                <div className="flex justify-between items-center gap-4">
                                                    <label className="font-semibold text-slate-600">Job</label>
                                                    <input type="number" className="clay-input w-32 p-2 text-right font-bold text-slate-800" placeholder="$" value={formData.budget.job} onChange={e => updateNested('budget', 'job', e.target.value)} />
                                                </div>
                                                <div className="flex justify-between items-center gap-4">
                                                    <label className="font-semibold text-slate-600">Parents/Family</label>
                                                    <input type="number" className="clay-input w-32 p-2 text-right font-bold text-slate-800" placeholder="$" value={formData.budget.parents} onChange={e => updateNested('budget', 'parents', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <label className="font-semibold text-slate-600">Other</label>
                                                        <input type="number" className="clay-input w-32 p-2 text-right font-bold text-slate-800" placeholder="$" value={formData.budget.other} onChange={e => updateNested('budget', 'other', e.target.value)} />
                                                    </div>
                                                    <input type="text" className="clay-input w-full p-2 text-sm" placeholder="Explain 'Other'..." value={formData.budget.otherExp} onChange={e => updateNested('budget', 'otherExp', e.target.value)} />
                                                </div>
                                            </div>

                                            {/* EXPENSES */}
                                            <div className="flex-1 space-y-4">
                                                <h4 className="font-black text-xl text-rose-500 flex items-center gap-2 border-b-2 border-rose-100 pb-2"><i className="fa-solid fa-arrow-up"></i> Expenses (-)</h4>
                                                
                                                {[
                                                    { label: 'Rent/Room & Board', key: 'rent' },
                                                    { label: 'Utilities', key: 'utilities' },
                                                    { label: 'Phone', key: 'phone' },
                                                    { label: 'Groceries', key: 'groceries' },
                                                    { label: 'Car Payments', key: 'car' },
                                                    { label: 'Insurance', key: 'insurance' },
                                                    { label: 'Gas', key: 'gas' },
                                                    { label: 'Entertainment', key: 'entertainment' },
                                                    { label: 'Dining Out', key: 'dining' },
                                                    { label: 'Clothes', key: 'clothes' }
                                                ].map(item => (
                                                    <div key={item.key} className="flex justify-between items-center gap-4">
                                                        <label className="font-semibold text-slate-600 text-sm">{item.label}</label>
                                                        <input type="number" className="clay-input w-32 p-2 text-right font-bold text-slate-800" placeholder="$" value={formData.budget[item.key]} onChange={e => updateNested('budget', item.key, e.target.value)} />
                                                    </div>
                                                ))}

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <label className="font-semibold text-slate-600 text-sm">Etc.</label>
                                                        <input type="number" className="clay-input w-32 p-2 text-right font-bold text-slate-800" placeholder="$" value={formData.budget.etc} onChange={e => updateNested('budget', 'etc', e.target.value)} />
                                                    </div>
                                                    <input type="text" className="clay-input w-full p-2 text-sm" placeholder="Explain 'Etc'..." value={formData.budget.etcExp} onChange={e => updateNested('budget', 'etcExp', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="clay-card p-8 space-y-6">
                                        <h3 className="font-black text-xl mb-4">Budget Analysis</h3>
                                        <div>
                                            <label className="block font-bold mb-2">Where does most of your money come from?</label>
                                            <AutoExpandingTextarea value={formData.budgetWhereFrom} onChange={e => updateField('budgetWhereFrom', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">Where does most of your money go?</label>
                                            <AutoExpandingTextarea value={formData.budgetWhereGo} onChange={e => updateField('budgetWhereGo', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">At the end of the month, are you saving money or going into debt? What are your plans for the money?</label>
                                            <AutoExpandingTextarea value={formData.budgetEndMonth} onChange={e => updateField('budgetEndMonth', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-violet-600">Looking at your budget, what is one thing you would like to do differently? Explain.</label>
                                            <AutoExpandingTextarea value={formData.budgetChange} onChange={e => updateField('budgetChange', e.target.value)} placeholder="I would like to change..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: HONESTY */}
                            {activeTab === 'honesty' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <h2 className="text-3xl font-black mb-6">Relationships & Honesty</h2>

                                    <KnowledgeDrop title="Healthy Relationships">
                                        <p className="mb-2">People in healthy relationships:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            <li>Listen and take feelings seriously</li>
                                            <li>Talk openly and honestly</li>
                                            <li>Never use threats of harm/violence/suicide</li>
                                            <li>Never strike out in anger</li>
                                            <li>Do not try to control where you go</li>
                                            <li>Respect you and say good things about you</li>
                                            <li>Enjoy spending time with you</li>
                                            <li>Trust you and keep confidences</li>
                                            <li>Allow you to enjoy activities</li>
                                            <li>Accept sexual limits, every time</li>
                                        </ul>
                                    </KnowledgeDrop>

                                    <div className="clay-card p-8 space-y-8">
                                        <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-slate-100">
                                            <i className="fa-solid fa-scale-balanced text-3xl text-violet-500"></i>
                                            <h3 className="font-black text-2xl">Honesty Quiz</h3>
                                        </div>
                                        <p className="font-bold text-slate-500">For each situation, answer whether or not the individual is justified. Explain your reasoning (Yes or No? Why?).</p>

                                        <div className="space-y-6">
                                            {[
                                                { key: 'honestyNorma', text: "Norma sees a wealthy person drop $100. Norma is low on rent and finds it hard to make ends meet. She knows she needs it more. Is she justified in keeping the money?" },
                                                { key: 'honestyGertrude', text: "Gertrude sees her friend Ethyl tagging a wall with a homophobic slur. No one else witnesses it. The principal asks anyone with information to come forward. Is Gertrude justified in not reporting this?" },
                                                { key: 'honestyHerman', text: "Herman overheard Ollie's new girlfriend saying mean things. Ollie asks Herman what he thinks of her, and Herman says she is 'nice' to avoid hurting his feelings. Is Herman justified?" },
                                                { key: 'honestyAsif', text: "Asif is given $4 too much change at Tim Horton's. He is running late and realizes outside. Should Asif feel guilty for keeping the money?" },
                                                { key: 'honestyFrank', text: "Frank finds an iPhone in the school washroom. He wants a smartphone and knows a friend who can unlock it. Is Frank justified in keeping the phone?" },
                                                { key: 'honestyCharlotte', text: "Charlotte sees the teacher left the answer key on the chalkboard during a test. Is Charlotte justified in copying the answers?" },
                                                { key: 'honestySalima', text: "Salima is given homework to draw an object from observation, but traces it from a magazine instead. Is this plagiarism?" },
                                            ].map((q, idx) => (
                                                <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                    <p className="font-semibold text-slate-800 mb-3">{idx+1}. {q.text}</p>
                                                    <AutoExpandingTextarea value={formData[q.key]} onChange={e => updateField(q.key, e.target.value)} placeholder="Yes/No, because..." className="bg-white" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="clay-card p-8 space-y-6 mt-8 bg-violet-50 border-violet-100">
                                        <h3 className="font-black text-xl mb-4 text-violet-900">Discussion & Reflection</h3>
                                        
                                        <div>
                                            <label className="block font-bold mb-2 text-violet-800">When is it important to be honest? Describe situations.</label>
                                            <AutoExpandingTextarea value={formData.honestyImportant} onChange={e => updateField('honestyImportant', e.target.value)} placeholder="It is most important to be honest when..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-violet-800">When is it acceptable to lie or omit truth? Describe situations.</label>
                                            <AutoExpandingTextarea value={formData.honestyAcceptable} onChange={e => updateField('honestyAcceptable', e.target.value)} placeholder="It might be acceptable when..." />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block font-bold mb-2 text-violet-800">Which scenario was the easiest for you to decide? Why?</label>
                                                <AutoExpandingTextarea value={formData.honestyEasiest} onChange={e => updateField('honestyEasiest', e.target.value)} placeholder="The easiest was..." />
                                            </div>
                                            <div>
                                                <label className="block font-bold mb-2 text-violet-800">Which scenario was the hardest for you to decide? Why?</label>
                                                <AutoExpandingTextarea value={formData.honestyHardest} onChange={e => updateField('honestyHardest', e.target.value)} placeholder="The hardest was..." />
                                            </div>
                                        </div>
                                        
                                        <div className="h-px w-full bg-violet-200 my-4"></div>
                                        
                                        <div>
                                            <label className="block font-bold mb-2 text-violet-800">Explain a time when you chose to deceive or lie? Why did you need to do this?</label>
                                            <AutoExpandingTextarea value={formData.honestyReflection1} onChange={e => updateField('honestyReflection1', e.target.value)} placeholder="A time I lied was..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-violet-800">Do you believe honesty is important to healthy relationships? Why or Why not?</label>
                                            <AutoExpandingTextarea value={formData.honestyReflection2} onChange={e => updateField('honestyReflection2', e.target.value)} placeholder="I believe honesty is..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: MAINTAINING RELATIONSHIPS */}
                            {activeTab === 'maintaining' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <h2 className="text-3xl font-black mb-6">Maintaining Positive Relationships</h2>

                                    <div className="clay-card p-8 space-y-6">
                                        <div>
                                            <label className="block font-bold mb-2">Using a dictionary, define <span className="text-violet-500">conflict</span>.</label>
                                            <AutoExpandingTextarea value={formData.defConflict} onChange={e => updateField('defConflict', e.target.value)} placeholder="Conflict is..." />
                                        </div>
                                    </div>

                                    <KnowledgeDrop title="Conflict: A Fact of Life">
                                        <p>Conflict between people is a fact of life – and it's not necessarily a bad thing. A relationship with frequent conflict may be healthier than one with no observable conflict.</p>
                                        <p>Once you are in a conflict, it is important to reduce the emotional charge so you can communicate rationally. Good communication skills are essential to resolving conflict quickly and effectively.</p>
                                    </KnowledgeDrop>

                                    <div className="clay-card p-8 space-y-6">
                                        <h3 className="font-black text-xl text-slate-800">Think of a time you were in a conflict with a friend or family member.</h3>
                                        <div>
                                            <label className="block font-bold mb-2">What were you fighting or arguing about?</label>
                                            <AutoExpandingTextarea value={formData.conflictAbout} onChange={e => updateField('conflictAbout', e.target.value)} placeholder="We argued about..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">How did you try to resolve your conflict?</label>
                                            <AutoExpandingTextarea value={formData.conflictResolve} onChange={e => updateField('conflictResolve', e.target.value)} placeholder="I tried to resolve it by..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2">Was this effective? Why or why not?</label>
                                            <AutoExpandingTextarea value={formData.conflictEffective} onChange={e => updateField('conflictEffective', e.target.value)} placeholder="It was/wasn't effective because..." />
                                        </div>
                                    </div>

                                    <div className="clay-card p-8 space-y-6 mt-8">
                                        <h3 className="font-black text-xl mb-4">Communication Skills Translator</h3>
                                        <p className="text-sm text-slate-500 mb-6">For each example of poor communication skills, provide an alternative example of good communication skills.</p>
                                        
                                        <div className="space-y-4">
                                            {formData.commSkills.map((skill, idx) => (
                                                <div key={idx} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                                    <div className="w-full md:w-1/2 flex items-center gap-3 text-rose-500 font-semibold">
                                                        <i className="fa-solid fa-xmark bg-rose-100 p-2 rounded-full shrink-0"></i>
                                                        <span className="leading-tight">{skill.poor}</span>
                                                    </div>
                                                    <i className="fa-solid fa-arrow-right text-slate-300 hidden md:block"></i>
                                                    <div className="w-full md:w-1/2 relative">
                                                        <input 
                                                            type="text" 
                                                            className="clay-input w-full p-3 pl-10" 
                                                            placeholder="Good Alternative..."
                                                            value={skill.good}
                                                            onChange={e => {
                                                                const newSkills = [...formData.commSkills];
                                                                newSkills[idx].good = e.target.value;
                                                                updateField('commSkills', newSkills);
                                                            }}
                                                        />
                                                        <i className="fa-solid fa-check text-emerald-500 absolute left-4 top-1/2 transform -translate-y-1/2"></i>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: SUMMATIVE CASES */}
                            {activeTab === 'sum_cases' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-amber-400 text-amber-900 font-bold px-3 py-1 rounded-full text-sm tracking-wider uppercase">Summative Task</div>
                                        <h2 className="text-3xl font-black">Social Case Studies</h2>
                                    </div>
                                    
                                    <p className="text-slate-600 mb-8 font-medium">Read the following 3 social situations and analyze how the characters should handle them.</p>

                                    {/* Case 1 */}
                                    <div className="clay-card p-8 space-y-6 mb-8 border-l-8 border-l-blue-400">
                                        <h3 className="font-black text-2xl text-blue-900 mb-4">Case 1: Joe & Craig</h3>
                                        <div className="bg-blue-50 p-4 rounded-xl text-blue-900 italic font-medium">
                                            "Joe lent Craig, his best friend, $100 six weeks ago. He has not asked for the money back but knows that Craig started a new part-time job three weeks ago and feels he should now have the cash to repay him."
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Jon (Joe) should handle this situation? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseJonCraig1} onChange={e => updateField('caseJonCraig1', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Craig will react? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseJonCraig2} onChange={e => updateField('caseJonCraig2', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm text-blue-700">What if Craig told Joe that he needed the money to fix his car? Does this change how Jon should handle it?</label>
                                            <AutoExpandingTextarea value={formData.caseJonCraig3} onChange={e => updateField('caseJonCraig3', e.target.value)} placeholder="..." />
                                        </div>
                                    </div>

                                    {/* Case 2 */}
                                    <div className="clay-card p-8 space-y-6 mb-8 border-l-8 border-l-purple-400">
                                        <h3 className="font-black text-2xl text-purple-900 mb-4">Case 2: Amanda & Joanne</h3>
                                        <div className="bg-purple-50 p-4 rounded-xl text-purple-900 italic font-medium">
                                            "Amanda has known Joanne since 3rd grade. She has covered for Joanne several times, saying that they are having a sleep-over when in fact Joanne has been staying with her boyfriend. Amanda no longer wants to lie and feels used."
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Amanda should handle this situation? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseAmandaJoanne1} onChange={e => updateField('caseAmandaJoanne1', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Joanne will react? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseAmandaJoanne2} onChange={e => updateField('caseAmandaJoanne2', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm text-purple-700">What if Joanne told Amanda that her family would kick her out of the house if they found out? Does this change how Amanda handles it?</label>
                                            <AutoExpandingTextarea value={formData.caseAmandaJoanne3} onChange={e => updateField('caseAmandaJoanne3', e.target.value)} placeholder="..." />
                                        </div>
                                    </div>

                                    {/* Case 3 */}
                                    <div className="clay-card p-8 space-y-6 border-l-8 border-l-emerald-400">
                                        <h3 className="font-black text-2xl text-emerald-900 mb-4">Case 3: Maya & Leticia</h3>
                                        <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 italic font-medium">
                                            "Maya and Leticia consider themselves best friends. Recently Maya noticed Leticia losing a lot of weight, passing on food, and calling herself 'fat'. Maya is very concerned but not sure how Leticia will react if she raises the subject."
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Maya should handle this situation? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseMayaLeticia1} onChange={e => updateField('caseMayaLeticia1', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm">How do you think Leticia will react? Why?</label>
                                            <AutoExpandingTextarea value={formData.caseMayaLeticia2} onChange={e => updateField('caseMayaLeticia2', e.target.value)} placeholder="..." />
                                        </div>
                                        <div>
                                            <label className="block font-bold mb-2 text-sm text-emerald-700">What if Leticia told Maya that her boyfriend said he would dump her if she didn't lose weight? Does this change how Maya handles it?</label>
                                            <AutoExpandingTextarea value={formData.caseMayaLeticia3} onChange={e => updateField('caseMayaLeticia3', e.target.value)} placeholder="..." />
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* TAB: FINISH */}
                            {activeTab === 'finish' && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <div className="text-center mb-10">
                                        <div className="inline-block p-4 bg-emerald-100 rounded-3xl mb-4 text-emerald-500">
                                            <i className="fa-solid fa-flag-checkered text-5xl"></i>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Final Review</h2>
                                        <p className="text-slate-500 mt-2 text-lg">Make sure all sections are complete before downloading your workbook.</p>
                                    </div>

                                    <div className="clay-card p-8 mb-8 bg-slate-50 border-slate-200">
                                        <h3 className="font-black text-xl mb-4">Module Completion Checklist</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {SECTIONS.filter(s => s.id !== 'finish' && s.id !== 'intro').map(sec => {
                                                const { completed, total, isDone } = calcProgress(sec.id);
                                                return (
                                                    <div key={sec.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${isDone ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-slate-200 opacity-70'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${isDone ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                                {isDone ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-ellipsis"></i>}
                                                            </div>
                                                            <span className="font-bold text-slate-700">{sec.title}</span>
                                                        </div>
                                                        <span className={`text-sm font-bold ${isDone ? 'text-emerald-500' : 'text-slate-400'}`}>{completed}/{total}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Image Upload Area for Supplementary evidence if needed */}
                                    <div className="clay-card p-8 mb-8">
                                        <h3 className="font-black text-xl mb-2"><i className="fa-solid fa-camera text-violet-500 mr-2"></i> Supplementary Evidence (Optional)</h3>
                                        <p className="text-sm text-slate-500">If your teacher asked you to draw, map, or create something physical for this module, upload a photo of it here. It will be compressed automatically.</p>
                                        <ImageUploader image={formData.supplementaryImage} onImageChange={(img) => updateField('supplementaryImage', img)} />
                                    </div>

                                    <div className="clay-card p-8 text-center bg-violet-600 border-violet-700 text-white shadow-[0_8px_0_0_#4c1d95]">
                                        <h3 className="font-black text-2xl mb-4">Ready to Submit?</h3>
                                        <p className="text-violet-200 mb-8 max-w-lg mx-auto">This will generate a text file with all of your responses, formatted cleanly for your teacher to grade. Upload this file to your LMS drop box.</p>
                                        
                                        <button 
                                            onClick={generateTeacherExport}
                                            className="bg-white text-violet-600 hover:bg-slate-50 font-black py-4 px-8 rounded-2xl shadow-[0_6px_0_0_#e2e8f0] active:translate-y-[6px] active:shadow-none transition-all text-xl"
                                        >
                                            <i className="fa-solid fa-file-export mr-2"></i> Export Teacher View (.txt)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* NEXT BUTTON (Floating Bottom Right within container) */}
                            {activeTab !== 'finish' && (
                                <div className="mt-12 flex justify-end">
                                    <button 
                                        onClick={nextTab}
                                        className="clay-btn py-3 px-8 text-lg flex items-center gap-2"
                                    >
                                        Next Section <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
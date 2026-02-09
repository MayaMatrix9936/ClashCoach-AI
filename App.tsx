import React, { useState, useRef, useEffect } from 'react';
import { Target, Sword, Crosshair, ChevronRight, RefreshCw, Cpu, MessageSquare, PenTool, Sun, Moon } from 'lucide-react';
import FileUpload from './components/FileUpload';
import PlanDisplay from './components/PlanDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import { generateAttackPlan, validateGoalWithGemini, validateImageWithGemini } from './services/geminiService';
import { GoalType, AnalysisStatus, AttackPlanResponse } from './types';

const App: React.FC = () => {
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [armyFile, setArmyFile] = useState<File | null>(null);
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [goal, setGoal] = useState<string>('Three Star / Destruction');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AttackPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [armyImageError, setArmyImageError] = useState<string | null>(null);
  const [baseImageError, setBaseImageError] = useState<string | null>(null);
  const [armyImageWarning, setArmyImageWarning] = useState<string | null>(null);
  const [baseImageWarning, setBaseImageWarning] = useState<string | null>(null);
  const [confirmCocImages, setConfirmCocImages] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalValidationStatus, setGoalValidationStatus] = useState<'idle' | 'validating'>('idle');
  const goalValidationRequestId = useRef(0);
  const [armyImageValidationStatus, setArmyImageValidationStatus] = useState<'idle' | 'validating'>('idle');
  const [baseImageValidationStatus, setBaseImageValidationStatus] = useState<'idle' | 'validating'>('idle');
  const armyImageValidationRequestId = useRef(0);
  const baseImageValidationRequestId = useRef(0);
  const [resetCounter, setResetCounter] = useState(0);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  const predefinedGoals: GoalType[] = [
    'Three Star / Destruction',
    'Loot Resources',
    'Trophy Push',
    'Safe Two Star'
  ];

  useEffect(() => {
    if (!baseFile) {
      setBaseImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(baseFile);
    setBaseImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [baseFile]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const isAdultContent = (text: string) => {
    const lower = text.toLowerCase();
    const adultKeywords = [
      'porn', 'sex', 'nude', 'nudes', 'nsfw', 'xxx', 'adult',
      'erotic', 'fetish', 'boobs', 'dick', 'vagina', 'blowjob',
      'onlyfans', 'hentai'
    ];
    return adultKeywords.some((keyword) => lower.includes(keyword));
  };

  const validateGoal = (value: string) => {
    if (!value.trim()) {
      return "Please specify a goal for the attack.";
    }
    if (isAdultContent(value)) {
      return "This request isn't allowed. Please enter a Clash of Clans-related request, check your spelling, and try again.";
    }
    return null;
  };

  useEffect(() => {
    const localError = validateGoal(goal);
    if (localError) {
      setGoalError(localError);
      setGoalValidationStatus('idle');
      return;
    }

    const currentRequestId = ++goalValidationRequestId.current;
    setGoalValidationStatus('validating');
    const timeoutId = window.setTimeout(async () => {
      try {
        const { isClashRelated: geminiOk } = await validateGoalWithGemini(goal);
        if (goalValidationRequestId.current !== currentRequestId) return;
        if (!geminiOk) {
          setGoalError("This request isn't allowed. Please enter a Clash of Clans-related request, check your spelling, and try again.");
        } else {
          setGoalError(null);
        }
      } catch (validationError) {
        if (goalValidationRequestId.current !== currentRequestId) return;
        console.error('Goal validation failed:', validationError);
        setGoalError("Couldn't validate the goal right now. Please try again.");
      } finally {
        if (goalValidationRequestId.current === currentRequestId) {
          setGoalValidationStatus('idle');
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [goal]);

  const validateImageFile = async (file: File, label: string) => {
    if (!file.type.startsWith('image/')) {
      return { error: `${label} must be an image file.`, warning: null };
    }
    return { error: null, warning: null };
  };

  const handleArmySelect = async (file: File | null) => {
    setArmyFile(file);
    setConfirmCocImages(false);
    setError(null);
    setStatus(AnalysisStatus.IDLE);
    setArmyImageValidationStatus('idle');
    if (!file) {
      setArmyImageError(null);
      setArmyImageWarning(null);
      return;
    }
    const { error, warning } = await validateImageFile(file, 'Army image');
    setArmyImageError(error);
    setArmyImageWarning(warning);
    if (error) return;
    if (!warning) {
      const currentId = ++armyImageValidationRequestId.current;
      setArmyImageValidationStatus('validating');
      try {
        const { isClashRelated, reason } = await validateImageWithGemini(file, 'army');
        if (armyImageValidationRequestId.current !== currentId) return;
        if (!isClashRelated) {
          setArmyImageWarning(`Army image doesn't look like a Clash of Clans screenshot. ${reason}`);
        } else {
          setArmyImageWarning(null);
        }
      } catch (validationError) {
        if (armyImageValidationRequestId.current !== currentId) return;
        console.error('Army image validation failed:', validationError);
        setArmyImageWarning("Couldn't validate the army image right now. Please confirm it's a CoC screenshot.");
      } finally {
        if (armyImageValidationRequestId.current === currentId) {
          setArmyImageValidationStatus('idle');
        }
      }
    }
  };

  const handleBaseSelect = async (file: File | null) => {
    setBaseFile(file);
    setConfirmCocImages(false);
    setError(null);
    setStatus(AnalysisStatus.IDLE);
    setBaseImageValidationStatus('idle');
    if (!file) {
      setBaseImageError(null);
      setBaseImageWarning(null);
      return;
    }
    const { error, warning } = await validateImageFile(file, 'Base image');
    setBaseImageError(error);
    setBaseImageWarning(warning);
    if (error) return;
    if (!warning) {
      const currentId = ++baseImageValidationRequestId.current;
      setBaseImageValidationStatus('validating');
      try {
        const { isClashRelated, reason } = await validateImageWithGemini(file, 'base');
        if (baseImageValidationRequestId.current !== currentId) return;
        if (!isClashRelated) {
          setBaseImageWarning(`Base image doesn't look like a Clash of Clans screenshot. ${reason}`);
        } else {
          setBaseImageWarning(null);
        }
      } catch (validationError) {
        if (baseImageValidationRequestId.current !== currentId) return;
        console.error('Base image validation failed:', validationError);
        setBaseImageWarning("Couldn't validate the base image right now. Please confirm it's a CoC screenshot.");
      } finally {
        if (baseImageValidationRequestId.current === currentId) {
          setBaseImageValidationStatus('idle');
        }
      }
    }
  };


  const handleGenerate = async () => {
    if (armyImageError || baseImageError) {
      setError(armyImageError || baseImageError || 'Please fix the image issues and try again.');
      setStatus(AnalysisStatus.ERROR);
      return;
    }
    if (!armyFile || !baseFile) {
      setError("Please upload both an Army image and an Enemy Base image.");
      return;
    }
    const goalValidation = validateGoal(goal);
    if (goalValidation) {
      setGoalError(goalValidation);
      setError(goalValidation);
      setStatus(AnalysisStatus.ERROR);
      return;
    }
    if (goalValidationStatus === 'validating') {
      setError("Please wait until the goal is validated.");
      setStatus(AnalysisStatus.ERROR);
      return;
    }
    if (goalError) {
      setError(goalError);
      setStatus(AnalysisStatus.ERROR);
      return;
    }
    if ((armyImageWarning || baseImageWarning) && !confirmCocImages) {
      setError("Please confirm the uploaded images are Clash of Clans screenshots.");
      setStatus(AnalysisStatus.ERROR);
      return;
    }

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    try {
      const response = await generateAttackPlan(
        {
          armyImage: armyFile,
          baseImage: baseFile,
          goal,
        },
        { onProgress: setLoadingStep }
      );
      setResult(response);
      setStatus(AnalysisStatus.SUCCESS);
      // Scroll to results after a short delay to allow render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const resetApp = () => {
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAnalyzing = status === AnalysisStatus.ANALYZING;
  const isLightTheme = theme === 'light';
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const copyButtonLabel = copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy plan';

  const formatPlanForCopy = (plan: AttackPlanResponse, planGoal: string) => {
    const phases = plan.steps
      .map((step, index) => {
        const troops = step.troopsUsed.join(', ');
        return [
          `Phase ${index + 1}: ${step.phaseName}`,
          `- Troops: ${troops}`,
          `- Instructions: ${step.description}`,
        ].join('\n');
      })
      .join('\n\n');

    return [
      'ClashCoach AI Plan',
      `Goal: ${planGoal}`,
      `Army Analysis: ${plan.armyAnalysis}`,
      `Optional Army Improvements: ${plan.armyAdjustments}`,
      `Base Weaknesses: ${plan.baseWeaknesses}`,
      `Critical Advice: ${plan.criticalAdvice}`,
      '',
      phases,
    ].join('\n');
  };

  const handleCopyPlan = async () => {
    if (!result) return;
    try {
      const text = formatPlanForCopy(result, goal);
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-gaming-accent/30">
      {/* Loading Overlay */}
      {isAnalyzing && <LoadingOverlay currentStep={loadingStep} />}

      {/* Header */}
      <header className="border-b border-gaming-700 bg-gaming-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gaming-accent/10 rounded-lg">
                <Crosshair className="text-gaming-accent w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-wider text-white">CLASHCOACH <span className="text-gaming-accent">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-400">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 hover:text-white transition-colors"
              aria-label="Toggle light and dark mode"
            >
              {isLightTheme ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isLightTheme ? 'Light' : 'Dark'}</span>
            </button>
            <div className="w-px h-4 bg-gaming-700"></div>
            <span className="text-gaming-accent flex items-center gap-1"><Cpu size={14} /> v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Intro Section */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gaming-accent to-emerald-600">Strategy</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Upload your army and enemy base to generate AI-optimized tactical plans tailored to your specific goals.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <FileUpload 
              key={`army-upload-${resetCounter}`}
              id="army-upload"
              label="1. Upload Army Composition" 
              onFileSelect={handleArmySelect}
              sampleUrl="/samples/army.png"
              sampleFilename="sample-army.png"
              sampleLabel="Use sample army photo"
            />
            {armyImageError && (
              <p className="mt-2 text-xs text-red-300">{armyImageError}</p>
            )}
            {armyImageWarning && (
              <p className="mt-2 text-xs text-yellow-200">{armyImageWarning}</p>
            )}
            {armyImageValidationStatus === 'validating' && (
              <p className="mt-2 text-xs text-gray-400">Validating army image with Gemini...</p>
            )}
          </div>
          <div>
            <FileUpload 
              key={`base-upload-${resetCounter}`}
              id="base-upload"
              label="2. Upload Enemy Base" 
              onFileSelect={handleBaseSelect}
              sampleUrl="/samples/base.png"
              sampleFilename="sample-base.png"
              sampleLabel="Use sample base photo"
            />
            {baseImageError && (
              <p className="mt-2 text-xs text-red-300">{baseImageError}</p>
            )}
            {baseImageWarning && (
              <p className="mt-2 text-xs text-yellow-200">{baseImageWarning}</p>
            )}
            {baseImageValidationStatus === 'validating' && (
              <p className="mt-2 text-xs text-gray-400">Validating base image with Gemini...</p>
            )}
          </div>
        </div>
        {(armyImageWarning || baseImageWarning) && (
          <label className="mb-10 flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={confirmCocImages}
              onChange={(e) => setConfirmCocImages(e.target.checked)}
            />
            I confirm these are Clash of Clans screenshots.
          </label>
        )}

        {/* Configuration Section */}
        <div className="bg-gaming-800/50 rounded-xl p-6 border border-gaming-700 mb-10">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3 font-display uppercase tracking-wider">
                <PenTool size={16} className="text-gaming-accent" />
                3. Define Tactical Goal
            </label>
            
            {/* Quick Select Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {predefinedGoals.map((type) => (
                <button
                  key={type}
                  onClick={() => setGoal(type)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                    ${goal === type 
                      ? 'bg-gaming-accent/20 border-gaming-accent text-gaming-accent' 
                      : 'bg-gaming-900 border-gaming-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Custom Input Area */}
            <div className="relative group">
                <textarea
                    value={goal}
                    onChange={(e) => {
                      const nextGoal = e.target.value;
                      setGoal(nextGoal);
                      setGoalError(validateGoal(nextGoal));
                      setError(null);
                    }}
                    placeholder="Describe your goal (e.g., 'Get 3 stars but avoid the Eagle Artillery' or 'Farm Dark Elixir only')..."
                    className="w-full bg-gaming-900/50 border border-gaming-700 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gaming-accent focus:ring-1 focus:ring-gaming-accent/50 transition-all duration-300 min-h-[100px] resize-y"
                />
                <div className="absolute bottom-3 right-3 text-gaming-700 group-focus-within:text-gaming-accent transition-colors">
                    <MessageSquare size={16} />
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Tip: You can select a preset above and then edit the text to add specific constraints (e.g., "My King is upgrading").
            </p>
            {goalError && (
              <p className="mt-2 text-xs text-red-300">{goalError}</p>
            )}
            {goalValidationStatus === 'validating' && (
              <p className="mt-2 text-xs text-gray-400">Validating goal with Gemini...</p>
            )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center mb-16">
        {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}
            
            <button
                onClick={handleGenerate}
                disabled={isAnalyzing || goalValidationStatus === 'validating' || armyImageValidationStatus === 'validating' || baseImageValidationStatus === 'validating' || !!goalError || !armyFile || !baseFile || !!armyImageError || !!baseImageError || ((armyImageWarning || baseImageWarning) && !confirmCocImages)}
                className={`
                    group relative px-8 py-4 rounded-full font-bold text-lg font-display tracking-widest uppercase overflow-hidden transition-all duration-300
                    ${isAnalyzing || goalValidationStatus === 'validating' || armyImageValidationStatus === 'validating' || baseImageValidationStatus === 'validating' || !!goalError || !armyFile || !baseFile || !!armyImageError || !!baseImageError || ((armyImageWarning || baseImageWarning) && !confirmCocImages)
                        ? 'bg-gaming-800 text-gray-600 cursor-not-allowed border border-gaming-700'
                        : 'bg-gaming-accent text-gaming-900 hover:shadow-[0_0_30px_rgba(0,220,130,0.4)] hover:scale-105'
                    }
                `}
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                <span className="flex items-center gap-3">
                    {isAnalyzing ? (
                        <>
                            <RefreshCw className="animate-spin" /> Analyzing...
                        </>
                    ) : (
                        <>
                            <Sword className={!armyFile || !baseFile ? "" : "animate-pulse"} /> Generate Attack Plan
                        </>
                    )}
                </span>
            </button>
            {status === AnalysisStatus.ERROR && armyFile && baseFile && (
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Retry analysis
              </button>
            )}
        </div>

        {/* Results Section */}
        {status === AnalysisStatus.SUCCESS && result && (
            <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <Target className="text-gaming-accent" />
                        Tactical Analysis Result
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCopyPlan}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-gaming-accent/40 text-gaming-accent bg-gaming-accent/10 hover:bg-gaming-accent/20 hover:text-white transition-all duration-200"
                      >
                        {copyButtonLabel}
                      </button>
                      <button 
                          onClick={resetApp}
                          className="text-sm text-gray-400 hover:text-white flex items-center gap-1 hover:underline"
                      >
                          Start New Analysis <ChevronRight size={14} />
                      </button>
                    </div>
                </div>
                
                <PlanDisplay response={result} baseImageUrl={baseImageUrl} goal={goal} />
            </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-10 border-t border-gaming-800 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} ClashCoach AI. Optimized for strategic dominance.</p>
          <p className="mt-2 text-xs">AI recommendations should be used as guidance. Results may vary.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Search, Shield, Crosshair, FileText, Terminal, BrainCircuit } from 'lucide-react';

const ANALYSIS_STEPS = [
  { label: "Preparing images...", icon: Search },
  { label: "Analyzing with AI...", icon: Shield },
  { label: "Building step-by-step plan...", icon: FileText },
  { label: "Formatting instructions...", icon: Crosshair },
  { label: "Finalizing results...", icon: Crosshair },
];

const TERMINAL_LOGS = [
  "Scanning Town Hall district...",
  "Locating Eagle Artillery...",
  "Mapping Inferno Tower coverage...",
  "Estimating Clan Castle pull range...",
  "Checking X-Bow set modes...",
  "Reading wall layer strength...",
  "Counting Wizard Towers...",
  "Reviewing air defense positions...",
  "Parsing hero availability...",
  "Estimating spell value zones...",
  "Detecting trap corridors...",
  "Simulating funnel integrity...",
  "Evaluating anti‑2 star layout...",
  "Checking scattershot angles...",
  "Measuring core DPS density..."
];

interface LoadingOverlayProps {
  currentStep: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ currentStep }) => {
  const [logs, setLogs] = useState<string[]>(["> System initialized.", "> Reading image buffers..."]);

  // Handle terminal logs simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = TERMINAL_LOGS[Math.floor(Math.random() * TERMINAL_LOGS.length)];
        const newLogs = [...prev, `> ${nextLog}`];
        if (newLogs.length > 5) return newLogs.slice(newLogs.length - 5);
        return newLogs;
      });
  }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-gaming-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-gaming-800 border border-gaming-700 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gaming-accent to-transparent opacity-70"></div>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gaming-700/50 flex items-center gap-4 bg-gaming-900/50">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gaming-accent/20 blur-lg rounded-full animate-pulse"></div>
            <div className="relative w-12 h-12 bg-gaming-800 rounded-xl border border-gaming-700 flex items-center justify-center">
               <BrainCircuit className="text-gaming-accent animate-pulse" size={24} />
            </div>
            {/* Spinning ring around logo */}
            <div className="absolute -inset-1 border border-gaming-accent/30 rounded-xl animate-[spin_4s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wider">AI TACTICAL CORE</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gaming-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gaming-accent"></span>
              </span>
              <span className="text-xs font-mono text-gaming-accent/80 uppercase">Processing Live Data</span>
            </div>
          </div>
        </div>

        {/* Reasoning Steps List */}
        <div className="p-6 space-y-5 bg-gaming-800/80">
          {ANALYSIS_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isPending = index > currentStep;

            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}
              >
                {/* Icon Box */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300 flex-shrink-0
                  ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : ''}
                  ${isActive ? 'bg-gaming-accent/10 border-gaming-accent text-gaming-accent shadow-[0_0_15px_rgba(0,220,130,0.2)]' : ''}
                  ${isPending ? 'bg-gaming-700/50 border-gaming-600 text-gray-500' : ''}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} />
                  ) : isActive ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <step.icon size={18} />
                  )}
                </div>

                {/* Text Info */}
                <div className="flex-grow">
                  <p className={`text-sm font-semibold tracking-wide transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-gaming-accent font-mono mt-0.5 animate-pulse">
                      Processing...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal / Logs Footer */}
        <div className="bg-black/40 border-t border-gaming-700 p-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-gray-800 pb-1">
            <Terminal size={12} />
            <span className="uppercase tracking-widest text-[10px]">System Log</span>
          </div>
          <div className="space-y-1 h-20 overflow-hidden flex flex-col justify-end">
            {logs.map((log, i) => (
              <p key={i} className="text-gray-400 truncate animate-in slide-in-from-bottom-2 fade-in duration-300">
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
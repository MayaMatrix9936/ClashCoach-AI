import React from 'react';
import { Shield, Target, AlertTriangle, Swords, Crosshair } from 'lucide-react';
import { AttackPlanResponse } from '../types';

interface PlanDisplayProps {
  response: AttackPlanResponse;
  baseImageUrl: string | null;
  goal: string;
}

const EDGE_INSET = 28;
const DIAGONAL_INSET = 35;

const arrowPositions = {
  top: { top: `${EDGE_INSET}%`, left: '50%', rotate: 0 },
  right: { top: '50%', left: `${100 - EDGE_INSET}%`, rotate: -90 },
  bottom: { top: `${100 - EDGE_INSET}%`, left: '50%', rotate: 180 },
  left: { top: '50%', left: `${EDGE_INSET}%`, rotate: 90 },
  'top-right': { top: `${DIAGONAL_INSET}%`, left: `${100 - DIAGONAL_INSET}%`, rotate: -45 },
  'bottom-right': { top: `${100 - DIAGONAL_INSET}%`, left: `${100 - DIAGONAL_INSET}%`, rotate: -135 },
  'bottom-left': { top: `${100 - DIAGONAL_INSET}%`, left: `${DIAGONAL_INSET}%`, rotate: 135 },
  'top-left': { top: `${DIAGONAL_INSET}%`, left: `${DIAGONAL_INSET}%`, rotate: 45 },
} as const;

type ArrowDirection = keyof typeof arrowPositions;

const parseDirections = (text: string): ArrowDirection[] => {
  const lower = text
    .toLowerCase()
    .replace(/\u2019/g, "'") // normalize curly apostrophes
    .replace(/\u00a0/g, ' ') // normalize non-breaking spaces
    .replace(/\s+/g, ' ');
  const directions = new Set<ArrowDirection>();

  const clockMatches = Array.from(
    lower.matchAll(/(\b1[0-2]|\b[1-9])\s*o?\s*(?:['’]?\s*clock|clock|clcok)\b/g)
  );
  for (const match of clockMatches) {
    const hour = parseInt(match[1], 10);
    if ([12].includes(hour)) directions.add('top');
    else if ([3].includes(hour)) directions.add('right');
    else if ([6].includes(hour)) directions.add('bottom');
    else if ([9].includes(hour)) directions.add('left');
    else if ([1, 2].includes(hour)) directions.add('top-right');
    else if ([4, 5].includes(hour)) directions.add('bottom-right');
    else if ([7, 8].includes(hour)) directions.add('bottom-left');
    else if ([10, 11].includes(hour)) directions.add('top-left');
  }

  // Parse formats like "7:30" or "7.30"
  const timeMatches = Array.from(lower.matchAll(/(\b1[0-2]|\b[1-9])\s*[:.]\s*(\d{2})\b/g));
  for (const match of timeMatches) {
    const hour = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const halfHour = minutes >= 15 && minutes <= 45;
    if (hour === 12) directions.add(halfHour ? 'top-right' : 'top');
    else if (hour === 3) directions.add(halfHour ? 'bottom-right' : 'right');
    else if (hour === 6) directions.add(halfHour ? 'bottom-left' : 'bottom');
    else if (hour === 9) directions.add(halfHour ? 'top-left' : 'left');
    else if ([1, 2].includes(hour)) directions.add('top-right');
    else if ([4, 5].includes(hour)) directions.add('bottom-right');
    else if ([7, 8].includes(hour)) directions.add('bottom-left');
    else if ([10, 11].includes(hour)) directions.add('top-left');
  }

  // If explicit clock positions are present, prefer those only.
  if (directions.size > 0) {
    return Array.from(directions);
  }

  // Fall back to explicit cardinal directions, including parenthetical forms.
  if (/\bwest\b|\(west\b/.test(lower)) directions.add('left');
  if (/\beast\b|\(east\b/.test(lower)) directions.add('right');
  if (/\bnorth\b|\(north\b/.test(lower)) directions.add('top');
  if (/\bsouth\b|\(south\b/.test(lower)) directions.add('bottom');

  if (/\bnorth(?:west)?\b|\bnorth\s+west\b|\bnorth\s+east\b|\btop\b|\bupper\b/.test(lower)) {
    if (/\bnorthwest\b|\bnorth\s+west\b|\btop left\b/.test(lower)) directions.add('top-left');
    else if (/\bnortheast\b|\bnorth\s+east\b|\btop right\b/.test(lower)) directions.add('top-right');
    else directions.add('top');
  }
  if (/\bsouth(?:west)?\b|\bsouth\s+west\b|\bsouth\s+east\b|\bbottom\b|\blower\b/.test(lower)) {
    if (/\bsouthwest\b|\bsouth\s+west\b|\bbottom left\b/.test(lower)) directions.add('bottom-left');
    else if (/\bsoutheast\b|\bsouth\s+east\b|\bbottom right\b/.test(lower)) directions.add('bottom-right');
    else directions.add('bottom');
  }
  if (/\beast\b|\bright\b/.test(lower)) directions.add('right');
  if (/\bwest\b|\bleft\b/.test(lower)) directions.add('left');

  return Array.from(directions);
};

const ArrowIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3v11"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      paintOrder="stroke fill"
      strokeMiterlimit="1"
      style={{ filter: 'drop-shadow(0 0 0.75px rgba(0,0,0,0.9))' }}
    />
    <path
      d="M6 12l6 9 6-9"
      fill="white"
      stroke="black"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

const PlanDisplay: React.FC<PlanDisplayProps> = ({ response, baseImageUrl, goal }) => {
  // Helper to render markdown-like simple text
  const SimpleText = ({ text }: { text: string }) => (
    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{text}</p>
  );

  return (
    <div className="space-y-8">
      
      {/* Goal Focus */}
      <div className="bg-gaming-800/70 border border-gaming-700 rounded-xl px-5 py-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-gaming-accent font-semibold">Goal Focus</span>
        <span className="text-sm text-gray-200">{goal}</span>
      </div>

      {/* 1. Analysis Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Army Analysis */}
        <div className="bg-gaming-800/80 border border-gaming-700 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-display font-bold text-white">Army Analysis</h3>
          </div>
          <SimpleText text={response.armyAnalysis} />
        </div>

        {/* Base Weaknesses */}
        <div className="bg-gaming-800/80 border border-gaming-700 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-display font-bold text-white">Base Weaknesses</h3>
          </div>
          <SimpleText text={response.baseWeaknesses} />
        </div>

        {/* Optional Army Improvements */}
        <div className="bg-gaming-800/80 border border-gaming-700 p-6 rounded-2xl relative overflow-hidden group hover:border-gaming-accent/60 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gaming-accent/10 rounded-lg text-gaming-accent">
              <Swords size={24} />
            </div>
            <h3 className="text-xl font-display font-bold text-white">Optional Army Improvements</h3>
          </div>
          <SimpleText text={response.armyAdjustments} />
        </div>
      </div>

      {/* 2. Step-by-Step Attack Plan */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
           <Swords className="text-gaming-accent w-6 h-6" />
           <h2 className="text-2xl font-display font-bold text-white">Execution Phases</h2>
        </div>

        {/* Connector Line for Timeline Effect */}
        <div className="absolute left-[27px] top-12 bottom-12 w-0.5 bg-gaming-700 hidden md:block"></div>

        <div className="space-y-12">
          {response.steps.map((step, index) => (
            <div key={index} className="relative flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
              
              {/* Step Number Bubble */}
              <div className="hidden md:flex flex-shrink-0 w-14 h-14 bg-gaming-900 border-2 border-gaming-accent rounded-full items-center justify-center z-10 font-display font-bold text-xl text-gaming-accent shadow-[0_0_15px_rgba(0,220,130,0.3)]">
                {index + 1}
              </div>

              {/* Content Card */}
              <div className="flex-grow bg-gaming-800 border border-gaming-700 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gaming-900/50 px-6 py-4 border-b border-gaming-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white font-display tracking-wide uppercase flex items-center gap-2">
                     <span className="md:hidden text-gaming-accent mr-2">#{index + 1}</span>
                     {step.phaseName}
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                   {/* Step Description */}
                   <div className="p-6 flex flex-col justify-between">
                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tactical Instructions</h4>
                            <p className="text-gray-200 leading-relaxed text-sm md:text-base">{step.description}</p>
                        </div>
                        
                        {step.troopsUsed.length > 0 && (
                            <div className="bg-gaming-900/30 rounded-lg p-3 border border-gaming-700/50">
                                <h4 className="text-xs font-semibold text-gaming-accent uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Crosshair size={12} /> Deploying in this phase
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {step.troopsUsed.map((troop, i) => (
                                        <span key={i} className="px-2 py-1 bg-gaming-700 border border-gaming-600 rounded text-xs text-white font-medium">
                                            {troop}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Step Visual */}
                   <div className="relative bg-black/40 min-h-[300px] border-t lg:border-t-0 lg:border-l border-gaming-700 overflow-hidden">
                     {baseImageUrl ? (
                       <div className="relative w-full h-full">
                         <img
                           src={baseImageUrl}
                           alt="Enemy base"
                           className="w-full h-full object-contain bg-gaming-900/50"
                         />
                         <div className="absolute inset-0 z-20 pointer-events-none">
                           {parseDirections(`${step.description} ${step.troopsUsed.join(" ")}`).map((dir) => {
                             const pos = arrowPositions[dir];
                             return (
                               <div
                                 key={`${step.phaseName}-${dir}`}
                                 className="absolute animate-bounce"
                                 style={{
                                   top: pos.top,
                                   left: pos.left,
                                   transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`,
                                   filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.6))',
                                   zIndex: 20,
                                 }}
                               >
                                 <ArrowIcon />
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-6">
                         <span className="text-sm">Base image unavailable</span>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Critical Advice Footer */}
      <div className="mt-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex items-start gap-4">
        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400 shrink-0">
            <AlertTriangle size={24} />
        </div>
        <div>
            <h3 className="text-lg font-bold text-yellow-200 mb-1">Commander's Warning</h3>
            <p className="text-yellow-100/80 leading-relaxed">{response.criticalAdvice}</p>
        </div>
      </div>

    </div>
  );
};

export default PlanDisplay;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameStructure, EquilibriumResult, GameCase } from './types';
import { BUILTIN_CASES } from './constants';
import { ModelingPanel } from './components/ModelingPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { GameTree } from './components/GameTree';
import { KnowledgeSlice } from './components/KnowledgeSlice';
import { Beaker, Settings2, BarChart3, Binary, ChevronRight, Github, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [game, setGame] = useState<GameStructure>(BUILTIN_CASES[0].structure);
  const [selectedEquilibrium, setSelectedEquilibrium] = useState<EquilibriumResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAIReady, setIsAIReady] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);

  const loadCase = (c: GameCase) => {
    setGame(c.structure);
    setSelectedEquilibrium(null);
    setCurrentStepIdx(0);
  };

  const handleEquilibriumSelect = (eq: EquilibriumResult | null) => {
    setSelectedEquilibrium(eq);
    setCurrentStepIdx(0);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg text-ink font-sans">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-sidebar shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-serif font-bold text-xl tracking-tight">
            SIGNAL LAB
            <span className="font-sans font-light opacity-50 ml-2 text-sm">信号博弈实验室</span>
          </div>
        </div>
        <div className="ai-badge">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isAIReady ? "bg-accent animate-pulse" : "bg-muted"
          )} />
          <span className={isAIReady ? "text-ink" : "text-muted"}>
            {isAIReady ? "AI 决策辅助已开启" : "AI 决策辅助未就绪"}
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden">
        {/* Column 1: Modeling */}
        <aside className="border-r border-border bg-sidebar overflow-y-auto p-6 custom-scrollbar">
          <div className="section-title">建模层 (MODELING) <span>Classic Cases</span></div>
          
          <div className="space-y-2 mb-8">
            {BUILTIN_CASES.map((c) => (
              <div
                key={c.id}
                onClick={() => loadCase(c)}
                className={cn(
                  "case-card group",
                  game.name === c.structure.name && "case-card-active"
                )}
              >
                <h4 className={cn(
                  "text-sm font-semibold mb-1 transition-colors",
                  game.name === c.structure.name ? "text-accent" : "text-ink"
                )}>{c.name}</h4>
                <p className="text-xs text-muted line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>

          <ModelingPanel game={game} setGame={setGame} />

          <div className="mt-8 pt-8 border-t border-border">
            <button 
              onClick={() => setShowKnowledge(true)}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-dashed border-border hover:border-accent/40 hover:bg-accent/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors">
                <BookOpen className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
              </div>
              <div>
                <div className="text-xs font-bold">博弈实验室手册</div>
                <p className="text-[10px] text-muted leading-tight mt-1">了解经典信号博弈模型（教育、二手车）</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Column 2: Visualization */}
        <section className="flex flex-col p-10 overflow-y-auto bg-bg relative custom-scrollbar">
          <div className="font-serif italic text-2xl mb-8 text-ink/80">博弈决策树动态推演</div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[700px]">
            <GameTree game={game} equilibrium={selectedEquilibrium || undefined} />
            
            {/* Equilibrium Analysis Module */}
            <div className="mt-12 w-full border-t border-border pt-6">
              <div className="section-title">均衡分析模块 (EQUILIBRIUM ANALYSIS)</div>
              {selectedEquilibrium && selectedEquilibrium.steps ? (
                <div className="space-y-6">
                  {selectedEquilibrium.explanation && (
                    <div className="bg-accent/5 p-4 rounded-xl border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">均衡直觉说明</span>
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed italic">
                        {selectedEquilibrium.explanation}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <input 
                      type="range"
                      min="0"
                      max={selectedEquilibrium.steps.length - 1}
                      step="1"
                      value={currentStepIdx}
                      onChange={(e) => setCurrentStepIdx(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-accent"
                    />
                    <span className="text-[10px] font-bold text-muted uppercase">
                      步骤 {currentStepIdx + 1} / {selectedEquilibrium.steps.length}
                    </span>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-border shadow-sm min-h-[120px] transition-all">
                    <h5 className="text-sm font-bold text-accent mb-3">
                      {selectedEquilibrium.steps[currentStepIdx].title}
                    </h5>
                    <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
                      {selectedEquilibrium.steps[currentStepIdx].content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center bg-white/50 rounded-xl border border-dashed border-border">
                  <p className="text-muted text-xs italic">在右侧选择一个均衡以查看详细求解过程</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 3: Analysis */}
        <aside className="border-l border-border bg-sidebar overflow-y-auto p-6 custom-scrollbar flex flex-col">
          <div className="section-title">分析层 (ANALYSIS)</div>
          <AnalysisPanel 
            game={game} 
            selectedEquilibrium={selectedEquilibrium} 
            setSelectedEquilibrium={handleEquilibriumSelect} 
            onAIStatusChange={setIsAIReady}
          />
        </aside>
      </main>

      <AnimatePresence>
        {showKnowledge && (
          <KnowledgeSlice 
            onClose={() => setShowKnowledge(false)} 
            onLoadCase={(id) => {
              const c = BUILTIN_CASES.find(bc => bc.id === id);
              if (c) loadCase(c);
            }}
            currentCaseId={BUILTIN_CASES.find(bc => bc.structure.name === game.name)?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

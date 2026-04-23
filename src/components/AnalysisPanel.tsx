import React, { useState, useEffect } from 'react';
import { GameStructure, EquilibriumResult, AISettings } from '../types';
import { solveGame } from '../lib/gameEngine';
import { explainEquilibrium, counterfactualAnalysis } from '../services/geminiService';
import { Sparkles, Info, ArrowRight, RotateCcw, CheckCircle2, AlertTriangle, Settings2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AnalysisPanelProps {
  game: GameStructure;
  selectedEquilibrium: EquilibriumResult | null;
  setSelectedEquilibrium: (eq: EquilibriumResult | null) => void;
  onAIStatusChange?: (isReady: boolean) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  game, 
  selectedEquilibrium, 
  setSelectedEquilibrium,
  onAIStatusChange
}) => {
  const [results, setResults] = useState<EquilibriumResult[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [cfInput, setCfInput] = useState('');
  const [cfResult, setCfResult] = useState('');
  const [isCfLoading, setIsCfLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    apiKey: '',
    model: 'gemini-3-flash'
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('ai_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setAiSettings(parsed);
      onAIStatusChange?.(!!parsed.apiKey);
    } else {
      onAIStatusChange?.(false);
    }
  }, []);

  useEffect(() => {
    const solved = solveGame(game);
    setResults(solved);
    if (solved.length > 0) {
      setSelectedEquilibrium(solved[0]);
    } else {
      setSelectedEquilibrium(null);
    }
  }, [game]);

  const saveSettings = (settings: AISettings) => {
    setAiSettings(settings);
    localStorage.setItem('ai_settings', JSON.stringify(settings));
    onAIStatusChange?.(!!settings.apiKey);
    setShowSettings(false);
  };

  const handleExplain = async () => {
    if (results.length === 0) return;
    setIsExplaining(true);
    const text = await explainEquilibrium(game, results, aiSettings);
    setExplanation(text);
    setIsExplaining(false);
  };

  const handleCounterfactual = async () => {
    if (!cfInput.trim()) return;
    setIsCfLoading(true);
    const text = await counterfactualAnalysis(game, cfInput, aiSettings);
    setCfResult(text);
    setIsCfLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Equilibrium List */}
      <section>
        <div className="section-title">完美贝叶斯均衡 (PBE)</div>
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedEquilibrium(res)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all relative group",
                  selectedEquilibrium === res 
                    ? "bg-accent/5 border-accent border-l-4" 
                    : "bg-white border-border text-ink hover:border-accent/30"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-[10px] font-bold text-accent uppercase">{res.type}</div>
                  {res.isValid ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                  )}
                </div>
                <p className="text-xs leading-relaxed">{res.description}</p>
                {!res.isValid && res.validationErrors && (
                  <div className="mt-2 p-2 bg-rose-50 rounded text-[9px] text-rose-600 border border-rose-100">
                    {res.validationErrors[0]}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-bg rounded-lg border border-dashed border-border">
            <Info className="w-6 h-6 text-muted mx-auto mb-2" />
            <p className="text-muted text-[11px]">未发现纯策略均衡。尝试调整参数。</p>
          </div>
        )}
      </section>

      {/* Belief Calculation Mockup */}
      <section>
        <div className="section-title">信念更新过程</div>
        <div className="p-3 bg-bg rounded-lg border border-border font-mono text-[10px] text-muted leading-relaxed">
          Pr(θ|m) = [Pr(m|θ)θ] / [Σ Pr(m|t)θ(t)]<br/><br/>
          观察信号后，接收者根据贝叶斯法则更新对发送者类型的判断。
        </div>
      </section>

      {/* AI Explanation */}
      <div className="ai-insight flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI 策略解释器</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 hover:bg-accent/10 rounded-full transition-colors"
            >
              <Settings2 className="w-3 h-3 text-muted" />
            </button>
            <button
              onClick={handleExplain}
              disabled={isExplaining || results.length === 0}
              className="text-[10px] text-accent font-bold uppercase hover:underline disabled:opacity-50"
            >
              {isExplaining ? '分析中...' : '生成解释'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-xl z-50 p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-ink">AI 模型设置</h4>
                <button onClick={() => setShowSettings(false)}><X className="w-3 h-3 text-muted" /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">API Key</label>
                  <input
                    type="password"
                    value={aiSettings.apiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                    placeholder="输入您的 API Key"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">选择模型</label>
                  <select
                    value={aiSettings.model}
                    onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value as any })}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-accent"
                  >
                    <option value="gemini-3-flash">Gemini 3 Flash</option>
                    <option value="deepseek-r1">DeepSeek R1</option>
                  </select>
                </div>

                <button
                  onClick={() => saveSettings(aiSettings)}
                  className="w-full bg-accent text-white py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  确定选择
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {explanation ? (
          <div className="text-xs text-ink/80 leading-relaxed font-light">
            {explanation}
          </div>
        ) : (
          <p className="text-muted/60 text-[11px] italic font-light">点击“生成解释”获取 AI 对当前均衡的深度剖析。</p>
        )}

        <div className="mt-4 border-t border-accent/10 pt-4">
          <div className="text-[10px] font-bold text-accent uppercase mb-3">反事实分析</div>
          <div className="flex gap-2">
            <input
              value={cfInput}
              onChange={(e) => setCfInput(e.target.value)}
              placeholder="如果改变参数..."
              className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-[11px] text-ink outline-none focus:border-accent/50"
            />
            <button
              onClick={handleCounterfactual}
              disabled={isCfLoading}
              className="bg-accent text-white p-1.5 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {cfResult && (
            <div className="mt-3 p-3 bg-white rounded-lg text-[11px] text-muted leading-relaxed border border-border">
              {cfResult}
            </div>
          )}
        </div>
      </div>

      <button className="btn-primary w-full mt-auto">导出实验报告</button>
    </div>
  );
};

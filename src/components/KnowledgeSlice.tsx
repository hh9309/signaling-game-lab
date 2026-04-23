import React from 'react';
import { motion } from 'motion/react';
import { X, GraduationCap, Car, History, Lightbulb, TrendingUp, Scissors, BookOpen, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

interface KnowledgeSliceProps {
  onClose: () => void;
  onLoadCase: (id: string) => void;
  currentCaseId?: string;
}

export const KnowledgeSlice: React.FC<KnowledgeSliceProps> = ({ onClose, onLoadCase, currentCaseId }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-[100] border-l border-border flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-border flex items-center justify-between bg-bg/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          <h2 className="font-serif italic text-xl">信号博弈知识库</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-accent/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
        {/* Intro */}
        <section className="space-y-4">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Introduction / 概览</div>
          <p className="text-sm text-ink/80 leading-relaxed font-light italic">
            "信息是不对称的——有人知道得更多，有人知道得更少。而信号，则是打破这种沉默的代价。"
          </p>
        </section>

        {/* Case 1: Spence Education Model */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">斯宾塞教育信号模型</h3>
              <div className="text-[10px] text-muted uppercase">Spence Education Signaling</div>
            </div>
          </div>

          <div className="bg-bg rounded-xl p-5 border border-border space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-bold text-muted uppercase mb-1">局中人 / Players</div>
                <div className="text-xs font-medium">求职者 (Sender) / 雇主 (Receiver)</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-muted uppercase mb-1">类型 / Types</div>
                <div className="text-xs font-medium">高能力 (H) / 低能力 (L)</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-[9px] font-bold text-muted uppercase mb-1">核心策略 / Strategies</div>
              <ul className="text-xs space-y-2 text-ink/80">
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span><strong>发送者：</strong>选择教育水平 (e)。高能力者刷学历成本低。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span><strong>接收者：</strong>观察学历，根据对能力的信念设定工资 (w)。</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-[9px] font-bold text-muted uppercase mb-1">画板图对照 / Mapping</div>
              <p className="text-[10px] text-muted italic leading-relaxed mb-3">
                在上方左侧/右侧的“类型世界”中，您可以尝试将 H 设置为高生产力，L 设置为低生产力，通过调整信号成本查看均衡的变化。
              </p>
              <button
                onClick={() => onLoadCase('spence-education')}
                disabled={currentCaseId === 'spence-education'}
                className={cn(
                  "w-full py-2 px-4 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2",
                  currentCaseId === 'spence-education' 
                    ? "bg-bg border border-border text-muted cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent/90 shadow-sm"
                )}
              >
                {currentCaseId === 'spence-education' ? '当前已加载' : '立即加载此模型到实验台'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <History className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">历史背景</div>
                <p className="text-xs text-muted leading-relaxed">
                  迈克尔·斯宾塞 (Michael Spence) 于 1973 年提出。他因此获得了 2001 年诺贝尔经济学奖。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">应用视角</div>
                <p className="text-xs text-muted leading-relaxed">
                  学历不仅是技能的积累，更是一种“筛选”标签，向市场证明你的韧性和学习能力。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">优化方向</div>
                <p className="text-xs text-muted leading-relaxed">
                  减少“学历通胀”，提高教育与实际技能的相关性，降低信号获取的无效成本。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Case 2: Lemon Market (Used Car) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg">柠檬市场 (二手车) 博弈</h3>
              <div className="text-[10px] text-muted uppercase">Market for Lemons</div>
            </div>
          </div>

          <div className="bg-bg rounded-xl p-5 border border-border space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-bold text-muted uppercase mb-1">局中人 / Players</div>
                <div className="text-xs font-medium">卖方 (Sender) / 买方 (Receiver)</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-muted uppercase mb-1">类型 / Types</div>
                <div className="text-xs font-medium">优质车 / 柠檬车 (Lemon)</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-[9px] font-bold text-muted uppercase mb-1">核心策略 / Strategies</div>
              <ul className="text-xs space-y-2 text-ink/80">
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span><strong>发送者：</strong>是否提供保修、第三方鉴定报告 (Signal)。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span><strong>接收者：</strong>根据信号（或无信号）判断车型，决定出价。</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-[9px] font-bold text-muted uppercase mb-1">画板图对照 / Mapping</div>
              <p className="text-[10px] text-muted italic leading-relaxed mb-3">
                对应画板中的左右两边，车主由于拥有“私有信息”（知道车况），在交易前处于决策优势位。
              </p>
              <button
                onClick={() => onLoadCase('lemon-market')}
                disabled={currentCaseId === 'lemon-market'}
                className={cn(
                  "w-full py-2 px-4 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2",
                  currentCaseId === 'lemon-market' 
                    ? "bg-bg border border-border text-muted cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent/90 shadow-sm"
                )}
              >
                {currentCaseId === 'lemon-market' ? '当前已加载' : '立即加载此模型到实验台'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <History className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">历史背景</div>
                <p className="text-xs text-muted leading-relaxed">
                  乔治·阿克罗夫 (George Akerlof) 于 1970 年提出，解释了为什么高质量二手车会被劣质车逐出市场。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">逆向选择</div>
                <p className="text-xs text-muted leading-relaxed">
                  如果缺乏信号，买家只愿按平均价出价，导致白领车辆退出，市场中充斥着“柠檬”。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-accent translate-y-1 shrink-0" />
              <div>
                <div className="text-xs font-bold">治理优化</div>
                <p className="text-xs text-muted leading-relaxed">
                  引入可强制执行的担保法律、标准化的评估系统以及品牌信誉（重复博弈信号）。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-border flex flex-col items-center gap-2">
          <Quote className="w-8 h-8 text-accent opacity-20" />
          <p className="text-[10px] text-muted text-center max-w-[200px]">
            SIGNAL LAB 致力于通过博弈仿真，揭示隐藏在数据背后的理性决策。
          </p>
        </div>
      </div>
    </motion.div>
  );
};

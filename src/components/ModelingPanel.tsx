import React from 'react';
import { GameStructure, GameType, GameSignal, GameAction } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface ModelingPanelProps {
  game: GameStructure;
  setGame: (game: GameStructure) => void;
}

export const ModelingPanel: React.FC<ModelingPanelProps> = ({ game, setGame }) => {
  const updateType = (id: string, field: keyof GameType, value: any) => {
    const newTypes = game.types.map(t => t.id === id ? { ...t, [field]: value } : t);
    setGame({ ...game, types: newTypes });
  };

  const updateSignal = (id: string, field: keyof GameSignal, value: any) => {
    const newSignals = game.signals.map(s => s.id === id ? { ...s, [field]: value } : s);
    setGame({ ...game, signals: newSignals });
  };

  const updatePayoff = (typeId: string, signalId: string, actionId: string, player: 'sender' | 'receiver', value: number) => {
    const newPayoffs = { ...game.payoffs };
    if (!newPayoffs[typeId]) newPayoffs[typeId] = {};
    if (!newPayoffs[typeId][signalId]) newPayoffs[typeId][signalId] = {};
    if (!newPayoffs[typeId][signalId][actionId]) newPayoffs[typeId][signalId][actionId] = { sender: 0, receiver: 0 };
    
    newPayoffs[typeId][signalId][actionId][player] = value;
    setGame({ ...game, payoffs: newPayoffs });
  };

  const totalProb = game.types.reduce((sum, t) => sum + t.probability, 0);
  const isProbValid = Math.abs(totalProb - 1) < 0.001;

  return (
    <div className="space-y-8">
      {/* Manual Configuration */}
      <div className="space-y-6">
        <section>
          <div className="section-title">博弈名称</div>
          <input
            value={game.name}
            onChange={(e) => setGame({ ...game, name: e.target.value })}
            className="w-full p-2 rounded-lg border border-border focus:ring-1 focus:ring-accent outline-none text-xs font-medium bg-white"
          />
        </section>

        <section>
          <div className="section-title">
            参与者类型与概率
            {!isProbValid && (
              <span className="text-rose-500 animate-pulse normal-case font-normal">
                (概率之和需为 1.0，当前: {totalProb.toFixed(2)})
              </span>
            )}
          </div>
          <div className="space-y-3">
            {game.types.map(type => (
              <div key={type.id} className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium text-muted">
                  <span>{type.name} (θ)</span>
                  <span>{(type.probability * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-border rounded-full relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-accent rounded-full" 
                    style={{ width: `${type.probability * 100}%` }}
                  />
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={type.probability}
                    onChange={(e) => updateType(type.id, 'probability', parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Signal Costs */}
        <section>
          <div className="section-title">信号成本 (Cost)</div>
          <div className="space-y-3">
            {game.signals.map(signal => (
              <div key={signal.id} className="bg-white p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-medium text-ink">{signal.name}</span>
                  <span className="text-[10px] font-mono text-accent">-{signal.cost}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={signal.cost}
                  onChange={(e) => updateSignal(signal.id, 'cost', parseInt(e.target.value))}
                  className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-accent"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Payoff Matrix - Simplified for Sidebar */}
        <section>
          <div className="section-title">收益矩阵 (πS, πR)</div>
          <div className="space-y-4">
            {game.types.map(t => (
              <div key={t.id} className="space-y-2">
                <div className="text-[10px] font-bold text-accent uppercase">{t.name}</div>
                <div className="grid grid-cols-1 gap-2">
                  {game.signals.map(s => (
                    <div key={s.id} className="bg-white p-2 rounded-lg border border-border">
                      <div className="text-[10px] text-muted mb-2">{s.name}</div>
                      <div className="flex gap-2">
                        {game.actions.map(a => (
                          <div key={a.id} className="flex-1 flex flex-col gap-1">
                            <div className="text-[9px] text-muted text-center truncate">{a.name}</div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={game.payoffs[t.id]?.[s.id]?.[a.id]?.sender ?? 0}
                                onChange={(e) => updatePayoff(t.id, s.id, a.id, 'sender', parseInt(e.target.value))}
                                className="w-full p-1 text-center font-mono text-[10px] bg-accent/5 text-accent rounded border-none outline-none"
                              />
                              <input
                                type="number"
                                value={game.payoffs[t.id]?.[s.id]?.[a.id]?.receiver ?? 0}
                                onChange={(e) => updatePayoff(t.id, s.id, a.id, 'receiver', parseInt(e.target.value))}
                                className="w-full p-1 text-center font-mono text-[10px] bg-emerald-50 text-emerald-700 rounded border-none outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

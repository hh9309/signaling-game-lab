import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GameStructure, EquilibriumResult } from '../types';
import { cn } from '../lib/utils';

interface GameTreeProps {
  game: GameStructure;
  equilibrium?: EquilibriumResult;
}

export const GameTree: React.FC<GameTreeProps> = ({ game, equilibrium }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 700; // Further increase to accommodate deep trees and legend
    const margin = { top: 120, right: 120, bottom: 100, left: 120 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Legend (Horizontal layout at the bottom, centered)
    const legendWidth = 600;
    const legend = svg.append('g')
      .attr('transform', `translate(${(width - legendWidth) / 2 + 30}, ${height - 50})`);

    const legendData = [
      { color: '#1d4ed8', dash: '0', text: '发送者策略' },
      { color: '#059669', dash: '3,3', text: '接收者策略' },
      { color: '#666666', dash: '4,4', text: '信息集' }
    ];

    legendData.forEach((item, i) => {
      const g_item = legend.append('g').attr('transform', `translate(${i * 200}, 0)`);
      g_item.append('line')
        .attr('x1', 0).attr('y1', 0).attr('x2', 15).attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', item.dash);
      g_item.append('text')
        .attr('x', 20).attr('y', 4)
        .attr('class', 'fill-slate-500 text-[10px] font-bold')
        .text(item.text);
    });

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${margin.top})`);

    // Custom layout for signaling game
    // Level 0: Nature (Root)
    // Level 1: Types (θ1, θ2, ...)
    // Level 2: Signals (m1, m2, ...)
    // Level 3: Actions (a1, a2, ...)

    const levelHeight = 120;
    const typeSpread = 300; // Wider spread for "Two Worlds"
    const signalSpread = 100;
    const actionSpread = 50;

    const nodesData: any[] = [];
    const linksData: any[] = [];

    // Root: Nature
    const rootNode = { id: 'nature', name: 'Nature', x: 0, y: 0, depth: 0 };
    nodesData.push(rootNode);

    game.types.forEach((t, tIdx) => {
      // Type 1 on Left, Type 2 on Right
      const typeX = (tIdx === 0 ? -1 : 1) * (typeSpread / 2);
      const typeY = levelHeight;
      const typeNode = { id: `t-${t.id}`, name: t.name, typeId: t.id, x: typeX, y: typeY, depth: 1 };
      nodesData.push(typeNode);
      linksData.push({ source: rootNode, target: typeNode, type: 'nature', label: `θ=${t.probability.toFixed(2)}` });

      game.signals.forEach((s, sIdx) => {
        // Signals branch out from each type
        const signalX = typeX + (sIdx === 0 ? -1 : 1) * (signalSpread / 2);
        const signalY = levelHeight * 2;
        const signalNode = { id: `t-${t.id}-s-${s.id}`, name: s.name, signalId: s.id, typeId: t.id, x: signalX, y: signalY, depth: 2 };
        nodesData.push(signalNode);
        linksData.push({ source: typeNode, target: signalNode, type: 'signal' });

        game.actions.forEach((a, aIdx) => {
          // Actions branch out from each signal
          const actionX = signalX + (aIdx === 0 ? -1 : 1) * (actionSpread / 2);
          const actionY = levelHeight * 3.2;
          const actionNode = { 
            id: `t-${t.id}-s-${s.id}-a-${a.id}`, 
            name: a.name, 
            actionId: a.id, 
            signalId: s.id, 
            typeId: t.id, 
            x: actionX, 
            y: actionY, 
            depth: 3,
            payoff: game.payoffs[t.id]?.[s.id]?.[a.id]
          };
          nodesData.push(actionNode);
          linksData.push({ source: signalNode, target: actionNode, type: 'action' });
        });
      });
    });

    // Draw Links
    const linkGroup = g.selectAll('.link-group')
      .data(linksData)
      .enter()
      .append('g');

    linkGroup.append('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (!equilibrium) return '#1A1A1A';
        if (d.type === 'nature') return '#1A1A1A';
        if (d.type === 'signal') {
          const prob = equilibrium.senderStrategy[d.source.typeId]?.[d.target.signalId] || 0;
          if (prob > 0.99) return '#2A4BD7'; // Pure (High Blue)
          if (prob > 0.01) return '#6366f1'; // Mixed (Indigo)
        }
        if (d.type === 'action') {
          const prob = equilibrium.receiverStrategy[d.source.signalId]?.[d.target.actionId] || 0;
          if (prob > 0.99) return '#10b981'; // Pure (Green)
          if (prob > 0.01) return '#34d399'; // Mixed (Emerald)
        }
        return '#E5E5E5';
      })
      .attr('stroke-width', (d: any) => {
        if (!equilibrium) return 1.5;
        if (d.type === 'signal') {
          const prob = equilibrium.senderStrategy[d.source.typeId]?.[d.target.signalId] || 0;
          if (prob > 0.01) return 4.5; // Thicker for highlighted
        }
        if (d.type === 'action') {
          const prob = equilibrium.receiverStrategy[d.source.signalId]?.[d.target.actionId] || 0;
          if (prob > 0.01) return 4.5; // Thicker for highlighted
        }
        return 1.2;
      })
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', (d: any) => {
        if (d.type === 'nature') return '4,4';
        if (!equilibrium) return 'none';
        if (d.type === 'signal') {
          const prob = equilibrium.senderStrategy[d.source.typeId]?.[d.target.signalId] || 0;
          if (prob > 0.01 && prob < 0.99) return '6,3'; // Mixed is dashed
        }
        if (d.type === 'action') {
          const prob = equilibrium.receiverStrategy[d.source.signalId]?.[d.target.actionId] || 0;
          if (prob > 0.01 && prob < 0.99) return '6,3'; // Mixed is dashed
        }
        return 'none';
      });

    // Link Labels (Probabilities on branches)
    linkGroup.filter(d => d.type === 'nature')
      .append('text')
      .attr('x', d => (d.source.x + d.target.x) / 2 + (d.target.x < 0 ? -25 : 5))
      .attr('y', d => (d.source.y + d.target.y) / 2)
      .attr('class', 'fill-muted font-mono text-[9px] font-bold')
      .text(d => d.label);

    linkGroup.filter(d => d.type !== 'nature' && equilibrium)
      .append('text')
      .attr('x', d => {
        const midX = (d.source.x + d.target.x) / 2;
        return d.target.x < d.source.x ? midX - 25 : midX + 5;
      })
      .attr('y', d => (d.source.y + d.target.y) / 2 - 8)
      .attr('class', (d: any) => {
        let prob = 0;
        if (d.type === 'signal') prob = equilibrium?.senderStrategy[d.source.typeId]?.[d.target.signalId] || 0;
        if (d.type === 'action') prob = equilibrium?.receiverStrategy[d.source.signalId]?.[d.target.actionId] || 0;
        return cn(
          "font-mono text-[9px] font-bold",
          prob > 0.01 ? (d.type === 'signal' ? 'fill-blue-700' : 'fill-emerald-700') : 'fill-muted/40'
        );
      })
      .text((d: any) => {
        if (d.type === 'signal') {
          const prob = equilibrium.senderStrategy[d.source.typeId]?.[d.target.signalId] || 0;
          return prob > 0.001 ? `p=${prob.toFixed(2)}` : '';
        }
        if (d.type === 'action') {
          const prob = equilibrium.receiverStrategy[d.source.signalId]?.[d.target.actionId] || 0;
          return prob > 0.001 ? `q=${prob.toFixed(2)}` : '';
        }
        return '';
      });

    // Draw Information Sets (Dashed lines connecting nodes where receiver can't distinguish)
    game.signals.forEach(s => {
      const signalNodes = nodesData.filter(n => n.depth === 2 && n.signalId === s.id);
      if (signalNodes.length > 1) {
        // Sort by X to draw correctly
        signalNodes.sort((a, b) => a.x - b.x);
        
        // Draw the connecting dashed line
        g.append('path')
          .attr('d', `M ${signalNodes[0].x} ${signalNodes[0].y} L ${signalNodes[signalNodes.length-1].x} ${signalNodes[signalNodes.length-1].y}`)
          .attr('stroke', '#666666')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('fill', 'none');
        
        // Add "Information Set" label
        g.append('text')
          .attr('x', (signalNodes[0].x + signalNodes[signalNodes.length-1].x) / 2)
          .attr('y', signalNodes[0].y - 8)
          .attr('text-anchor', 'middle')
          .attr('class', 'fill-muted text-[8px] italic font-medium')
          .text(`观察到信号: ${s.name}`);
      }
    });

    // Draw Nodes
    const nodes = g.selectAll('.node')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
      .attr('r', d => d.depth === 0 ? 6 : 5)
      .attr('fill', d => {
        if (d.depth === 0) return '#FFFFFF';
        if (d.signalId && d.depth === 2) return '#2A4BD7';
        if (d.actionId && d.depth === 3) return '#10b981';
        return '#FFFFFF';
      })
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 2);

    // Labels
    nodes.append('text')
      .attr('dy', d => d.depth === 3 ? 25 : -15)
      .attr('text-anchor', 'middle')
      .attr('class', 'font-sans font-bold text-[10px] uppercase tracking-wider fill-ink')
      .text((d: any) => {
        if (d.depth === 0) return '自然 (Nature)';
        return d.name;
      });

    // Payoffs
    nodes.filter(d => d.payoff)
      .append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('class', 'font-mono text-[10px] font-bold fill-ink')
      .text((d: any) => {
        const signal = game.signals.find(s => s.id === d.signalId);
        const adjustedSenderPayoff = d.payoff.sender - (signal?.cost ?? 0);
        return `(${adjustedSenderPayoff}, ${d.payoff.receiver})`;
      });

    // Beliefs
    if (equilibrium) {
      nodes.filter(d => d.signalId && d.depth === 2)
        .append('g')
        .attr('transform', 'translate(0, 25)')
        .each(function(d: any) {
          const signalId = d.signalId;
          const beliefs = equilibrium.beliefs[signalId];
          if (beliefs) {
            const group = d3.select(this);
            const typeEntries = Object.entries(beliefs);
            
            // Only show beliefs at the center of the info set if there are multiple nodes
            const signalNodes = nodesData.filter(n => n.depth === 2 && n.signalId === signalId);
            if (signalNodes.length > 1 && d.id === signalNodes[0].id) {
              const centerX = (signalNodes[1].x - signalNodes[0].x) / 2;
              
              const beliefBox = group.append('g')
                .attr('transform', `translate(${centerX}, 5)`);

              // Add a subtle background for the belief box
              beliefBox.append('rect')
                .attr('x', -45)
                .attr('y', -10)
                .attr('width', 90)
                .attr('height', typeEntries.length * 14 + 5)
                .attr('rx', 4)
                .attr('fill', '#F3F4F6')
                .attr('stroke', '#E5E7EB')
                .attr('stroke-width', 1);

              typeEntries.forEach(([typeId, prob], i) => {
                const type = game.types.find(t => t.id === typeId);
                const probValue = prob as number;
                beliefBox.append('text')
                  .attr('dy', i * 14 + 5)
                  .attr('text-anchor', 'middle')
                  .attr('class', 'fill-accent font-bold text-[9px]')
                  .text(`μ(${type?.name}) = ${probValue.toFixed(2)}`);
              });
            }
          }
        });
    }


  }, [game, equilibrium]);

  return (
    <div className="w-full h-full min-h-[700px] bg-white rounded-2xl border border-dashed border-border relative overflow-hidden flex items-center justify-center"
         style={{ backgroundImage: 'radial-gradient(#E5E5E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 700"
        preserveAspectRatio="xMidYMid meet"
        className="drop-shadow-sm"
      />
    </div>
  );
};

import { GameStructure, EquilibriumResult, Payoff } from '../types';

export function solveGame(game: GameStructure): EquilibriumResult[] {
  const results: EquilibriumResult[] = [];

  const { types, signals, actions, payoffs } = game;

  // 1. Check for Separating Equilibria
  // For 2 types and 2 signals, there are 2 possible separating profiles:
  // (T1->S1, T2->S2) and (T1->S2, T2->S1)
  if (types.length === 2 && signals.length === 2) {
    const separatingProfiles = [
      { [types[0].id]: signals[0].id, [types[1].id]: signals[1].id },
      { [types[0].id]: signals[1].id, [types[1].id]: signals[0].id },
    ];

    for (const profile of separatingProfiles) {
      const result = checkPureStrategy(game, profile);
      if (result) results.push(result);
    }
  }

  // 2. Check for Pooling Equilibria
  // All types choose the same signal
  for (const signal of signals) {
    const profile: { [typeId: string]: string } = {};
    types.forEach(t => profile[t.id] = signal.id);
    const result = checkPureStrategy(game, profile);
    if (result) results.push(result);
  }

  // 3. Check for Hybrid (Mixed) Equilibria
  // For 2x2x2 games, we look for cases where one type mixes
  if (types.length === 2 && signals.length === 2 && actions.length === 2) {
    const hybridResults = solveHybridEquilibria(game);
    results.push(...hybridResults);

    const fullyMixedResults = solveFullyMixedEquilibria(game);
    results.push(...fullyMixedResults);
  }

  // 4. Validate all results
  return results.map(res => validateEquilibrium(game, res));
}

function getSenderPayoff(game: GameStructure, typeId: string, signalId: string, actionId: string): number {
  const basePayoff = game.payoffs[typeId]?.[signalId]?.[actionId]?.sender ?? 0;
  const signal = game.signals.find(s => s.id === signalId);
  return basePayoff - (signal?.cost ?? 0);
}

function validateEquilibrium(game: GameStructure, res: EquilibriumResult): EquilibriumResult {
  const { types, signals, actions, payoffs } = game;
  const errors: string[] = [];

  // 1. Check Sender Incentive Compatibility
  for (const type of types) {
    const signalProbs = res.senderStrategy[type.id];
    let actualExpectedPayoff = 0;
    
    // Calculate actual payoff for this type
    for (const signal of signals) {
      const sProb = signalProbs[signal.id] || 0;
      if (sProb === 0) continue;
      
      for (const action of actions) {
        const aProb = res.receiverStrategy[signal.id][action.id] || 0;
        actualExpectedPayoff += sProb * aProb * getSenderPayoff(game, type.id, signal.id, action.id);
      }
    }

    // Check against all other possible pure signals
    for (const signal of signals) {
      let otherPayoff = 0;
      for (const action of actions) {
        const aProb = res.receiverStrategy[signal.id][action.id] || 0;
        otherPayoff += aProb * getSenderPayoff(game, type.id, signal.id, action.id);
      }
      
      if (otherPayoff > actualExpectedPayoff + 1e-6) {
        errors.push(`${type.name} 类型偏离到 ${signal.name} 可获得更高收益 (${otherPayoff.toFixed(2)} > ${actualExpectedPayoff.toFixed(2)})`);
      }
    }
  }

  // 2. Check Receiver Sequential Rationality
  for (const signal of signals) {
    const actionProbs = res.receiverStrategy[signal.id];
    let actualExpectedPayoff = 0;
    
    for (const action of actions) {
      const aProb = actionProbs[action.id] || 0;
      if (aProb === 0) continue;
      
      for (const type of types) {
        const belief = res.beliefs[signal.id][type.id] || 0;
        actualExpectedPayoff += aProb * belief * payoffs[type.id][signal.id][action.id].receiver;
      }
    }

    // Check against all other possible pure actions
    for (const action of actions) {
      let otherPayoff = 0;
      for (const type of types) {
        const belief = res.beliefs[signal.id][type.id] || 0;
        otherPayoff += belief * payoffs[type.id][signal.id][action.id].receiver;
      }
      
      if (otherPayoff > actualExpectedPayoff + 1e-6) {
        errors.push(`在观察到信号 ${signal.name} 后，接收者偏离到 ${action.name} 可获得更高收益 (${otherPayoff.toFixed(2)} > ${actualExpectedPayoff.toFixed(2)})`);
      }
    }
  }

  // 3. Check Bayesian Consistency
  for (const signal of signals) {
    let probOfSignal = 0;
    for (const type of types) {
      probOfSignal += type.probability * (res.senderStrategy[type.id][signal.id] || 0);
    }

    if (probOfSignal > 1e-6) {
      for (const type of types) {
        const expectedBelief = (type.probability * (res.senderStrategy[type.id][signal.id] || 0)) / probOfSignal;
        const actualBelief = res.beliefs[signal.id][type.id] || 0;
        if (Math.abs(expectedBelief - actualBelief) > 1e-6) {
          errors.push(`信号 ${signal.name} 下的信念不符合贝叶斯法则: μ(${type.name}) 应为 ${expectedBelief.toFixed(2)}，实为 ${actualBelief.toFixed(2)}`);
        }
      }
    }
  }

  return {
    ...res,
    isValid: errors.length === 0,
    validationErrors: errors
  };
}

function solveFullyMixedEquilibria(game: GameStructure): EquilibriumResult[] {
  const { types, signals, actions, payoffs } = game;
  if (types.length !== 2 || signals.length !== 2 || actions.length !== 2) return [];
  const results: EquilibriumResult[] = [];

  // Receiver indifference equations for both signals
  const d_H1 = payoffs[types[0].id][signals[0].id][actions[0].id].receiver - payoffs[types[0].id][signals[0].id][actions[1].id].receiver;
  const d_L1 = payoffs[types[1].id][signals[0].id][actions[0].id].receiver - payoffs[types[1].id][signals[0].id][actions[1].id].receiver;
  const d_H2 = payoffs[types[0].id][signals[1].id][actions[0].id].receiver - payoffs[types[0].id][signals[1].id][actions[1].id].receiver;
  const d_L2 = payoffs[types[1].id][signals[1].id][actions[0].id].receiver - payoffs[types[1].id][signals[1].id][actions[1].id].receiver;

  // System for pH, pL (probs of sending Signal 1):
  // P(H)*d_H1*pH + P(L)*d_L1*pL = 0 (Indifference at S1) - Wait, this is wrong.
  // The receiver must be indifferent at S1, which means:
  // μ(H|S1)*d_H1 + μ(L|S1)*d_L1 = 0 => P(H)*pH*d_H1 + P(L)*pL*d_L1 = 0
  
  const A = types[0].probability * d_H1;
  const B = types[1].probability * d_L1;
  
  // Correct System:
  // 1) P(H)*pH*d_H1 + P(L)*pL*d_L1 = 0
  // 2) P(H)*(1-pH)*d_H2 + P(L)*(1-pL)*d_L2 = 0
  
  // From (1): pL = - (A/B) * pH
  // Substitute into (2):
  // P(H)*d_H2 + P(L)*d_L2 - pH * (P(H)*d_H2 - P(L)*d_L2 * (A/B)) = 0
  
  const term1 = types[0].probability * d_H2 + types[1].probability * d_L2;
  const term2 = types[0].probability * d_H2 - types[1].probability * d_L2 * (A / B);

  if (Math.abs(B) > 1e-6 && Math.abs(term2) > 1e-6) {
    const pH = term1 / term2;
    const pL = -(A / B) * pH;

    if (pH > 0.01 && pH < 0.99 && pL > 0.01 && pL < 0.99) {
      // Now solve for q1, q2 (receiver mixing probs of Action 1 after S1 and S2)
      // Sender indifference for both types
      const vS_H1_diff = getSenderPayoff(game, types[0].id, signals[0].id, actions[0].id) - getSenderPayoff(game, types[0].id, signals[0].id, actions[1].id);
      const vS_H2_diff = getSenderPayoff(game, types[0].id, signals[1].id, actions[0].id) - getSenderPayoff(game, types[0].id, signals[1].id, actions[1].id);
      const vS_L1_diff = getSenderPayoff(game, types[1].id, signals[0].id, actions[0].id) - getSenderPayoff(game, types[1].id, signals[0].id, actions[1].id);
      const vS_L2_diff = getSenderPayoff(game, types[1].id, signals[1].id, actions[0].id) - getSenderPayoff(game, types[1].id, signals[1].id, actions[1].id);
      
      const rhsH = getSenderPayoff(game, types[0].id, signals[1].id, actions[1].id) - getSenderPayoff(game, types[0].id, signals[0].id, actions[1].id);
      const rhsL = getSenderPayoff(game, types[1].id, signals[1].id, actions[1].id) - getSenderPayoff(game, types[1].id, signals[0].id, actions[1].id);

      // Solve:
      // vS_H1_diff * q1 - vS_H2_diff * q2 = rhsH
      // vS_L1_diff * q1 - vS_L2_diff * q2 = rhsL
      
      const detQ = vS_H1_diff * (-vS_L2_diff) - (-vS_H2_diff) * vS_L1_diff;
      if (Math.abs(detQ) > 1e-6) {
        const q1 = (rhsH * (-vS_L2_diff) - (-vS_H2_diff) * rhsL) / detQ;
        const q2 = (vS_H1_diff * rhsL - rhsH * vS_L1_diff) / detQ;

        if (q1 >= 0 && q1 <= 1 && q2 >= 0 && q2 <= 1) {
          results.push({
            type: 'Hybrid',
            description: `全混合(Fully Mixed)均衡: 所有参与者均在混合策略中达到平衡`,
            senderStrategy: {
              [types[0].id]: { [signals[0].id]: pH, [signals[1].id]: 1 - pH },
              [types[1].id]: { [signals[0].id]: pL, [signals[1].id]: 1 - pL }
            },
            receiverStrategy: {
              [signals[0].id]: { [actions[0].id]: q1, [actions[1].id]: 1 - q1 },
              [signals[1].id]: { [actions[0].id]: q2, [actions[1].id]: 1 - q2 }
            },
            beliefs: {
              [signals[0].id]: {
                [types[0].id]: (types[0].probability * pH) / (types[0].probability * pH + types[1].probability * pL),
                [types[1].id]: (types[1].probability * pL) / (types[0].probability * pH + types[1].probability * pL)
              },
              [signals[1].id]: {
                [types[0].id]: (types[0].probability * (1 - pH)) / (types[0].probability * (1 - pH) + types[1].probability * (1 - pL)),
                [types[1].id]: (types[1].probability * (1 - pL)) / (types[0].probability * (1 - pH) + types[1].probability * (1 - pL))
              }
            },
            explanation: `这是一个全混合策略均衡。所有类型的发送者都在信号间随机选择，且接收者在观察到任何信号后也都在行动间随机选择。这通常发生在没有任何一方能通过纯策略获得稳定优势的高度竞争或平衡状态下。`,
            steps: [
              { title: '1. 全混合假设', content: '假设所有类型的发送者和接收者在观察到所有信号后都处于无差异状态。' },
              { title: '2. 求解发送者混合概率', content: `通过接收者的无差异条件，解得发送者选择信号的概率：pH=${pH.toFixed(2)}, pL=${pL.toFixed(2)}。` },
              { title: '3. 求解接收者混合概率', content: `通过发送者的无差异条件，解得接收者选择行动的概率：q1=${q1.toFixed(2)}, q2=${q2.toFixed(2)}。` }
            ]
          });
        }
      }
    }
  }

  return results;
}

function solveHybridEquilibria(game: GameStructure): EquilibriumResult[] {
  const { types, signals, actions, payoffs } = game;
  const results: EquilibriumResult[] = [];

  // Case: Type 1 plays pure S1, Type 2 mixes between S1 and S2
  // For Type 2 to mix, they must be indifferent between S1 and S2
  // This requires the receiver to mix after observing S1
  
  for (let senderTypeIdx = 0; senderTypeIdx < 2; senderTypeIdx++) {
    const pureType = types[senderTypeIdx];
    const mixingType = types[1 - senderTypeIdx];

    for (let pureSignalIdx = 0; pureSignalIdx < 2; pureSignalIdx++) {
      const pureSignal = signals[pureSignalIdx];
      const otherSignal = signals[1 - pureSignalIdx];

      // 1. Receiver must be indifferent after pureSignal to mix
      // Expected Payoff(A1|pureSignal) = Expected Payoff(A2|pureSignal)
      // μ(pureType|pureSignal) * V_R(pureType, pureSignal, A1) + μ(mixingType|pureSignal) * V_R(mixingType, pureSignal, A1) = ...
      // Let p be the probability mixingType chooses pureSignal
      // μ(pureType|pureSignal) = P(pureType) / [P(pureType) + p * P(mixingType)]
      // μ(mixingType|pureSignal) = p * P(mixingType) / [P(pureType) + p * P(mixingType)]
      
      const vR_P_S_A1 = payoffs[pureType.id][pureSignal.id][actions[0].id].receiver;
      const vR_P_S_A2 = payoffs[pureType.id][pureSignal.id][actions[1].id].receiver;
      const vR_M_S_A1 = payoffs[mixingType.id][pureSignal.id][actions[0].id].receiver;
      const vR_M_S_A2 = payoffs[mixingType.id][pureSignal.id][actions[1].id].receiver;

      // Equation: P(pureType)*(vR_P_S_A1 - vR_P_S_A2) + p*P(mixingType)*(vR_M_S_A1 - vR_M_S_A2) = 0
      const term1 = pureType.probability * (vR_P_S_A1 - vR_P_S_A2);
      const term2 = mixingType.probability * (vR_M_S_A1 - vR_M_S_A2);

      if (Math.abs(term2) > 1e-6) {
        const p = -term1 / term2;
        if (p > 0 && p < 1) {
          // Found a potential mixing probability for sender
          // Now find receiver's mixing probability q after pureSignal to make mixingType indifferent
          // q*V_S(mixingType, pureSignal, A1) + (1-q)*V_S(mixingType, pureSignal, A2) = V_S(mixingType, otherSignal, BestAction)
          
          // Best action after otherSignal (which is pure for mixingType)
          const vR_M_O_A1 = payoffs[mixingType.id][otherSignal.id][actions[0].id].receiver;
          const vR_M_O_A2 = payoffs[mixingType.id][otherSignal.id][actions[1].id].receiver;
          const bestActionOther = vR_M_O_A1 >= vR_M_O_A2 ? actions[0] : actions[1];
          const payoffOther = getSenderPayoff(game, mixingType.id, otherSignal.id, bestActionOther.id);

          const vS_M_S_A1 = getSenderPayoff(game, mixingType.id, pureSignal.id, actions[0].id);
          const vS_M_S_A2 = getSenderPayoff(game, mixingType.id, pureSignal.id, actions[1].id);

          if (Math.abs(vS_M_S_A1 - vS_M_S_A2) > 1e-6) {
            const q = (payoffOther - vS_M_S_A2) / (vS_M_S_A1 - vS_M_S_A2);
            if (q >= 0 && q <= 1) {
              // Found receiver's mixing probability q
              // Now verify pureType's incentive compatibility
              const payoffPure_S = q * getSenderPayoff(game, pureType.id, pureSignal.id, actions[0].id) + (1 - q) * getSenderPayoff(game, pureType.id, pureSignal.id, actions[1].id);
              const payoffPure_O = getSenderPayoff(game, pureType.id, otherSignal.id, bestActionOther.id);

              if (payoffPure_S >= payoffPure_O - 1e-6) {
                // Found Hybrid Equilibrium!
                const senderStrategy = {
                  [pureType.id]: { [pureSignal.id]: 1, [otherSignal.id]: 0 },
                  [mixingType.id]: { [pureSignal.id]: p, [otherSignal.id]: 1 - p }
                };
                const receiverStrategy = {
                  [pureSignal.id]: { [actions[0].id]: q, [actions[1].id]: 1 - q },
                  [otherSignal.id]: { [actions[0].id]: bestActionOther.id === actions[0].id ? 1 : 0, [actions[1].id]: bestActionOther.id === actions[1].id ? 1 : 0 }
                };
                const beliefs = {
                  [pureSignal.id]: {
                    [pureType.id]: pureType.probability / (pureType.probability + p * mixingType.probability),
                    [mixingType.id]: (p * mixingType.probability) / (pureType.probability + p * mixingType.probability)
                  },
                  [otherSignal.id]: {
                    [pureType.id]: 0,
                    [mixingType.id]: 1
                  }
                };

                results.push({
                  type: 'Hybrid',
                  description: `混合(Hybrid)均衡: 发送者(${pureType.name}选${pureSignal.name}, ${mixingType.name}以p=${p.toFixed(2)}选${pureSignal.name}); 接收者(${pureSignal.name}下以q=${q.toFixed(2)}选${actions[0].name})`,
                  explanation: `这是一个【半分离/混合 (Hybrid) 均衡】。这种状态处于“完全筛选”与“完全混同”之间。${pureType.name} 总是选择 ${pureSignal.name}，而 ${mixingType.name} 表现得左右摇摆，以 p=${p.toFixed(2)} 的概率模仿优等类型（混同），以试图获得更好的待遇。接收者在观察到信号后陷入了部分怀疑，必须采取特定的混合随机策略（q=${q.toFixed(2)}）来精准“制衡”发送者的投机动机，从而在动态博弈中达到微妙的平衡点。`,
                  senderStrategy,
                  receiverStrategy,
                  beliefs,
                  steps: [
                    { 
                      title: '第 1 步：建立半分离假设', 
                      content: `我们假设核心类型 ${pureType.name} 采取纯策略，而 ${mixingType.name} 寻找一种混合概率 p，使其在信号间无差异。\n\n策略结构如下：\n- ${pureType.name} -> ${pureSignal.name}\n- ${mixingType.name} -> ${pureSignal.name} (概率 p), ${otherSignal.name} (概率 1-p)` 
                    },
                    { 
                      title: '第 2 步：求解发送者混合概率 p', 
                      content: `接收者在观察到 ${pureSignal.name} 后的选择无差异条件：\nE[π_R|${actions[0].name}] = E[π_R|${actions[1].name}]\n\n代入其后延信念 μ(θ|${pureSignal.name}) 及收益值：\nμ(${pureType.name})·(${vR_P_S_A1}) + μ(${mixingType.name})·(${vR_M_S_A1}) = μ(${pureType.name})·(${vR_P_S_A2}) + μ(${mixingType.name})·(${vR_M_S_A2})\n\n代入贝叶斯公式求解 p：\n${pureType.probability.toFixed(2)}·(${vR_P_S_A1 - vR_P_S_A2}) + [p·${mixingType.probability.toFixed(2)}]·(${vR_M_S_A1 - vR_M_S_A2}) = 0\n\n解得 p = ${p.toFixed(2)}。\n\n此时接收者的后验信念为：\nμ(${pureType.name}|${pureSignal.name}) = ${beliefs[pureSignal.id][pureType.id].toFixed(2)}\nμ(${mixingType.name}|${pureSignal.name}) = ${beliefs[pureSignal.id][mixingType.id].toFixed(2)}。` 
                    },
                    { 
                      title: '第 3 步：求解接收者混合概率 q', 
                      content: `发送者 ${mixingType.name} 类型在两路信号间的选择无差异条件：\nE[π_S(${mixingType.name}, ${pureSignal.name})] = E[π_S(${mixingType.name}, ${otherSignal.name})]\n\n设接收者在 ${pureSignal.name} 下选择 ${actions[0].name} 的概率为 q：\nq·(${vS_M_S_A1}) + (1-q)·(${vS_M_S_A2}) = ${payoffOther.toFixed(2)}\n\n代入数值解得：\nq = ${q.toFixed(2)}\n\n意味着接收者在观察到信号 ${pureSignal.name} 后，必须以 ${q.toFixed(2)} 的比例选择 ${actions[0].name}。` 
                    },
                    { 
                      title: '第 4 步：验证另一类型的 IC 约束', 
                      content: `计算 ${pureType.name} 的收益：\n- 当前策略收益 (混同于 ${pureSignal.name}) = ${payoffPure_S.toFixed(2)}\n- 偏离到 ${otherSignal.name} 的收益 = ${payoffPure_O.toFixed(2)}\n\n验证结果：${payoffPure_S.toFixed(2)} >= ${payoffPure_O.toFixed(2)}，协议成立。` 
                    }
                  ]
                });
              }
            }
          }
        }
      }
    }
  }

  return results;
}

function checkPureStrategy(game: GameStructure, senderProfile: { [typeId: string]: string }): EquilibriumResult | null {
  const { types, signals, actions, payoffs } = game;

  // 1. Calculate Beliefs mu(t|m)
  const beliefs: { [signalId: string]: { [typeId: string]: number } } = {};
  signals.forEach(s => {
    beliefs[s.id] = {};
    const typesChoosingS = types.filter(t => senderProfile[t.id] === s.id);
    const totalProb = typesChoosingS.reduce((sum, t) => sum + t.probability, 0);

  if (totalProb > 0) {
      types.forEach(t => {
        beliefs[s.id][t.id] = (senderProfile[t.id] === s.id ? t.probability : 0) / totalProb;
      });
    } else {
      // Off-equilibrium path belief: In PBE, any belief is allowed.
      // We'll search for a belief that supports the equilibrium.
      // For simplicity, we'll try to find an action that is a Best Response to SOME belief 
      // and minimizes the sender's incentive to deviate.
      // Most common "threat" is mu(H)=0, but we should be robust.
      // For now, we use mu(H)=0 as the "minimizer" for deviation check.
      types.forEach((t, i) => {
        beliefs[s.id][t.id] = (i === types.length - 1) ? 1 : 0; // Default to "worst" type
      });
    }
  });

  // 2. Receiver's Best Response
  const receiverStrategy: { [signalId: string]: { [actionId: string]: number } } = {};
  for (const signal of signals) {
    let maxExpectedPayoff = -Infinity;
    let bestActions: string[] = [];

    for (const action of actions) {
      let expectedPayoff = 0;
      types.forEach(t => {
        expectedPayoff += beliefs[signal.id][t.id] * payoffs[t.id][signal.id][action.id].receiver;
      });

      if (expectedPayoff > maxExpectedPayoff) {
        maxExpectedPayoff = expectedPayoff;
        bestActions = [action.id];
      } else if (Math.abs(expectedPayoff - maxExpectedPayoff) < 1e-6) {
        bestActions.push(action.id);
      }
    }

    receiverStrategy[signal.id] = {};
    actions.forEach(a => {
      receiverStrategy[signal.id][a.id] = bestActions.includes(a.id) ? 1 / bestActions.length : 0;
    });
  }

  // 3. Sender's Best Response
  for (const type of types) {
    const chosenSignal = senderProfile[type.id];
    let chosenPayoff = 0;
    actions.forEach(a => {
      chosenPayoff += receiverStrategy[chosenSignal][a.id] * getSenderPayoff(game, type.id, chosenSignal, a.id);
    });

    for (const otherSignal of signals) {
      if (otherSignal.id === chosenSignal) continue;
      let otherPayoff = 0;
      actions.forEach(a => {
        otherPayoff += receiverStrategy[otherSignal.id][a.id] * getSenderPayoff(game, type.id, otherSignal.id, a.id);
      });

      if (otherPayoff > chosenPayoff + 1e-6) {
        return null; // Not an equilibrium
      }
    }
  }

  // Determine type
  const chosenSignals = new Set(Object.values(senderProfile));
  const isSeparating = chosenSignals.size === types.length;
  const isPooling = chosenSignals.size === 1;

  const senderStrategy: { [typeId: string]: { [signalId: string]: number } } = {};
  types.forEach(t => {
    senderStrategy[t.id] = {};
    signals.forEach(s => {
      senderStrategy[t.id][s.id] = senderProfile[t.id] === s.id ? 1 : 0;
    });
  });

  // Generate steps with detailed formulas and logic
  const steps: { title: string; content: string }[] = [
    {
      title: '第 1 步：设定策略组合假设',
      content: `我们首先假设系统中存在一个纯策略组合：\n${types.map(t => `类型 ${t.name} (θ) 确定选择信号 ${signals.find(s => s.id === senderProfile[t.id])?.name} (m)`).join('；\n')}\n\n该假设下的博弈类型为：${isSeparating ? '全分离 (Separating)' : '全混同 (Pooling)'}。`
    },
    {
      title: '第 2 步：计算后验信念 μ(θ|m)',
      content: `根据贝叶斯法则 Pr(θ|m) = [Pr(m|θ)θ] / [Σ Pr(m|t)θ(t)]：\n\n` + 
        signals.map(s => {
          const b = beliefs[s.id];
          const isOffPath = types.filter(t => senderProfile[t.id] === s.id).length === 0;
          let text = `观察到信号 ${s.name}：\n`;
          if (isOffPath) {
            text += `  - 这是一个“离路径”信号。在 PBE 定义下，我们可以赋予接收者任何合理的威胁信念。\n`;
            text += `  - 我们假设此时接收者倾向于认为发送者是“弱势类型”，即：\n`;
          }
          text += types.map(t => `    μ(${t.name}|${s.name}) = ${b[t.id].toFixed(2)}`).join('\n');
          return text;
        }).join('\n\n')
    },
    {
      title: '第 3 步：求解接收者最优响应',
      content: `接收者面临信号 ${signals.map(s => s.name).join('/')}，需通过期望收益对比找到最优行动：\n\n` +
        signals.map(s => {
          const strat = receiverStrategy[s.id];
          const bestActions = actions.filter(a => strat[a.id] > 0);
          const payoffCalc = actions.map(a => {
            const val = types.reduce((sum, t) => sum + beliefs[s.id][t.id] * payoffs[t.id][s.id][a.id].receiver, 0);
            return `  - E[π_R|${a.name}] = ${types.map(t => `μ(${t.name})·(${payoffs[t.id][s.id][a.id].receiver})`).join(' + ')}\n    = ${types.map(t => `${beliefs[s.id][t.id].toFixed(2)} × ${payoffs[t.id][s.id][a.id].receiver}`).join(' + ')} = ${val.toFixed(2)}`;
          }).join('\n');
          return `针对信号 ${s.name}，其收益矩阵如下：\n${payoffCalc}\n\n结论：接收者选择 [${bestActions.map(a => a.name).join(' 或 ')}]。`;
        }).join('\n\n')
    },
    {
      title: '第 4 步：验证发送者的激励相容 IC 约束',
      content: `最后，我们必须确保没有任何类型的发送者有动力偏离当前策略：\n\n` +
        types.map(t => {
          const chosenS = signals.find(s => s.id === senderProfile[t.id])!;
          const otherS = signals.find(s => s.id !== chosenS.id)!;
          
          let chosenPayoff = 0;
          actions.forEach(a => { chosenPayoff += receiverStrategy[chosenS.id][a.id] * getSenderPayoff(game, t.id, chosenS.id, a.id); });
          
          let otherPayoff = 0;
          actions.forEach(a => { otherPayoff += receiverStrategy[otherS.id][a.id] * getSenderPayoff(game, t.id, otherS.id, a.id); });

          return `${t.name} 类型：\n  - 选择 ${chosenS.name} 的收益 = ${chosenPayoff.toFixed(2)}\n  - 偏离到 ${otherS.name} 的收益 = ${otherPayoff.toFixed(2)}\n  - ${chosenPayoff >= otherPayoff - 1e-6 ? '满足 IC (收益更高)' : '不满足 IC (会偏离)'}`;
        }).join('\n\n')
    },
    {
      title: '第 5 步：结论',
      content: `由于该策略组合在所有信息集下都满足序列理性（Sequential Rationality）和贝叶斯一致性（Bayesian Consistency），因此构成一个${isSeparating ? '分离' : '混同'}精炼贝叶斯均衡。`
    }
  ];

  // Generate explanation
  const isLemonMarket = types.some(t => t.name.includes('车') || t.name.includes('Lemon')) || game.name.includes('二手车');
  const isLaborMarket = types.some(t => t.name.includes('能力')) || game.name.includes('教育');

  let explanation = '';
  if (isSeparating) {
    explanation = `这是一个【分离均衡 (Separating Equilibrium)】。不同类型的发送者选择了不同的信号方案，实现了信号的“完美甄别”。`;
    if (isLemonMarket) {
      explanation += ` 在二手车市场中，这意味着好车与烂车主选择了不同的策略（如是否提供担保），买家能够根据信号精准识别车辆质量，从而消除了逆向选择风险。`;
    } else if (isLaborMarket) {
      explanation += ` 在劳动力市场中，高能力者通过承担教育成本，成功将自己与低能力者区分开来，使得接收者（雇主）能够进行“针对性”决策。`;
    } else {
      explanation += ` 信号在这里起到了关键的甄别作用，接收者可以根据观察到的决策完美推断出发送者的真实类型，并据此做出最优响应。`;
    }
  } else if (isPooling) {
    const pooledSignal = signals.find(s => s.id === Object.values(senderProfile)[0])?.name;
    explanation = `这是一个【混同均衡 (Pooling Equilibrium)】。所有类型的发送者都选择了相同的信号（${pooledSignal}）。在这种“泥沙俱下”的状态下，信号失去了辨识力。`;
    if (isLemonMarket) {
      explanation += ` 在二手车市场中，这意味着所有卖家都表现一致，买家无法区分好车与烂车。如果市场平均质量较低，可能会导致交易萎缩或买家出价保守，即经典的“柠檬问题”。`;
    } else if (isLaborMarket) {
      explanation += ` 在劳动力市场中，信号无法反映任何能力差异。接收者只能依据初始概率（先验信念）来做出对平均能力的“模糊”响应。`;
    } else {
      explanation += ` 接收者在观察到该信号后，其后验信念依然等于先验概率，无法对发送者的身份进行任何有效修正。`;
    }
  }

  const receiverDesc = signals.map(s => {
    const bestActions = actions.filter(a => receiverStrategy[s.id][a.id] > 0);
    return `${s.name}→${bestActions.map(a => a.name).join('/')}`;
  }).join(', ');

  return {
    type: isSeparating ? 'Separating' : (isPooling ? 'Pooling' : 'Hybrid'),
    description: `${isSeparating ? '分离' : '混同'}均衡: [发送者] ${types.map(t => `${t.name}→${signals.find(s => s.id === senderProfile[t.id])?.name}`).join(', ')}; [接收者] ${receiverDesc}`,
    explanation: explanation + ` 接收者的动作布局为：${receiverDesc}。`,
    senderStrategy,
    receiverStrategy,
    beliefs,
    steps,
  };
}

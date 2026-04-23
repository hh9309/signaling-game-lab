/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameType {
  id: string;
  name: string;
  probability: number; // Probability of this type occurring
}

export interface GameSignal {
  id: string;
  name: string;
  cost: number; // Cost of sending this signal
}

export interface GameAction {
  id: string;
  name: string;
}

export interface Payoff {
  sender: number;
  receiver: number;
}

export interface GameStructure {
  name: string;
  types: GameType[];
  signals: GameSignal[];
  actions: GameAction[];
  payoffs: {
    [typeId: string]: {
      [signalId: string]: {
        [actionId: string]: Payoff;
      };
    };
  };
}

export interface EquilibriumStep {
  title: string;
  content: string;
}

export interface EquilibriumResult {
  type: 'Separating' | 'Pooling' | 'Hybrid' | 'None';
  description: string;
  explanation?: string;
  senderStrategy: {
    [typeId: string]: {
      [signalId: string]: number; // Probability
    };
  };
  receiverStrategy: {
    [signalId: string]: {
      [actionId: string]: number; // Probability
    };
  };
  beliefs: {
    [signalId: string]: {
      [typeId: string]: number; // mu(t|m)
    };
  };
  steps?: EquilibriumStep[];
  isValid?: boolean;
  validationErrors?: string[];
}

export interface AISettings {
  apiKey: string;
  model: 'gemini-3-flash' | 'deepseek-r1';
}

export interface GameCase {
  id: string;
  name: string;
  description: string;
  structure: GameStructure;
}

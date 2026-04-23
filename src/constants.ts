import { GameCase } from './types';

export const BUILTIN_CASES: GameCase[] = [
  {
    id: 'spence-education',
    name: 'Spence 教育信号模型',
    description: '高能力者通过接受教育（尽管教育本身不提高生产力）来向雇主证明自己的能力。',
    structure: {
      name: 'Spence 教育信号模型',
      types: [
        { id: 'high', name: '高能力 (H)', probability: 0.5 },
        { id: 'low', name: '低能力 (L)', probability: 0.5 },
      ],
      signals: [
        { id: 'edu', name: '接受教育', cost: 0 },
        { id: 'no-edu', name: '不接受教育', cost: 0 },
      ],
      actions: [
        { id: 'high-wage', name: '高薪职位' },
        { id: 'low-wage', name: '低薪职位' },
      ],
      payoffs: {
        high: {
          edu: { 'high-wage': { sender: 10, receiver: 10 }, 'low-wage': { sender: 2, receiver: -5 } },
          'no-edu': { 'high-wage': { sender: 12, receiver: 10 }, 'low-wage': { sender: 5, receiver: -5 } },
        },
        low: {
          edu: { 'high-wage': { sender: 4, receiver: -5 }, 'low-wage': { sender: -4, receiver: 5 } },
          'no-edu': { 'high-wage': { sender: 8, receiver: -5 }, 'low-wage': { sender: 2, receiver: 5 } },
        },
      },
    },
  },
  {
    id: 'lemon-market',
    name: '二手车“柠檬”市场',
    description: '卖家知道车的真实质量，买家不知道。高质量车主可能因为价格过低而退出市场。',
    structure: {
      name: '二手车“柠檬”市场',
      types: [
        { id: 'good', name: '好车', probability: 0.5 },
        { id: 'bad', name: '烂车 (Lemon)', probability: 0.5 },
      ],
      signals: [
        { id: 'sell', name: '出售', cost: 0 },
        { id: 'keep', name: '留着', cost: 0 },
      ],
      actions: [
        { id: 'buy', name: '买入' },
        { id: 'reject', name: '拒绝' },
      ],
      payoffs: {
        good: {
          sell: { buy: { sender: 100, receiver: 20 }, reject: { sender: 80, receiver: 0 } },
          keep: { buy: { sender: 80, receiver: 0 }, reject: { sender: 80, receiver: 0 } },
        },
        bad: {
          sell: { buy: { sender: 100, receiver: -50 }, reject: { sender: 20, receiver: 0 } },
          keep: { buy: { sender: 20, receiver: 0 }, reject: { sender: 20, receiver: 0 } },
        },
      },
    },
  },
];

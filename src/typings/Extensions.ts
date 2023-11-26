import { Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Logger } from 'pino';
import { Sequelize } from 'sequelize';
import { initModels } from '../models/init-models.js';

export interface CustomClient extends Client {
  // Commands for the bot to handle
  commands?: Map<string, CommandFile>;
  // Functions dynamically imported
  functions?: { [key: string]: { [key: string]: FunctionFile['execute'] } };
  // Sequelize instance
  sequelize?: Sequelize;
  // Sequelize models for the database
  models?: ReturnType<typeof initModels>;
  // Whether the bot is ready to accept commands
  ready?: boolean;
  // Logging
  logs?: Logger | Console;
}
// Various types of file that will be imported
export interface CommandFile {
  name: string;
  ephemeral: boolean;
  data: SlashCommandBuilder;
  run: (client: CustomClient, interaction: CommandInteraction, options: CommandInteraction['options']) => Promise<void>;
}
export interface FunctionFile {
  name: string;
  execute: (client: CustomClient) => Promise<void>;
}
// Instatuts Metric Typings
export interface RawMetric {
  id: string;
  name: string;
  active: boolean;
  order: number;
  suffix: string;
  data: MetricData[];
}
export interface MetricData {
  timestamp: number;
  value: number;
}
export interface MetricPut {
  name: string;
  suffix: string;
}
export interface MetricDataPoint {
  id: string;
  value: number;
  timestamp: number;
}
export interface MetricDataPointPost {
  timestamp: number;
  value: number;
}
export const EventTypeArray = ['ready', 'init', 'events'] as const;
// Export EventTypes as any member of the array
export type EventTypes = 'ready' | 'init' | 'events';

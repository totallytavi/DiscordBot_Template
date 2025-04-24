import { createWriteStream, existsSync } from 'node:fs';
import { pino, stdSerializers } from 'pino';
import { CustomClient } from '../../typings/Extensions.js';

export const name = 'pino';
export async function execute(client: CustomClient, _ready: boolean): Promise<void> {
  // Create logs directory if it doesn't exist
  if (!existsSync('../logs')) {
    console.error('F | ✘ Logs directory does not exist. If you want to use pino, please create it under the root directory');
    return;
  }
  // Overwrite console logger with pino
  client.logs = pino(
    {
      name: 'main',
      // Warn if production, trace if development
      level: process.env.environment === 'development' ? 'trace' : 'warn',
      serializers: {
        // Default error serializer
        err: stdSerializers.err
      }
    },
    // Create log file
    createWriteStream(`../logs/pino-${new Date().getTime()}.log`, {
      flags: 'wx'
    })
  );
  // Inform user we have switched to pino
  console.debug('F | ✦ Pino logger created, using that for logging');
}

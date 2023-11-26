import { CustomClient } from '../../../typings/Extensions.js';

export const name = 'example';
export async function execute(_client: CustomClient): Promise<void> {
  console.log('Example function loaded!');
  return;
}

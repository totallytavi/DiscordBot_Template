import { existsSync, readdirSync } from 'node:fs';
import { CustomClient, FunctionFile } from '../typings/Extensions.js';

// This loads all functions
export async function load(client: CustomClient): Promise<void> {
  // Check for functions folder
  if (!existsSync('./functions')) {
    client.logs.warn('F | ! No functions were found! Make sure you are running index.js from the dist directory');
    return;
  }
  client.logs.debug('F | ✦ Loading all functions');
  // Initialise variable
  const functionFiles: { [key: string]: string[] } = {};
  // Read the directory
  const types = readdirSync('./functions').filter((f) => !f.endsWith('.js'));
  // For each type, load the files
  for (const type of types) {
    functionFiles[type] = readdirSync(`./functions/${type}`, { recursive: true })
      // Map Buffers to string
      .map((f) => String(f))
      // Trim directory
      .map((f) => f.replace(`./functions/${type}/`, ''))
      // Remove Windows backslashes
      .map((f) => f.replace('\\', '/'))
      // Filter out non-JS files
      .filter((f) => f.endsWith('.js'));
  }
  // Load the functions
  const functions = {};
  for (const [type, files] of Object.entries(functionFiles)) {
    client.logs.debug(`F | ✦ Found ${files.length} ${type} functions`);
    // Initialise the type
    functions[type] = {};
    // Set the file
    for (const file of files) {
      try {
        const f: FunctionFile = await import(`../functions/${type}/${file}`);
        const n = file.replace('.js', '');
        functions[type][n] = f.execute;
        client.logs.debug(`F | ✓ ${file}`);
      } catch (err) {
        client.logs.error(`F | ✗ ${file}`, err);
      }
    }
    // Attach the function
    client[type] = functions[type];
  }
  // Attach the functions
  client.functions = functions;
  client.ready = true;
  // Return void
  return;
}

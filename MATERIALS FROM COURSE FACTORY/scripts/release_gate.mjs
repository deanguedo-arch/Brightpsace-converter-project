#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const checks = ['exports:verify', 'exports:parity', 'exports:fixtures'];

function runNpm(args) {
  const npmExecPath = process.env.npm_execpath || '';
  if (npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, ...args], { stdio: 'inherit' });
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawnSync(npmCmd, args, { stdio: 'inherit' });
}

for (const script of checks) {
  console.log(`\n> Running ${script}`);
  const result = runNpm(['run', '-s', script]);
  if (result.status !== 0) {
    console.error(`\nX Release gate failed at: ${script}`);
    process.exit(result.status || 1);
  }
}

console.log('\nOK Release gate passed');

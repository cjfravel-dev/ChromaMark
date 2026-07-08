#!/usr/bin/env node
import { run } from '../src/cli.js';

// Only force-exit on a non-zero code. On success we return naturally so that
// watch mode's fs.watch handle can keep the event loop alive.
const code = run();
if (code) process.exit(code);

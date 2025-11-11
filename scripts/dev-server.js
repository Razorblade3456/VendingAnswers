#!/usr/bin/env node

const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { readFile } = require('node:fs/promises');
const { existsSync, statSync } = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const projectRoot = path.resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT ?? '5173', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const statSafe = (targetPath) => {
  try {
    return statSync(targetPath);
  } catch (error) {
    return null;
  }
};

const resolveFilePath = (requestedPath) => {
  const normalized = path
    .normalize(requestedPath)
    .replace(/^\/+/, '')
    .replace(/\.\.+/g, '');
  const absolutePath = path.join(projectRoot, normalized);
  if (!absolutePath.startsWith(projectRoot)) {
    return null;
  }
  let candidate = absolutePath;
  const stats = statSafe(candidate);
  if (requestedPath.endsWith('/') || stats?.isDirectory()) {
    candidate = path.join(candidate, 'index.html');
  }
  if (!existsSync(candidate) && path.extname(candidate) === '') {
    const withHtml = `${candidate}.html`;
    if (existsSync(withHtml)) {
      candidate = withHtml;
    }
  }
  return existsSync(candidate) ? candidate : null;
};

const server = createServer(async (request, response) => {
  const { url } = request;
  const urlObject = new URL(url ?? '/', `http://localhost:${port}`);
  const pathname = urlObject.pathname === '/' ? '/index.html' : urlObject.pathname;
  const filePath = resolveFilePath(pathname);

  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  try {
    const data = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(data);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

let tscPath;
try {
  tscPath = require.resolve('typescript/bin/tsc');
} catch (error) {
  console.error('TypeScript is not installed. Run "npm install" before starting the dev server.');
  process.exit(1);
}

const tscProcess = spawn(process.execPath, [tscPath, '--watch', '--preserveWatchOutput'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

tscProcess.on('exit', (code) => {
  console.log(`TypeScript process exited with code ${code ?? 'null'}. Shutting down dev server.`);
  server.close(() => process.exit(code ?? 0));
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop. Watching for TypeScript changes...');
});

const shutDown = (signal) => {
  console.log(`\nReceived ${signal}. Closing dev server...`);
  server.close(() => {
    tscProcess.kill('SIGINT');
    process.exit(0);
  });
};

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

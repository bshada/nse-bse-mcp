#!/usr/bin/env node

/**
 * NSE-BSE MCP Server
 * 
 * Uses Streamable HTTP transport
 * Provides access to NSE and BSE India stock market APIs via MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { NSE, BSE } from 'nse-bse-api';
import { nseTools } from './tools/nse-tools.js';
import { bseTools } from './tools/bse-tools.js';
import { documentTools } from './tools/document-tools.js';
import { handleNseTool } from './handlers/nse-handler.js';
import { handleBseTool } from './handlers/bse-handler.js';
import { handleDocumentTool } from './handlers/document-handler.js';

// Initialize API clients (shared across requests)
const nse = new NSE('./downloads');
const bse = new BSE({ downloadFolder: './downloads' });

// Create base MCP server
function createMcpServer() {
  const server = new Server(
    {
      name: 'nse-bse-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...nseTools, ...bseTools, ...documentTools],
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Route to appropriate handler based on tool prefix
      if (name.startsWith('nse_')) {
        return await handleNseTool(name, args || {}, nse);
      } else if (name.startsWith('bse_')) {
        return await handleBseTool(name, args || {}, bse);
      } else if (name === 'download_document') {
        return await handleDocumentTool(name, args || {});
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      // Return structured error response
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Set up Express app
const app = express();

// Configure CORS for browser clients
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // Configure for production
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
    credentials: true,
  })
);

app.use(express.json());

// Middleware to ensure Accept header compatibility for Streamable HTTP
// Some MCP clients (like Gemini CLI) don't send the required Accept headers
app.use('/mcp', (req, res, next) => {
  const accept = req.headers.accept || '';
  if (!accept.includes('text/event-stream')) {
    req.headers.accept = 'application/json, text/event-stream';
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'nse-bse-mcp-server',
    version: '1.0.0',
    tools: nseTools.length + bseTools.length,
  });
});

// MCP endpoint using Streamable HTTP (stateless mode - recommended)
app.post('/mcp', async (req, res) => {
  // Create new transport per request to prevent ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  });

  // Clean up transport when connection closes
  res.on('close', () => {
    transport.close();
  });

  // Create and connect server
  const server = createMcpServer();
  await server.connect(transport);

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Start server
const port = parseInt(process.env.PORT || '3000');
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`NSE-BSE MCP Server running on http://${host}:${port}`);
  console.log(`MCP endpoint: http://${host}:${port}/mcp`);
  console.log(`Health check: http://${host}:${port}/health`);
  console.log(`\nAvailable tools: ${nseTools.length + bseTools.length + documentTools.length} (${nseTools.length} NSE + ${bseTools.length} BSE + ${documentTools.length} Document)`);
  console.log(`\nConnect with:`);
  console.log(`  MCP Inspector: npx @modelcontextprotocol/inspector`);
  console.log(`  URL: http://localhost:${port}/mcp`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  nse.exit();
  bse.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  nse.exit();
  bse.close();
  process.exit(0);
});

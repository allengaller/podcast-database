import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPService, LeetCodeService } from '@leetcast/core';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: 'leetcast-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 * Exposes a tool to generate a podcast for a given LeetCode problem ID.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_podcast',
        description: 'Generate a podcast episode for a LeetCode problem',
        inputSchema: {
          type: 'object',
          properties: {
            problemId: {
              type: 'string',
              description: "The ID of the LeetCode problem (e.g., '1')",
            },
          },
          required: ['problemId'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 * This connects the MCP protocol to our MCPService logic.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'generate_podcast') {
    const problemId = request.params.arguments?.problemId as string;

    const problem = await LeetCodeService.getProblemById(problemId);
    if (!problem) {
      return {
        content: [
          {
            type: 'text',
            text: `Problem with ID ${problemId} not found.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const podcast = await MCPService.generatePodcast(problem);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully generated podcast: ${podcast.title}\nDuration: ${podcast.duration}\n\nTranscript excerpt: ${podcast.transcript.substring(0, 200)}...`,
          },
          {
            type: 'text',
            text: `Audio saved to: ${podcast.audioUrl}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to generate podcast: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LeetCast MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

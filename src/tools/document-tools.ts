import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const documentTools: Tool[] = [
  {
    name: 'download_document',
    description: 'Download and extract documents from NSE/BSE. Automatically handles PDFs (extracts text), text files (reads content), and compressed files (extracts and reads contents). Useful for IPO prospectus, annual reports, circulars, etc. Supports page-specific extraction for PDFs.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the document to download (e.g., DRHP link from IPO details)',
        },
        max_size_mb: {
          type: 'number',
          description: 'Maximum file size to download in MB (default: 50MB)',
        },
        start_page: {
          type: 'number',
          description: 'Starting page number for PDF extraction (1-based, optional)',
        },
        end_page: {
          type: 'number',
          description: 'Ending page number for PDF extraction (1-based, optional)',
        },
        pages: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific page numbers to extract (1-based, optional). Alternative to start_page/end_page.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'read_document_pages',
    description: 'Read specific pages from a document. Can use cached file if available, or download from URL if provided. Useful for accessing different sections of large PDFs without re-downloading the entire document each time.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename of the cached document (e.g., "RHP_LGEINDIA.pdf"). Optional if url is provided.',
        },
        url: {
          type: 'string',
          description: 'URL to download if file is not cached. Optional if filename exists in cache.',
        },
        start_page: {
          type: 'number',
          description: 'Starting page number for PDF extraction (1-based, optional)',
        },
        end_page: {
          type: 'number',
          description: 'Ending page number for PDF extraction (1-based, optional)',
        },
        pages: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific page numbers to extract (1-based, optional). Alternative to start_page/end_page.',
        },
        max_size_mb: {
          type: 'number',
          description: 'Maximum file size to download in MB if re-downloading (default: 50MB)',
        },
      },
      required: [],
    },
  },
];

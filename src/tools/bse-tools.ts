import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { addFilterProperties } from './common-properties.js';

export const bseTools: Tool[] = [
  // Market Data Tools
  {
    name: 'bse_quote',
    description: 'Get real-time stock quote for BSE scrip code',
    inputSchema: {
      type: 'object',
      properties: {
        scripcode: {
          type: 'string',
          description: 'BSE scrip code (e.g., 500325 for RELIANCE)',
        },
      },
      required: ['scripcode'],
    },
  },
  {
    name: 'bse_quote_weekly_hl',
    description: 'Get 52-week and monthly high/low data for a stock',
    inputSchema: {
      type: 'object',
      properties: {
        scripcode: {
          type: 'string',
          description: 'BSE scrip code',
        },
      },
      required: ['scripcode'],
    },
  },
  {
    name: 'bse_gainers',
    description: 'Get top gainers on BSE. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        by: {
          type: 'string',
          description: 'Filter by group or index',
          enum: ['group', 'index'],
        },
        name: {
          type: 'string',
          description: 'Group name (A, B, etc.) or index name',
        },
        pct_change: {
          type: 'string',
          description: 'Percentage change filter',
          enum: ['all', '2', '5', '10'],
        },
      }),
    },
  },
  {
    name: 'bse_losers',
    description: 'Get top losers on BSE. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        by: {
          type: 'string',
          description: 'Filter by group or index',
          enum: ['group', 'index'],
        },
        name: {
          type: 'string',
          description: 'Group name (A, B, etc.) or index name',
        },
        pct_change: {
          type: 'string',
          description: 'Percentage change filter',
          enum: ['all', '2', '5', '10'],
        },
      }),
    },
  },
  {
    name: 'bse_advance_decline',
    description: 'Get advance/decline values for all BSE indices. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'bse_near_52week',
    description: 'Get stocks near 52-week high and low. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        by: {
          type: 'string',
          description: 'Filter by group or index',
          enum: ['group', 'index'],
        },
        name: {
          type: 'string',
          description: 'Group name or index name',
        },
      }),
    },
  },

  // Historical Data Tools
  {
    name: 'bse_index_historical',
    description: 'Download historical data for BSE index. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        index: {
          type: 'string',
          description: 'Index name (e.g., SENSEX, BSE500)',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        period: {
          type: 'string',
          description: 'Period (D=Daily, W=Weekly, M=Monthly)',
          enum: ['D', 'W', 'M'],
        },
      }),
      required: ['index', 'from_date', 'to_date'],
    },
  },
  {
    name: 'bse_all_indices_by_date',
    description: 'Fetch daily data for all BSE indices for a specific date. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD)',
        },
      }),
      required: ['date'],
    },
  },

  // Corporate Information Tools
  {
    name: 'bse_corporate_actions',
    description: 'Get corporate actions (dividends, splits, bonuses). Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        segment: {
          type: 'string',
          description: 'Market segment',
          enum: ['equity', 'debt', 'mf'],
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        by_date: {
          type: 'string',
          description: 'Date type (ex=Ex-date, record=Record date, both=Both)',
          enum: ['ex', 'record', 'both'],
        },
        scripcode: {
          type: 'string',
          description: 'BSE scrip code (optional)',
        },
        sector: {
          type: 'string',
          description: 'Sector filter (optional)',
        },
        purpose_code: {
          type: 'string',
          description: 'Purpose code filter (optional)',
        },
      }),
    },
  },
  {
    name: 'bse_announcements',
    description: 'Get corporate announcements. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        page_no: {
          type: 'number',
          description: 'Page number (default: 1)',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        segment: {
          type: 'string',
          description: 'Market segment',
          enum: ['equity', 'debt', 'mf'],
        },
        scripcode: {
          type: 'string',
          description: 'BSE scrip code (optional)',
        },
        category: {
          type: 'string',
          description: 'Announcement category (optional)',
        },
        subcategory: {
          type: 'string',
          description: 'Announcement subcategory (optional)',
        },
      }),
    },
  },
  {
    name: 'bse_result_calendar',
    description: 'Get corporate result calendar. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        scripcode: {
          type: 'string',
          description: 'BSE scrip code (optional)',
        },
      }),
    },
  },

  // Search & Lookup Tools
  {
    name: 'bse_lookup_symbol',
    description: 'Search for BSE symbols by company name, symbol, ISIN, or scrip code',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'bse_get_scrip_name',
    description: 'Get stock symbol name from BSE scrip code',
    inputSchema: {
      type: 'object',
      properties: {
        scripcode: {
          type: 'string',
          description: 'BSE scrip code',
        },
      },
      required: ['scripcode'],
    },
  },
  {
    name: 'bse_get_scrip_code',
    description: 'Get BSE scrip code from stock symbol name',
    inputSchema: {
      type: 'object',
      properties: {
        scripname: {
          type: 'string',
          description: 'Stock symbol name',
        },
      },
      required: ['scripname'],
    },
  },
  {
    name: 'bse_list_securities',
    description: 'List securities with filters. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        industry: {
          type: 'string',
          description: 'Industry filter (optional)',
        },
        scripcode: {
          type: 'string',
          description: 'Scrip code filter (optional)',
        },
        group: {
          type: 'string',
          description: 'Group filter (A, B, etc.)',
        },
        segment: {
          type: 'string',
          description: 'Segment filter',
        },
        status: {
          type: 'string',
          description: 'Status filter',
          enum: ['Active', 'Suspended', 'Delisted'],
        },
      }),
    },
  },

  // Report Download Tools
  {
    name: 'bse_download_bhavcopy',
    description: 'Download daily bhavcopy report. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD)',
        },
      }),
      required: ['date'],
    },
  },
  {
    name: 'bse_download_delivery',
    description: 'Download daily delivery report. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD)',
        },
      }),
      required: ['date'],
    },
  },

  // Metadata Tools
  {
    name: 'bse_fetch_index_names',
    description: 'Get list of all BSE indices. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'bse_fetch_index_metadata',
    description: 'Get metadata about BSE index reports. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
];

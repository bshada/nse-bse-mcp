import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { addFilterProperties } from './common-properties.js';

export const nseTools: Tool[] = [
  // Market Data Tools
  {
    name: 'nse_get_market_status',
    description: 'Get current NSE market status including trading hours and market state',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'nse_equity_quote',
    description: 'Get real-time equity quote for a symbol on NSE',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock symbol (e.g., RELIANCE, TCS, INFY)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'nse_get_quote',
    description: 'Get quote for any symbol with segment specification',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Symbol name',
        },
        segment: {
          type: 'string',
          description: 'Market segment (equities, sme, mf, debt)',
          enum: ['equities', 'sme', 'mf', 'debt'],
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'nse_lookup_symbol',
    description: 'Search for symbols on NSE by name or partial match',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (company name or symbol)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'nse_get_gainers',
    description: 'Get top gainers from market data',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of top gainers to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'nse_get_losers',
    description: 'Get top losers from market data',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of top losers to return (default: 10)',
        },
      },
    },
  },

  // Historical Data Tools
  {
    name: 'nse_equity_historical',
    description: 'Fetch historical equity data for a symbol. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Stock symbol',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        series: {
          type: 'string',
          description: 'Series (default: EQ)',
        },
      }),
      required: ['symbol', 'from_date', 'to_date'],
    },
  },
  {
    name: 'nse_index_historical',
    description: 'Fetch historical index data. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        index: {
          type: 'string',
          description: 'Index name (e.g., NIFTY 50, NIFTY BANK)',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      }),
      required: ['index', 'from_date', 'to_date'],
    },
  },
  {
    name: 'nse_fno_historical',
    description: 'Fetch historical F&O data. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Symbol name',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        instrument_type: {
          type: 'string',
          description: 'Instrument type (FUTIDX, FUTSTK, OPTIDX, OPTSTK)',
        },
        expiry_date: {
          type: 'string',
          description: 'Expiry date (YYYY-MM-DD)',
        },
      }),
      required: ['symbol', 'from_date', 'to_date'],
    },
  },
  {
    name: 'nse_vix_historical',
    description: 'Fetch historical VIX (volatility index) data. Use max_items and fields to limit large responses.',
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
      }),
    },
  },

  // Options & Derivatives Tools (V3 API - Recommended)
  {
    name: 'nse_get_expiry_dates',
    description:
      'Get all available option expiry dates for a symbol. CALL THIS FIRST before using other option chain tools to get valid expiry dates. Returns dates sorted chronologically in DD-Mon-YYYY format (e.g., "12-Dec-2024", "19-Dec-2024"). Works for index options (NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY) and stock options (RELIANCE, TCS, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description:
            'Trading symbol. For indices use: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY. For stocks use NSE symbol like RELIANCE, TCS, INFY, HDFCBANK.',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'nse_option_chain',
    description:
      'Get complete option chain data for a symbol with all strikes and expiries. Returns full CE (Call) and PE (Put) data including lastPrice, openInterest, impliedVolatility, change, volume for each strike. Best for comprehensive analysis. For large symbols like NIFTY, use nse_filtered_option_chain instead to reduce data size. Expiry defaults to nearest if not specified.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description:
            'Trading symbol. Index options: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY. Stock options: RELIANCE, TCS, INFY, etc.',
        },
        expiry: {
          type: 'string',
          description:
            'Expiry date in DD-Mon-YYYY format (e.g., "12-Dec-2024"). Get valid dates from nse_get_expiry_dates. If omitted, uses nearest expiry.',
        },
        type: {
          type: 'string',
          description:
            'Option type - "Indices" for index options (NIFTY, BANKNIFTY), "Equity" for stock options. Auto-detected based on symbol if not provided.',
          enum: ['Indices', 'Equity'],
        },
      }),
      required: ['symbol'],
    },
  },
  {
    name: 'nse_filtered_option_chain',
    description:
      'Get a compact option chain with only essential data around ATM (At-The-Money) strikes. RECOMMENDED for LLM usage - reduces response size by ~90% while keeping key metrics: lastPrice, openInterest, changeinOpenInterest, impliedVolatility, totalTradedVolume for both CE and PE. Returns: symbol, underlyingValue, atmStrike, timestamp, and filtered strike data.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description:
            'Trading symbol. Index options: NIFTY, BANKNIFTY, FINNIFTY. Stock options: RELIANCE, TCS, INFY, etc.',
        },
        expiry: {
          type: 'string',
          description:
            'Expiry date in DD-Mon-YYYY format (e.g., "12-Dec-2024"). Get valid dates from nse_get_expiry_dates. If omitted, uses nearest expiry.',
        },
        strike_range: {
          type: 'number',
          description:
            'Number of strikes to include above and below ATM strike. Default: 10 (returns 21 strikes total). Use 5 for minimal data, 15-20 for wider analysis.',
        },
      }),
      required: ['symbol'],
    },
  },
  {
    name: 'nse_compile_option_chain',
    description:
      'Get pre-calculated option chain analytics for a specific expiry. Returns comprehensive metrics: ATM strike, max pain level, Put-Call Ratio (PCR), max Call OI strike, max Put OI strike, total Call/Put OI, and full chain with per-strike PCR. Best for quick market sentiment analysis without manual calculations.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description:
            'Trading symbol. Index options: NIFTY, BANKNIFTY, FINNIFTY. Stock options: RELIANCE, TCS, INFY, etc.',
        },
        expiry: {
          type: 'string',
          description:
            'Expiry date in DD-Mon-YYYY format (e.g., "12-Dec-2024"). REQUIRED - get valid dates from nse_get_expiry_dates first.',
        },
      }),
      required: ['symbol', 'expiry'],
    },
  },
  {
    name: 'nse_calculate_max_pain',
    description:
      'Calculate the max pain strike price for options. Max pain is the strike price where option buyers would lose the most money (and option writers profit most) at expiry. Useful for predicting potential expiry settlement levels. Returns a single strike price number.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description:
            'Trading symbol. Index options: NIFTY, BANKNIFTY, FINNIFTY. Stock options: RELIANCE, TCS, INFY, etc.',
        },
        expiry: {
          type: 'string',
          description:
            'Expiry date in DD-Mon-YYYY format (e.g., "12-Dec-2024"). REQUIRED - get valid dates from nse_get_expiry_dates first.',
        },
      },
      required: ['symbol', 'expiry'],
    },
  },
  {
    name: 'nse_fno_lots',
    description: 'Get F&O lot sizes for all symbols. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_futures_expiry',
    description: 'Get futures expiry dates',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'string',
          description: 'Index name (nifty, banknifty, finnifty)',
          enum: ['nifty', 'banknifty', 'finnifty'],
        },
      },
    },
  },

  // Corporate Information Tools
  {
    name: 'nse_corporate_actions',
    description: 'Get corporate actions (dividends, splits, bonuses). Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Stock symbol (optional)',
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
        },
      }),
    },
  },
  {
    name: 'nse_corporate_announcements',
    description: 'Get corporate announcements. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Stock symbol (optional)',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      }),
    },
  },
  {
    name: 'nse_board_meetings',
    description: 'Get board meeting information. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Stock symbol (optional)',
        },
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      }),
    },
  },
  {
    name: 'nse_annual_reports',
    description: 'Get annual reports for a company. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        symbol: {
          type: 'string',
          description: 'Stock symbol',
        },
        segment: {
          type: 'string',
          description: 'Market segment (default: equities)',
        },
      }),
      required: ['symbol'],
    },
  },
  {
    name: 'nse_circulars',
    description: 'Get NSE circulars. Use max_items and fields to limit large responses.',
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
      }),
    },
  },

  // IPO Tools
  {
    name: 'nse_current_ipos',
    description: 'List current/ongoing IPOs',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'nse_upcoming_ipos',
    description: 'List upcoming IPOs',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'nse_past_ipos',
    description: 'List past IPOs',
    inputSchema: {
      type: 'object',
      properties: {
        from_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      },
    },
  },
  {
    name: 'nse_ipo_details',
    description: 'Get detailed IPO information',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'IPO symbol',
        },
      },
      required: ['symbol'],
    },
  },

  // Market Activity Tools
  {
    name: 'nse_block_deals',
    description: 'Get block deals data. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_bulk_deals',
    description: 'Get bulk deals data. Use max_items and fields to limit large responses.',
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
      }),
      required: ['from_date', 'to_date'],
    },
  },
  {
    name: 'nse_holidays',
    description: 'Get market holidays',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Holiday type (trading or clearing)',
          enum: ['trading', 'clearing'],
        },
      },
    },
  },

  // Lists & Metadata Tools
  {
    name: 'nse_list_indices',
    description: 'List all NSE indices. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_list_stocks_by_index',
    description: 'List all stocks in an index. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({
        index: {
          type: 'string',
          description: 'Index name (default: NIFTY 50)',
        },
      }),
    },
  },
  {
    name: 'nse_list_etf',
    description: 'List all ETFs. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_list_sme',
    description: 'List all SME stocks. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_list_sgb',
    description: 'List all Sovereign Gold Bonds. Use max_items and fields to limit large responses.',
    inputSchema: {
      type: 'object',
      properties: addFilterProperties({}),
    },
  },
  {
    name: 'nse_equity_meta_info',
    description: 'Get metadata for an equity symbol',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock symbol',
        },
      },
      required: ['symbol'],
    },
  },

  // Download Tools
  {
    name: 'nse_download_equity_bhavcopy',
    description: 'Download equity bhavcopy report. Use max_items and fields to limit large responses.',
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
    name: 'nse_download_delivery_bhavcopy',
    description: 'Download delivery bhavcopy report. Use max_items and fields to limit large responses.',
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
    name: 'nse_download_indices_bhavcopy',
    description: 'Download indices bhavcopy report. Use max_items and fields to limit large responses.',
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
    name: 'nse_download_fno_bhavcopy',
    description: 'Download F&O bhavcopy report. Use max_items and fields to limit large responses.',
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
];

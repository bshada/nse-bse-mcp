import { NSEClient } from 'nse-bse-api';
import { formatLimitedResponse, LimitOptions } from '../utils/response-limiter.js';

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

function extractLimitOptions(args: Record<string, any>): LimitOptions {
  return {
    maxItems: args.max_items,
    fields: args.fields,
    summary: args.summary,
  };
}

export async function handleNseTool(
  name: string,
  args: Record<string, any>,
  nse: NSEClient
): Promise<any> {
  try {
    let result: any;

    switch (name) {
      // Market Data
      case 'nse_get_market_status':
        result = await nse.status();
        break;

      case 'nse_equity_quote':
        result = await nse.equityQuote(args.symbol);
        break;

      case 'nse_get_quote':
        result = await nse.quote({
          symbol: args.symbol,
          segment: args.segment,
        });
        break;

      case 'nse_lookup_symbol':
        result = await nse.lookup(args.query);
        break;

      case 'nse_get_gainers': {
        const data = await nse.listEquityStocksByIndex('NIFTY 50');
        result = nse.gainers(data, args.count || 10);
        break;
      }

      case 'nse_get_losers': {
        const data = await nse.listEquityStocksByIndex('NIFTY 50');
        result = nse.losers(data, args.count || 10);
        break;
      }

      // Historical Data
      case 'nse_equity_historical':
        result = await nse.fetch_equity_historical_data({
          symbol: args.symbol,
          from_date: parseDate(args.from_date),
          to_date: parseDate(args.to_date),
          series: args.series || 'EQ',
        });
        break;

      case 'nse_index_historical':
        result = await nse.fetch_historical_index_data({
          index: args.index,
          from_date: parseDate(args.from_date),
          to_date: parseDate(args.to_date),
        });
        break;

      case 'nse_fno_historical':
        result = await nse.fetch_historical_fno_data({
          symbol: args.symbol,
          from_date: parseDate(args.from_date),
          to_date: parseDate(args.to_date),
          instrument_type: args.instrument_type,
          expiry_date: args.expiry_date ? parseDate(args.expiry_date) : undefined,
        });
        break;

      case 'nse_vix_historical':
        result = await nse.fetch_historical_vix_data({
          from_date: args.from_date ? parseDate(args.from_date) : undefined,
          to_date: args.to_date ? parseDate(args.to_date) : undefined,
        });
        break;

      // Options & Derivatives
      case 'nse_option_chain':
        result = await nse.optionChain(args.symbol);
        break;

      case 'nse_filtered_option_chain':
        result = await nse.filteredOptionChain(args.symbol, args.strike_range);
        break;

      case 'nse_compile_option_chain':
        result = await nse.compileOptionChain(
          args.symbol,
          parseDate(args.expiry_date)
        );
        break;

      case 'nse_calculate_max_pain': {
        const optionChain = await nse.optionChain(args.symbol);
        result = NSEClient.maxpain(optionChain, parseDate(args.expiry_date));
        break;
      }

      case 'nse_fno_lots':
        result = await nse.fnoLots();
        break;

      case 'nse_futures_expiry':
        result = await nse.getFuturesExpiry(args.index || 'nifty');
        break;

      // Corporate Information
      case 'nse_corporate_actions':
        result = await nse.actions({
          symbol: args.symbol,
          from_date: args.from_date ? parseDate(args.from_date) : undefined,
          to_date: args.to_date ? parseDate(args.to_date) : undefined,
          segment: args.segment,
        });
        break;

      case 'nse_corporate_announcements':
        result = await nse.announcements({
          symbol: args.symbol,
          from_date: args.from_date ? parseDate(args.from_date) : undefined,
          to_date: args.to_date ? parseDate(args.to_date) : undefined,
        });
        break;

      case 'nse_board_meetings':
        result = await nse.boardMeetings({
          symbol: args.symbol,
          from_date: args.from_date ? parseDate(args.from_date) : undefined,
          to_date: args.to_date ? parseDate(args.to_date) : undefined,
        });
        break;

      case 'nse_annual_reports':
        result = await nse.annual_reports(args.symbol, args.segment || 'equities');
        break;

      case 'nse_circulars':
        result = await nse.circulars({
          from_date: args.from_date ? parseDate(args.from_date) : undefined,
          to_date: args.to_date ? parseDate(args.to_date) : undefined,
        });
        break;

      // IPO
      case 'nse_current_ipos':
        result = await nse.listCurrentIPO();
        break;

      case 'nse_upcoming_ipos':
        result = await nse.listUpcomingIPO();
        break;

      case 'nse_past_ipos':
        result = await nse.listPastIPO(
          args.from_date ? parseDate(args.from_date) : undefined,
          args.to_date ? parseDate(args.to_date) : undefined
        );
        break;

      case 'nse_ipo_details':
        result = await nse.getIpoDetails({ symbol: args.symbol });
        break;

      // Market Activity
      case 'nse_block_deals':
        result = await nse.blockDeals();
        break;

      case 'nse_bulk_deals':
        result = await nse.bulkdeals(
          parseDate(args.from_date),
          parseDate(args.to_date)
        );
        break;

      case 'nse_holidays':
        result = await nse.holidays(args.type || 'trading');
        break;

      // Lists & Metadata
      case 'nse_list_indices':
        result = await nse.listIndices();
        break;

      case 'nse_list_stocks_by_index':
        result = await nse.listEquityStocksByIndex(args.index);
        break;

      case 'nse_list_etf':
        result = await nse.listEtf();
        break;

      case 'nse_list_sme':
        result = await nse.listSme();
        break;

      case 'nse_list_sgb':
        result = await nse.listSgb();
        break;

      case 'nse_equity_meta_info':
        result = await nse.equityMetaInfo(args.symbol);
        break;

      // Downloads
      case 'nse_download_equity_bhavcopy':
        result = await nse.equityBhavcopy(parseDate(args.date));
        break;

      case 'nse_download_delivery_bhavcopy':
        result = await nse.deliveryBhavcopy(parseDate(args.date));
        break;

      case 'nse_download_indices_bhavcopy':
        result = await nse.indicesBhavcopy(parseDate(args.date));
        break;

      case 'nse_download_fno_bhavcopy':
        result = await nse.fnoBhavcopy(parseDate(args.date));
        break;

      default:
        throw new Error(`Unknown NSE tool: ${name}`);
    }

    // Apply response limiting
    const limitOptions = extractLimitOptions(args);
    return formatLimitedResponse(result, limitOptions);
  } catch (error: any) {
    throw new Error(`NSE API Error: ${error.message}`);
  }
}

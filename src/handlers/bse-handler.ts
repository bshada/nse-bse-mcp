import { BSE } from 'nse-bse-api';
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

export async function handleBseTool(
  name: string,
  args: Record<string, any>,
  bse: BSE
): Promise<any> {
  try {
    let result: any;

    switch (name) {
      // Market Data
      case 'bse_quote':
        result = await bse.quote(args.scripcode);
        break;

      case 'bse_quote_weekly_hl':
        result = await bse.quoteWeeklyHL(args.scripcode);
        break;

      case 'bse_gainers':
        result = await bse.gainers({
          by: args.by,
          name: args.name,
          pctChange: args.pct_change,
        });
        break;

      case 'bse_losers':
        result = await bse.losers({
          by: args.by,
          name: args.name,
          pctChange: args.pct_change,
        });
        break;

      case 'bse_advance_decline':
        result = await bse.advanceDecline();
        break;

      case 'bse_near_52week':
        result = await bse.near52WeekHighLow({
          by: args.by,
          name: args.name,
        });
        break;

      // Historical Data
      case 'bse_index_historical':
        result = await bse.fetchHistoricalIndexData({
          index: args.index,
          fromDate: parseDate(args.from_date),
          toDate: parseDate(args.to_date),
          period: args.period || 'D',
        });
        break;

      case 'bse_all_indices_by_date':
        result = await bse.fetchAllIndicesDataByDate(parseDate(args.date));
        break;

      // Corporate Information
      case 'bse_corporate_actions':
        result = await bse.actions({
          segment: args.segment,
          fromDate: args.from_date ? parseDate(args.from_date) : undefined,
          toDate: args.to_date ? parseDate(args.to_date) : undefined,
          byDate: args.by_date,
          scripcode: args.scripcode,
          sector: args.sector,
          purposeCode: args.purpose_code,
        });
        break;

      case 'bse_announcements':
        result = await bse.announcements({
          pageNo: args.page_no,
          fromDate: args.from_date ? parseDate(args.from_date) : undefined,
          toDate: args.to_date ? parseDate(args.to_date) : undefined,
          segment: args.segment,
          scripcode: args.scripcode,
          category: args.category,
          subcategory: args.subcategory,
        });
        break;

      case 'bse_result_calendar':
        result = await bse.resultCalendar({
          fromDate: args.from_date ? parseDate(args.from_date) : undefined,
          toDate: args.to_date ? parseDate(args.to_date) : undefined,
          scripcode: args.scripcode,
        });
        break;

      // Search & Lookup
      case 'bse_lookup_symbol':
        result = await bse.lookupSymbol(args.text);
        break;

      case 'bse_get_scrip_name':
        result = await bse.getScripName(args.scripcode);
        break;

      case 'bse_get_scrip_code':
        result = await bse.getScripCode(args.scripname);
        break;

      case 'bse_list_securities':
        result = await bse.listSecurities({
          industry: args.industry,
          scripcode: args.scripcode,
          group: args.group,
          segment: args.segment,
          status: args.status,
        });
        break;

      // Report Downloads
      case 'bse_download_bhavcopy':
        result = await bse.bhavcopyReport(parseDate(args.date));
        break;

      case 'bse_download_delivery':
        result = await bse.deliveryReport(parseDate(args.date));
        break;

      // Metadata
      case 'bse_fetch_index_names':
        result = await bse.fetchIndexNames();
        break;

      case 'bse_fetch_index_metadata':
        result = await bse.fetchIndexReportMetadata();
        break;

      default:
        throw new Error(`Unknown BSE tool: ${name}`);
    }

    // Apply response limiting
    const limitOptions = extractLimitOptions(args);
    return formatLimitedResponse(result, limitOptions);
  } catch (error: any) {
    throw new Error(`BSE API Error: ${error.message}`);
  }
}

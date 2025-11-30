/**
 * Response Limiter Utility
 * 
 * Limits response data to prevent overwhelming the LLM with too much information.
 * Maximum: 3500 words per response
 * 
 * When data exceeds limit, returns metadata to help LLM make informed decisions
 * about what filters to apply.
 */

const MAX_WORDS = 3500;
const CHARS_PER_WORD = 5; // Average characters per word
const MAX_CHARS = MAX_WORDS * CHARS_PER_WORD; // ~17,500 characters

export interface LimitOptions {
  maxItems?: number;
  fields?: string[];
  summary?: boolean;
}

export interface ResponseMetadata {
  totalItems?: number;
  totalWords: number;
  estimatedTokens: number;
  availableFields?: string[];
  schema?: any;
  sampleData?: any;
  exceedsLimit: boolean;
  recommendedFilters?: {
    maxItems?: number;
    suggestedFields?: string[];
  };
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Truncate text to word limit
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  
  const truncated = words.slice(0, maxWords).join(' ');
  const remaining = words.length - maxWords;
  return `${truncated}\n\n[... ${remaining} more words truncated. Use filters to get specific data.]`;
}

/**
 * Limit array data by selecting specific fields and limiting items
 */
export function limitArrayData(
  data: any[],
  options: LimitOptions = {}
): any[] {
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }

  let result = data;

  // Apply item limit
  if (options.maxItems && options.maxItems > 0) {
    result = result.slice(0, options.maxItems);
  }

  // Apply field filtering
  if (options.fields && options.fields.length > 0 && result.length > 0) {
    const fields = options.fields; // Type narrowing
    result = result.map(item => {
      if (typeof item !== 'object' || item === null) {
        return item;
      }
      
      const filtered: any = {};
      for (const field of fields) {
        if (field in item) {
          filtered[field] = item[field];
        }
      }
      return filtered;
    });
  }

  return result;
}

/**
 * Extract schema from data
 */
function extractSchema(data: any): any {
  if (Array.isArray(data) && data.length > 0) {
    const sample = data[0];
    if (typeof sample === 'object' && sample !== null) {
      const schema: any = {};
      for (const key in sample) {
        const value = sample[key];
        schema[key] = Array.isArray(value) ? 'array' : typeof value;
      }
      return schema;
    }
  } else if (typeof data === 'object' && data !== null) {
    const schema: any = {};
    for (const key in data) {
      const value = data[key];
      if (Array.isArray(value)) {
        schema[key] = { type: 'array', length: value.length };
      } else {
        schema[key] = typeof value;
      }
    }
    return schema;
  }
  return null;
}

/**
 * Get available fields from data
 */
function getAvailableFields(data: any): string[] | undefined {
  if (Array.isArray(data) && data.length > 0) {
    const sample = data[0];
    if (typeof sample === 'object' && sample !== null) {
      return Object.keys(sample);
    }
  } else if (typeof data === 'object' && data !== null) {
    return Object.keys(data);
  }
  return undefined;
}

/**
 * Create metadata about the response
 */
export function createResponseMetadata(data: any, wordCount: number): ResponseMetadata {
  const exceedsLimit = wordCount > MAX_WORDS;
  const totalItems = Array.isArray(data) ? data.length : undefined;
  const availableFields = getAvailableFields(data);
  const schema = extractSchema(data);
  
  // Get sample data (first 3 items for arrays, or subset for objects)
  let sampleData: any;
  if (Array.isArray(data)) {
    sampleData = data.slice(0, 3);
  } else if (typeof data === 'object' && data !== null) {
    sampleData = {};
    let count = 0;
    for (const key in data) {
      if (count < 5) {
        sampleData[key] = data[key];
        count++;
      }
    }
  }

  // Calculate recommended filters
  let recommendedFilters: ResponseMetadata['recommendedFilters'];
  if (exceedsLimit && Array.isArray(data) && data.length > 0) {
    // Calculate how many items would fit
    const sampleStr = JSON.stringify(data.slice(0, 3), null, 2);
    const wordsPerItem = countWords(sampleStr) / 3;
    const maxItems = Math.floor(MAX_WORDS / wordsPerItem);
    
    // Suggest most important fields (first 5-7 fields)
    const suggestedFields = availableFields?.slice(0, 7);
    
    recommendedFilters = {
      maxItems: Math.max(10, maxItems),
      suggestedFields,
    };
  }

  return {
    totalItems,
    totalWords: wordCount,
    estimatedTokens: Math.ceil(wordCount * 1.3), // Rough estimate: 1 word ≈ 1.3 tokens
    availableFields,
    schema,
    sampleData,
    exceedsLimit,
    recommendedFilters,
  };
}

/**
 * Create summary for array data
 */
export function createArraySummary(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return 'No data available';
  }

  const sample = data[0];
  const fields = typeof sample === 'object' && sample !== null 
    ? Object.keys(sample).join(', ')
    : 'N/A';

  return `Total items: ${data.length}\nAvailable fields: ${fields}\n\nFirst 3 items:\n${JSON.stringify(data.slice(0, 3), null, 2)}`;
}

/**
 * Main function to limit response data
 * Returns metadata when data is too large, allowing LLM to make informed decisions
 */
export function limitResponse(
  data: any,
  options: LimitOptions = {}
): { data: any; truncated: boolean; message?: string; metadata?: ResponseMetadata } {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return { data, truncated: false };
  }

  // Convert to JSON string to check size
  let jsonStr = JSON.stringify(data, null, 2);
  const wordCount = countWords(jsonStr);

  // If within limit, return as-is
  if (wordCount <= MAX_WORDS) {
    return { data, truncated: false };
  }

  // Data is too large - check if filters are applied
  const hasFilters = options.maxItems || options.fields || options.summary;

  // If no filters applied, return metadata to help LLM decide
  if (!hasFilters) {
    const metadata = createResponseMetadata(data, wordCount);
    
    return {
      data: {
        _metadata: metadata,
        _message: `Response is too large (${wordCount} words, ~${metadata.estimatedTokens} tokens). Please apply filters to get specific data.`,
        _instructions: metadata.recommendedFilters 
          ? `Recommended: Use max_items=${metadata.recommendedFilters.maxItems} or fields=${JSON.stringify(metadata.recommendedFilters.suggestedFields)}`
          : 'Use max_items, fields, or summary parameters to filter the response.',
      },
      truncated: true,
      message: `Response too large. Returning metadata. Total: ${metadata.totalItems || 'N/A'} items, ${wordCount} words.`,
      metadata,
    };
  }

  // Filters are applied - proceed with limiting
  let limitedData = data;
  let message = '';

  // Strategy 1: If it's an array, limit items and/or fields
  if (Array.isArray(data)) {
    if (options.summary) {
      return {
        data: createArraySummary(data),
        truncated: true,
        message: `Response too large (${wordCount} words). Showing summary. Use maxItems and fields filters to get specific data.`
      };
    }

    // Calculate how many items we can fit
    const sampleSize = Math.min(3, data.length);
    const sampleStr = JSON.stringify(data.slice(0, sampleSize), null, 2);
    const wordsPerItem = countWords(sampleStr) / sampleSize;
    const maxItems = Math.floor(MAX_WORDS / wordsPerItem);

    limitedData = limitArrayData(data, {
      maxItems: options.maxItems || maxItems,
      fields: options.fields
    });

    message = `Response limited: Showing ${limitedData.length} of ${data.length} items. `;
    if (options.fields) {
      message += `Fields: ${options.fields.join(', ')}. `;
    }
    message += `Use maxItems and fields parameters to customize.`;
  }
  // Strategy 2: If it's an object with array properties, limit those
  else if (typeof data === 'object') {
    limitedData = { ...data };
    const arrayKeys: string[] = [];

    for (const key in limitedData) {
      if (Array.isArray(limitedData[key]) && limitedData[key].length > 10) {
        arrayKeys.push(key);
        const originalLength = limitedData[key].length;
        limitedData[key] = limitedData[key].slice(0, 10);
        limitedData[`${key}_truncated`] = `Showing 10 of ${originalLength} items`;
      }
    }

    if (arrayKeys.length > 0) {
      message = `Large arrays truncated: ${arrayKeys.join(', ')}. Use specific queries to get complete data.`;
    }
  }

  // Final check: if still too large, truncate the JSON string
  jsonStr = JSON.stringify(limitedData, null, 2);
  if (countWords(jsonStr) > MAX_WORDS) {
    jsonStr = truncateToWords(jsonStr, MAX_WORDS);
    return {
      data: jsonStr,
      truncated: true,
      message: message || `Response truncated to ${MAX_WORDS} words. Use filters to get specific data.`
    };
  }

  return {
    data: limitedData,
    truncated: true,
    message: message || 'Response limited to prevent data overflow'
  };
}

/**
 * Format limited response for MCP
 */
export function formatLimitedResponse(result: any, options: LimitOptions = {}): any {
  const limited = limitResponse(result, options);
  
  let text = typeof limited.data === 'string' 
    ? limited.data 
    : JSON.stringify(limited.data, null, 2);

  // Add metadata information if present
  if (limited.metadata) {
    const meta = limited.metadata;
    let metaText = '\n\n📊 RESPONSE METADATA:\n';
    metaText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (meta.totalItems) metaText += `Total Items: ${meta.totalItems}\n`;
    metaText += `Total Words: ${meta.totalWords}\n`;
    metaText += `Estimated Tokens: ${meta.estimatedTokens}\n`;
    if (meta.availableFields) {
      metaText += `Available Fields: ${meta.availableFields.join(', ')}\n`;
    }
    if (meta.recommendedFilters) {
      metaText += `\n💡 RECOMMENDED FILTERS:\n`;
      if (meta.recommendedFilters.maxItems) {
        metaText += `  max_items: ${meta.recommendedFilters.maxItems}\n`;
      }
      if (meta.recommendedFilters.suggestedFields) {
        metaText += `  fields: ${JSON.stringify(meta.recommendedFilters.suggestedFields)}\n`;
      }
    }
    metaText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    text = metaText + '\n' + text;
  } else if (limited.truncated && limited.message) {
    text = `⚠️ ${limited.message}\n\n${text}`;
  }

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Common filter properties for limiting response data
 * These can be added to any tool that returns large datasets
 */

export const filterProperties = {
  max_items: {
    type: 'number',
    description: 'Maximum number of items to return (limits response size)',
  },
  fields: {
    type: 'array',
    items: { type: 'string' },
    description: 'Specific fields to include in response (e.g., ["symbol", "price", "change"])',
  },
  summary: {
    type: 'boolean',
    description: 'Return only summary instead of full data (useful for very large datasets)',
  },
};

/**
 * Helper to add filter properties to a tool's input schema
 */
export function addFilterProperties(properties: Record<string, any>): Record<string, any> {
  return {
    ...properties,
    ...filterProperties,
  };
}

import {
  fauxPaginate,
  sortByRelevancy,
  generateSearchQuery
} from './helpers';
import { paginate } from './paginate';

/**
 * Adds `athena` method to schema.
 * @param {object} schema - Mongo Collection
 * @param {object} options - plugin options
 */
export default function (schema, options) {
  // eslint-disable-next-line no-param-reassign
  schema.statics.athena = async function (args = {}) {
    const {
      query,
      term,
      sort,
      select,
      page = 1,
      limit,
      ...paginationOptions
    } = args;

    const searchTerm = term?.trim().toLowerCase();

    // Only perform relevancy if needed
    if (searchTerm && sort === 'relevancy') {
      const results = await sortByRelevancy({
        term: searchTerm,
        fields: options.fields,
        select,
        sort,
        query,
        model: this
      });

      return fauxPaginate({
        page,
        limit,
        results
      });
    }
    
    if (searchTerm) {
      const searchQuery = generateSearchQuery({
        fields: options.fields,
        query,
        term
      });

      return paginate.apply(this, [searchQuery, { ...paginationOptions, page, limit }]);
    }

    return paginate.apply(this, [query, { ...paginationOptions, page, limit }]);
  };
}
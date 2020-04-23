import mongoose from 'mongoose';
import jaroWinkler from 'talisman/metrics/jaro-winkler';

const { Model } = mongoose;

export const DEFAULT_THRESHOLD = 0; // 0..1
const DEFAULT_MIN_SIZE = 2;
const DEFAULT_PREFIX_ONLY = false;
const DEFAULT_WEIGHT = 1;

export const calculateScore = ({
  threshold = 0,
  items,
  term,
  weight = 1
}) => {
  return items.reduce((prev, word, index) => {
    // Calculate how similar searchTerm is to word
    const score = jaroWinkler(term, word.toLowerCase());
    if (score && score >= threshold) {
      // Score is computed based on where it appears in the text.
      // Nearer the start is weighted more highly.
      // eslint-disable-next-line no-param-reassign
      return prev += (score + ((items.length - index) / items.length)) * weight;
    }
    return prev;
  }, 0);
};

export const generateSearchQuery = ({ query, fields, term }) => {
  const orQuery = fields.reduce((accum, field) => {
    if (!term || term.length < (field.minSize || DEFAULT_MIN_SIZE)) {
      // term is too small for the field's minSize
      return accum;
    }

    return [
      ...accum,
      {
        [field.name]: {
          $regex: (field.prefixOnly || DEFAULT_PREFIX_ONLY) ? new RegExp(`^${ term }`) : term,
          $options: 'mi'
        }
      }
    ];
  }, []);

  return {
    $and: [
      query,
      { ...orQuery.length ? { $or: orQuery } : null }
    ]
  };
};

export const sortByRelevancy = async (args) => {
  const {
    term,
    fields,
    select,
    sort,
    query,
    model
  } = args;

  const search = generateSearchQuery({
    query,
    fields,
    term
  });

  // Do not hit database if term is lower than any field's minSize.
  
  // Find the lowest field size
  const lowestFieldSize = fields.reduce((accum, field) => (
    Math.min(accum, field.minSize || DEFAULT_MIN_SIZE)
  ), DEFAULT_MIN_SIZE);

  if (!term || term.length < lowestFieldSize) {
    return [];
  }

  const isAggregate = !!query._pipeline;
  const results = isAggregate
    ? await Model.aggregate.apply(model, [query._pipeline])
      .sort(sort)
    : await Model.find.apply(model, [search, {}, { sort }])
      .select(select)
      .lean();

  // Give each entry a confidence score to sort by
  // This is based on Jaro–Winkler distance to match similar strings
  const weighted = results.reduce((accum, result) => {
    const confidenceScore = fields.reduce((prev, item) => {
      const items = result[item.name] ? result[item.name].split(' ') : [];

      const weight = item.name.includes('email') && term.includes('@') ? (item.weight || DEFAULT_WEIGHT) * 2 : item.weight || DEFAULT_WEIGHT;
      
      const score = calculateScore({
        items,
        term,
        threshold: item.threshold,
        weight
      });
      return prev + score;
    }, 0);

    // Return result with confidenceScore
    return [
      ...accum,
      {
        ...result,
        confidenceScore
      }
    ];
  }, []);

  // Sort by confidenceScore (highest to lowest)
  return weighted.sort((a, b) => b.confidenceScore - a.confidenceScore);
};

export const fauxPaginate = ({ page, limit, results }) => {
  const offset = ((page - 1) * limit) || 0;
  const docs = results.slice(offset, limit + offset);
  const nextPage = page * limit < results.length ? page + 1 : null;
  const prevPage = page === 1 ? null : page - 1;

  return {
    docs,
    pagination: {
      page,
      nextPage,
      prevPage,
      total: results.length,
      hasNextPage: !!nextPage,
      hasPrevPage: !!prevPage
    }
  };
};
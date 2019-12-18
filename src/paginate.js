const defaultOptions = {
  collation: {},
  lean: false,
  leanWithId: true,
  limit: 20,
  projection: {},
  select: '',
  options: {},
  pagination: true,
  // aggregate specific
  allowDiskUse: false
};

/**
 * @param {Object}              [query={}]
 * @param {Object}              [options={}]
 * @param {Object|String}       [options.select='']
 * @param {Object|String}       [options.projection={}]
 * @param {Object}              [options.options={}]
 * @param {Object|String}       [options.sort]
 * @param {Object|String}       [options.customLabels]
 * @param {Object}              [options.collation]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean}             [options.lean=false]
 * @param {Boolean}             [options.leanWithId=true]
 * @param {Number}              [options.offset=0] - Use offset or page to set skip position
 * @param {Number}              [options.page=1]
 * @param {Number}              [options.limit=20]
 * @param {Object}              [options.read={}] - Determines the MongoDB nodes from which to read.
 * @param {Function}            [callback]
 *
 * @returns {Promise}
 */
export function paginate(query, opts) {
  const options = {
    ...defaultOptions,
    ...paginate.options,
    ...opts
  };

  const {
    lean,
    leanWithId,
    populate,
    projection,
    read,
    select,
    sort,
    pagination,
    allowDiskUse,
    isAggregate
  } = options;

  const limit = options.limit > 0 ? Number(options.limit) : 0;
  const findOptions = options.options;

  let offset;
  let page;
  let skip;

  if (options.offset) {
    offset = Number(options.offset);
    skip = offset;
  } else if (options.page) {
    page = Number(options.page);
    skip = (page - 1) * limit;
  } else {
    offset = 0;
    page = 1;
    skip = offset;
  }

  const constructRegularQuery = () => {
    const countPromise = this.countDocuments(query).exec();

    if (limit) {
      const mQuery = this.find(query, projection, findOptions);
      mQuery.select(select);
      mQuery.sort(sort);
      mQuery.lean(lean);
  
      if (read && read.pref) {
        /**
         * Determines the MongoDB nodes from which to read.
         * @param read.pref one of the listed preference options or aliases
         * @param read.tags optional tags for this query
         */
        mQuery.read(read.pref, read.tags);
      }
  
      if (populate) {
        mQuery.populate(populate);
      }
  
      if (pagination) {
        mQuery.skip(skip);
        mQuery.limit(limit);
      }
  
      let docsPromise = mQuery.exec();
  
      if (lean && leanWithId) {
        docsPromise = docsPromise.then((docs) => {
          docs.forEach((doc) => {
            return {
              ...doc,
              id: String(doc._id)
            };
          });
          return docs;
        });
      }

      return [countPromise, docsPromise];
    }
    return [countPromise, []];
  };

  const constructAggregateQuery = () => {
    const mQuery = this.aggregate(query._pipeline);
    const countQuery = this.aggregate(mQuery._pipeline);
    mQuery.options = query.options;
    countQuery.options = query.options;
  
    if (sort) {
      mQuery.sort(sort);
    }
    
    if (allowDiskUse) {
      mQuery.allowDiskUse(true);
      countQuery.allowDiskUse(true);
    }

    const docsPromise = mQuery
      .skip(skip)
      .limit(limit)
      .exec();

    const countPromise = countQuery.group({
      _id: null,
      count: {
        $sum: 1
      }
    }).exec();
    return [countPromise, docsPromise];
  };

  const promises = isAggregate ? constructAggregateQuery() : constructRegularQuery();

  return Promise.all(promises)
    .then((values) => {
      const [count, docs] = values;
      const meta = {
        total: isAggregate ? count[0].count : count
      };

      let result = {};

      if (typeof offset !== 'undefined') {
        meta.offset = offset;
        page = Math.ceil((offset + 1) / limit);
      }

      const pages = (limit > 0) ? (Math.ceil(count / limit) || 1) : null;

      // Setting default values
      meta.limit = count;
      meta.pages = 1;
      meta.page = page;
      meta.pagingCounter = ((page - 1) * limit) + 1;

      meta.hasPrevPage = false;
      meta.hasNextPage = false;
      meta.prevPage = null;
      meta.nextPage = null;

      if (pagination) {
        meta.limit = limit;
        meta.pages = pages;

        // Set prev page
        if (page > 1) {
          meta.hasPrevPage = true;
          meta.prevPage = (page - 1);
        } else {
          meta.prevPage = null;
        }

        // Set next page
        if (page < pages) {
          meta.hasNextPage = true;
          meta.nextPage = (page + 1);
        } else {
          meta.nextPage = null;
        }
      }

      if (!limit) {
        meta.limit = 0;
        meta.totalPages = null;
        meta.page = null;
        meta.pagingCounter = null;
        meta.prevPage = null;
        meta.nextPage = null;
        meta.hasPrevPage = false;
        meta.hasNextPage = false;
      }

      result = {
        docs,
        pagination: meta
      };

      return Promise.resolve(result);
    }).catch((error) => {
      return Promise.reject(error);
    });
}
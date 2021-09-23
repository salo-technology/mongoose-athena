import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import generateData from '../__mocks__/data';
import Person from '../__mocks__/model';

const options = {
  autoIndex: true
};

let mongoServer;

jest.setTimeout(120000);

beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, options, (err) => {
    if (err) throw new Error(err);
  });

  await generateData();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('paginate', () => {
  it('returns a promise', () => {
    const promise = Person.athena();
    expect(typeof promise.then).toBe('function');
  });

  it('throws an error if the promise is rejected', async () => {
    jest.spyOn(Promise, 'all')
      .mockImplementationOnce(() => {
        return {
          then: () => Promise.reject('fail countDocuments')
        };
      });

    let error;
    try {
      await Person.athena({
        query: {},
        term: '',
        page: 1,
        limit: () => { throw new Error(); }
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBe('fail countDocuments');
  });
  
  it('should call populate', async () => {
    const spy = jest.fn();
    jest.spyOn(Person, 'find')
      .mockImplementationOnce(() => {
        return {
          select: _ => _,
          sort: _ => _,
          lean: _ => _,
          skip: _ => _,
          limit: _ => _,
          exec: _ => _,
          read: spy
        };
      });

    await Person.athena({
      query: {},
      term: '',
      page: 1,
      limit: 1,
      read: {
        pref: '123',
        tags: 'abc'
      }
    });
   
    expect(spy).toHaveBeenCalled();
  });

  it('should call populate', async () => {
    const spy = jest.fn();
    jest.spyOn(Person, 'find')
      .mockImplementationOnce(() => {
        return {
          select: _ => _,
          sort: _ => _,
          lean: _ => _,
          skip: _ => _,
          limit: _ => _,
          exec: _ => _,
          populate: spy
        };
      });

    await Person.athena({
      query: {},
      term: '',
      page: 1,
      limit: 1,
      populate: '_id'
    });
   
    expect(spy).toHaveBeenCalled();
  });

  it('sorts by relevancy', () => {
    const input = {
      query: {},
      limit: 1,
      page: 2,
      term: 'Will',
      sort: 'relevancy'
    };

    return Person.athena(input).then((result) => {
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].confidenceScore).toBeDefined();
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasPrevPage).toBe(true);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.prevPage).toBe(1);
      expect(result.pagination.nextPage).toBe(null);
    });
  });

  it('respects page and limit', () => {
    const opts = {
      query: {},
      limit: 5,
      page: 2,
      lean: true
    };

    return Person.athena(opts).then((result) => {
      expect(result.docs).toHaveLength(0);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pagingCounter).toBe(6);
      expect(result.pagination.hasPrevPage).toBe(true);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.prevPage).toBe(1);
      expect(result.pagination.nextPage).toBe(null);
      expect(result.pagination.totalPages).toBe(undefined);
    });
  });

  it('respect offset and limit (not page)', () => {
    const opts = {
      query: {},
      limit: 1,
      offset: 1,
      sort: {
        _id: 1
      },
      lean: true
    };

    return Person.athena(opts).then((result) => {
      expect(result.docs).toHaveLength(1);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pagingCounter).toBe(2);
      expect(result.pagination.hasPrevPage).toBe(true);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.prevPage).toBe(1);
      expect(result.pagination.nextPage).toBe(3);
      expect(result.pagination.totalPages).toBe(undefined);
    });
  });

  it('with limit=0 (only returns counts, no docs)', () => {
    const opt = {
      query: {},
      limit: 0,
      sort: {
        _id: 1
      },
      lean: true
    };

    return Person.athena(opt).then((result) => {
      expect(result.docs).toHaveLength(0);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.limit).toBe(0);
      expect(result.pagination.page).toBe(null);
      expect(result.pagination.pagingCounter).toBe(null);
      expect(result.pagination.hasPrevPage).toBe(false);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.prevPage).toBe(null);
      expect(result.pagination.nextPage).toBe(null);
      expect(result.pagination.totalPages).toBe(null);
    });
  });

  it('paginates with a search term', async () => {
    const opts = {
      query: {},
      term: 'Will',
      page: null,
      limit: 1
    };

    const result = await Person.athena(opts);

    expect(result.docs).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.limit).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pages).toBe(2);
    expect(result.pagination.pagingCounter).toBe(1);
    expect(result.pagination.hasPrevPage).toBe(false);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.prevPage).toBe(null);
    expect(result.pagination.nextPage).toBe(2);
  });
 
  it('only returns counts (no docs)', async () => {
    const opts = {
      query: {},
      pagination: false,
      page: null,
      limit: null
    };

    const result = await Person.athena(opts);

    expect(result.docs).toHaveLength(0);
    expect(result.pagination.total).toBe(4);
    expect(result.pagination.limit).toBe(0);
    expect(result.pagination.page).toBe(null);
    expect(result.pagination.pages).toBe(1);
    expect(result.pagination.pagingCounter).toBe(null);
    expect(result.pagination.hasPrevPage).toBe(false);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.prevPage).toBe(null);
    expect(result.pagination.nextPage).toBe(null);
    expect(result.pagination.totalPages).toBe(null);
  });

  it('fallsback to 1 when limit is set too high', async () => {
    const opts = {
      query: {
        name: 'Does not exist'
      },
      limit: 1,
      page: 1
    };

    const result = await Person.athena(opts);

    expect(result.docs).toHaveLength(0);
    expect(result.pagination).toBeDefined();
  });
 
  it('does not call skip or limit if pagination is not set', async () => {
    const skipSpy = jest.fn();
    const limitSpy = jest.fn();
    jest.spyOn(Person, 'find')
      .mockImplementationOnce(() => {
        return {
          select: _ => _,
          sort: _ => _,
          lean: _ => _,
          skip: skipSpy,
          limit: limitSpy,
          exec: _ => _
        };
      });

    await Person.athena({
      query: {},
      term: '',
      page: 1,
      limit: 1,
      pagination: false
    });
   
    expect(skipSpy).not.toHaveBeenCalled();
    expect(limitSpy).not.toHaveBeenCalled();
  });

  it('handles aggregate queries', async () => {
    const term = 'William Shakespeare';
    // Generate the query for the first section of the search
    const firstTerm = term.split(' ')[0];
    const firstQuery = [
      { first_name: { $regex: firstTerm, $options: 'i' } },
      { last_name: { $regex: firstTerm, $options: 'i' } }
    ].filter(i => i);

    // Generate the query for the second section of the search
    const secondQuery = [
      { full_name: { $regex: term, $options: 'i' } },
      term.length >= 8 ? { email_address: { $regex: term, $options: 'i' } } : null // Only lookup on email address if term is >= 8 characters
    ].filter(i => i);
         
    const fullNameQuery = Person.aggregate([
      // 1a. find all the matches for first or last name or email address not belonging to you
      {
        $match: {
          $or: firstQuery
        }
      },
      // 1b. Project a virtual field which is the first and last name concatenated.
      {
        $project: {
          full_name: { $concat: ['$first_name', ' ', '$last_name'] },
          email_address: '$email_address',
          doc: '$$ROOT'
        }
      },
      // 1c. Perform the search against the full name
      {
        $match: {
          $or: secondQuery
        }
      }
    ]);
    const result = await Person.athena({
      query: fullNameQuery,
      limit: 10,
      sort: '-created_at',
      allowDiskUse: true
    });

    expect(result.docs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.pages).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pagingCounter).toBe(1);
    expect(result.pagination.hasPrevPage).toBe(false);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.prevPage).toBe(null);
    expect(result.pagination.nextPage).toBe(null);
  });

  it('handles aggregate queries with minimal options', async () => {
    const term = 'William Shakespeare';
    // Generate the query for the first section of the search
    const firstTerm = term.split(' ')[0];
    const firstQuery = [
      { first_name: { $regex: firstTerm, $options: 'i' } },
      { last_name: { $regex: firstTerm, $options: 'i' } }
    ].filter(i => i);

    // Generate the query for the second section of the search
    const secondQuery = [
      { full_name: { $regex: term, $options: 'i' } },
      term.length >= 8 ? { email_address: { $regex: term, $options: 'i' } } : null // Only lookup on email address if term is >= 8 characters
    ].filter(i => i);
         
    const fullNameQuery = Person.aggregate([
      // 1a. find all the matches for first or last name or email address not belonging to you
      {
        $match: {
          $or: firstQuery
        }
      },
      // 1b. Project a virtual field which is the first and last name concatenated.
      {
        $project: {
          full_name: { $concat: ['$first_name', ' ', '$last_name'] },
          email_address: '$email_address',
          doc: '$$ROOT'
        }
      },
      // 1c. Perform the search against the full name
      {
        $match: {
          $or: secondQuery
        }
      }
    ]);
    const result = await Person.athena({
      query: fullNameQuery,
      limit: 10
    });

    expect(result.docs).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.pages).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pagingCounter).toBe(1);
    expect(result.pagination.hasPrevPage).toBe(false);
    expect(result.pagination.hasNextPage).toBe(false);
    expect(result.pagination.prevPage).toBe(null);
    expect(result.pagination.nextPage).toBe(null);
  });
  
  it('should do nothing if no options are passed', async () => {
    const result = await Person.athena();

    expect(result.docs).toBeDefined();
    expect(result.pagination.total).toBeDefined();
  });
});
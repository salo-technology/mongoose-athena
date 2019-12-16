
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import generateData from '../__mocks__/data';
import Person from '../__mocks__/model';

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  autoIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
};

let mongoServer;

jest.setTimeout(120000);

beforeAll((done) => {
  mongoServer = new MongoMemoryServer();
  mongoServer
    .getConnectionString()
    .then((mongoUri) => {
      return mongoose.connect(mongoUri, options, (err) => {
        if (err) done(err);
      });
    })
    .then(() => {
      generateData().then(() => {
        done();
      });
    });
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
});
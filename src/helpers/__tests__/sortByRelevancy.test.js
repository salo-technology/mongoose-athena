import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { find } from 'lodash';

import generateData from '../../__mocks__/data';
import Person from '../../__mocks__/model';

import { sortByRelevancy } from '../index';

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
      generateData().then(() => done());
    });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('sortByRelevancy', () => {
  it('should search a model for matching results', async (done) => {
    const output = await sortByRelevancy({
      term: 'statistician',
      fields: [{
        name: 'name'
      }, {
        name: 'biography'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });


    const winkler = find(output, { name: 'William Winkler' });
    const jaro = find(output, { name: 'Matthew Jaro' });

    expect(winkler.confidenceScore).toBeGreaterThan(jaro.confidenceScore);

    done();
  });

  it('should handle fields which do not exist', async (done) => {
    const output = await sortByRelevancy({
      term: 'Matt',
      fields: [{
        name: 'name'
      }, {
        name: 'favourite_colour'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });

    expect(output.length).toBe(2);

    done();
  });
});
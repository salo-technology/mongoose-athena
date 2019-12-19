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
        name: 'last_name'
      }, {
        name: 'biography'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });


    const winkler = find(output, { last_name: 'Winkler' });
    const jaro = find(output, { last_name: 'Jaro' });

    expect(winkler.confidenceScore).toBeGreaterThan(jaro.confidenceScore);

    done();
  });

  it('should handle fields which do not exist', async (done) => {
    const output = await sortByRelevancy({
      term: 'Matt',
      fields: [{
        name: 'first_name'
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

  it('should weigh email fields heavily if it detects an @', async (done) => {
    const heavy = await sortByRelevancy({
      term: 'bill@',
      fields: [{
        name: 'email'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });
    const light = await sortByRelevancy({
      term: 'bill',
      fields: [{
        name: 'email'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });

    // The heavily weighted result should be roughly 2x the result without the weighting
    expect(heavy[0].confidenceScore).toBeCloseTo(light[0].confidenceScore * 2, 0.05);

    done();
  });

  it('should accept aggregate queries', async (done) => {
    const output = await sortByRelevancy({
      term: 'Will',
      fields: [{
        name: 'first_name'
      }],
      sort: 'relevancy',
      query: Person.aggregate([
        {
          $match: {
            first_name: 'William'
          }
        }
      ]),
      model: Person
    });

    expect(output).toHaveLength(2);

    done();
  });
});
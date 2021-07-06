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

describe('sortByRelevancy', () => {
  it('should search a model for matching results', async () => {
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
  });

  it('should handle fields which do not exist', async () => {
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

    expect(output).toHaveLength(2);
  });

  it('should weigh email fields heavily if it detects an @', async () => {
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
  });

  it('should accept aggregate queries', async () => {
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
  });
 
  it('should not call the database if term is less than any minSize', async () => {
    const output = await sortByRelevancy({
      term: 'M',
      fields: [{
        name: 'first_name'
      }],
      sort: 'relevancy',
      query: {},
      model: Person
    });

    const spy = jest.spyOn(Person, 'find');

    expect(output).toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
  });
});
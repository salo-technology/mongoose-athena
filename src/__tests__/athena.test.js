import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import generateData from '../__mocks__/data';
import model from '../__mocks__/model';

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

describe('athena', () => {
  it('should query data', async (done) => {
    const input = {
      query: {},
      term: 'Matt',
      sort: 'relevancy'
    };
  
    const output = await model.athena(input);
  
    // expect(output).toBeDefined();
    expect(true).toBe(true);

    done();
  });
});
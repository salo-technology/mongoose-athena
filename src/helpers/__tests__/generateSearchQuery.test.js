import { generateSearchQuery } from '../index';

describe('Generate search query', () => {
  it('should generate an object that Mongoose can use', () => {
    const input = {
      query: {},
      fields: [],
      term: ''
    };

    const output = generateSearchQuery(input);

    expect(output.$and).toBeDefined();
    expect(output.$and.length).toBe(2);
  });
  
  it('should not include fields where term is lower than minSize', () => {
    const input = {
      query: {},
      fields: [{
        minSize: 6
      }],
      term: 'abc'
    };

    const output = generateSearchQuery(input);

    expect(output.$and.length).toBe(2);
    expect(output.$and[1].$or.length).toBe(0);
  });
  
  it('should include fields where term is greater than or equal to minSize', () => {
    const input = {
      query: {},
      fields: [{
        minSize: 6
      }],
      term: 'abcdef'
    };

    const output = generateSearchQuery(input);

    expect(output.$and).toBeDefined();
    expect(output.$and[1].$or.length).toBe(1);
  });

  it('should default to minSize of 2 if not set', () => {
    const input = {
      query: {},
      fields: [{
        name: 'test'
      }],
      term: 'ab'
    };

    const output = generateSearchQuery(input);

    expect(output.$and).toBeDefined();
    expect(output.$and[1].$or.length).toBe(1);
  });

  it('should change the regex term if prefixOnly is set', () => {
    const input = {
      query: {},
      fields: [{
        name: 'test',
        prefixOnly: true
      }],
      term: 'ab'
    };

    const output = generateSearchQuery(input);

    const testField = output.$and[1].$or[0].test;
    const regex = new RegExp(testField.$regex, testField.$options);

    expect('ab'.match(regex).length).toBe(1);
    expect('bab'.match(regex)).toBe(null);
  });

  it('should by default set prefixOnly to false', () => {
    const input = {
      query: {},
      fields: [{
        name: 'test'
      }],
      term: 'ab'
    };

    const output = generateSearchQuery(input);

    const testField = output.$and[1].$or[0].test;
    const regex = new RegExp(testField.$regex, testField.$options);

    expect('ab'.match(regex).length).toBe(1);
    expect('bab'.match(regex).length).toBe(1);
  });
});
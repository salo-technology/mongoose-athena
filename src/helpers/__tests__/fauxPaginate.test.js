import { isArray } from 'lodash';

import { fauxPaginate } from '../index';

describe('fauxPaginate', () => {
  it('should return input in a pagination structure', () => {
    const input = {
      page: 1,
      limit: 1,
      results: [1, 2]
    };
    const output = fauxPaginate(input);
    expect(isArray(output.docs)).toBe(true);
    expect(output.paginate.page).toBe(1);
    expect(output.paginate.nextPage).toBe(2);
    expect(output.paginate.prevPage).toBe(null);
    expect(output.paginate.total).toBe(2);
  });
  
  it('should not have a nextPage if no nextPage', () => {
    const input = {
      page: 1,
      limit: 2,
      results: [1, 2]
    };
    const output = fauxPaginate(input);
    expect(output.paginate.nextPage).toBe(null);
  });
  
  it('should have a prevPage if not the first page', () => {
    const input = {
      page: 2,
      limit: 1,
      results: [1, 2]
    };
    const output = fauxPaginate(input);
    expect(output.paginate.prevPage).toBe(1);
  });
  
  it('should correctly offset results', () => {
    const input = {
      page: 2,
      limit: 1,
      results: [1, 2, 3]
    };
    const output = fauxPaginate(input);
    expect(JSON.stringify(output.docs)).toBe(JSON.stringify([2]));
  });
});
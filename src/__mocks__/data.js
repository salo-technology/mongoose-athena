import Person from './model';

export default async function generateData() {
  new Person({
    name: 'William Winkler',
    biography: 'A statistician working at the U.S. Census Bureau.'
  }).save();

  new Person({
    name: 'William Shakespeare',
    biography: 'Was a playwright.'
  }).save();

  new Person({
    name: 'Matthew Perry',
    biography: 'Matt Perry is a North American actor.'
  }).save();

  return new Person({
    name: 'Matthew Jaro',
    biography: 'Matthew is a North American statistician.'
  }).save();
}
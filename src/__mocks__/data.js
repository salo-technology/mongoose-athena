import Person from './model';

export default async function generateData() {
  new Person({
    first_name: 'William',
    last_name: 'Winkler',
    biography: 'A statistician working at the U.S. Census Bureau.'
  }).save();

  new Person({
    first_name: 'William',
    last_name: 'Shakespeare',
    biography: 'Was a playwright.'
  }).save();

  new Person({
    first_name: 'Matthew',
    last_name: 'Perry',
    biography: 'Matt Perry is a North American actor.'
  }).save();

  return new Person({
    first_name: 'Matthew',
    last_name: 'Jaro',
    biography: 'Matthew is a North American statistician.'
  }).save();
}
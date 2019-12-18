import mongoose, { Schema } from 'mongoose';

import Athena from '../index';

const PersonSchema = new Schema({
  first_name: String,
  last_name: String,
  biography: String,
  email: String
});

PersonSchema.plugin(Athena, {
  fields: [{
    name: 'first_name',
    prefixOnly: true,
    threshold: 0.3,
    weight: 2
  }, {
    name: 'last_name',
    prefixOnly: true,
    threshold: 0.3,
    weight: 2
  }, {
    name: 'biography',
    minSize: 4
  }, {
    name: 'email',
    minSize: 8
  }]
});

const Person = mongoose.model('Person', PersonSchema);

export default Person;
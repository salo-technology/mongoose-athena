import mongoose, { Schema } from 'mongoose';

import Athena from '../index';

const PersonSchema = new Schema({
  name: String,
  biography: String
});

PersonSchema.plugin(Athena, {
  fields: [{
    name: 'name',
    prefixOnly: true,
    threshold: 0.3,
    weight: 2
  }, {
    name: 'biography',
    minSize: 4
  }]
});

const Person = mongoose.model('Person', PersonSchema);

export default Person;
# mongoose-athena

A simple plugin to add weighted search and pagination to your schema.

## Usage

Install

```
yarn add @salo/mongoose-athena
```

Add Athena to your schema:

```javascript
const athena = require('@salo/mongoose-athena');

MySchema.plugin(athena, {
  fields: [{
    name: 'name',
    prefixOnly: true,
    threshold: 0.3,
    weight: 2
  }, {
    name: 'description',
    minSize: 4
  }]
});

```

Then, to use it:

```javascript
MySchema.athena({
  query: { /* something to filter the collection */ },
  term: 'Athena',
  sort: 'relevancy',
  page: 1,
  limit: 20
});
```

This will search `name` and `description` for the term 'athena'. The result looks like so:

```javascript
{
  docs: [], // matching records in the collection
  paginate: {
    page: Number,
    nextPage: Number || null,
    prevPage: Number || null,
    total: Number
  }
}
```

## Publishing

1. Before opening a PR, run `yarn release:prep` locally to add changelog and increment version number on your branch
2. Open a PR from your feature back to master
3. When the development pipeline completes, hit merge and the publish pipeline will release your changes
4. If you want to deploy to GitHub pages then run `yarn release:ghp`. This should only be run from master so not before a PR is merged

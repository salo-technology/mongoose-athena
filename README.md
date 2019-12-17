# mongoose-athena

A plugin to add weighted search and pagination to your schema.

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
    name: 'biography',
    minSize: 4
  }]
});

```

Then, to use it with weighting you can do:

```javascript
MySchema.athena({
  query: { /* something to filter the collection */ },
  term: 'Athena',
  sort: 'relevancy', // this is the key to trigger weighting
  page: 1,
  limit: 20
});
```

This will search `name` and `biography` for the term 'athena'. If it is sorted by 'relevancy' then a `confidenceScore` will be attached to the result. The result looks like so:

```javascript
{
  docs: [], // matching records in the collection
  pagination: {
    page: Number,
    hasPrevPage: Boolean,
    hasNextPage: Boolean,
    nextPage: Number || null,
    prevPage: Number || null,
    total: Number
  }
}
```

Or you can use it simply to paginate:

```javascript
MySchema.athena({
  query: { /* something to filter the collection */ },
  term: 'Athena',
  sort: '-created_at', // this will not add `confidenceScore` to the results
  page: 1,
  limit: 20
});
```

## API

### Field options

| Field      | Description                                                                                                                                   | Type    | Default |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------|---------|
| name       | The field name in your collection                                                                                                             | String  |         |
| prefixOnly | Whether to only match from the start of the string or anywhere in the string e\.g\. 'ob' would match 'bob' with this off but not when it's on | Boolean | false   |
| threshold  | Value between 0 and 1\. It will only count a score if it is greater or equal to this value                                                    | Float   | 0       |
| minSize    | The length of the string to start matching against\. e\.g\. if minSize is 4 then the term 'bob' will not search against the field             | Int     | 2        |
| weight     | A scaling value to multiply scores by so you can weigh certain fields higher/lower than others                                                | Int     | 1       |


### Response

| Field                   | Description                             | Type          |
|-------------------------|-----------------------------------------|---------------|
| docs                    | Array of matching documents             | Array         |
| pagination\.page        | The current page                        | Int           |
| pagination\.hasPrevPage | Whether or not there is a previous page | Boolean       |
| pagination\.hasNextPage | Whether or not there is a next page     | Boolean       |
| pagination\.nextPage    | Value of the next page or null          | Int \|\| null |
| pagination\.prevPage    | Value of the previous page or null      | Int \|\| null |
| pagination\.total       | Total number of matching documents      | Int           |


## How it works

The crux of it lies in the `calculateScore` method in the helpers directory. This uses the [Jaro-Winkler distance](https://yomguithereal.github.io/talisman/metrics/distance#jaro-winkler) to compute how close your search term is (e.g. 'Athena') to the text in your database. Additionally text is ranked higher if it appears at the start rather than the end of a string so 'Athena Rogers' will have a higher `confidenceScore` than 'Rogers Athena'.

One thing to note is that the search term is not split on spaces but text on the database is. So using our previous example where `term = 'Athena Rogers'` the text in the database is split into `['Athena', 'Rogers']`. Now, `Athena Rogers` doesn't directly match 'Athena' or 'Rogers' (it scores 0.93 and 0.41 respectively) but this score is accumulated (0.93+0.41) and then multiplied by the position in the string and any weighting applied to the field. We could split the search term to get direct matches and higher scores but this would considerably slow the calculation of the score down by an order of magnitude as every part of the search term would need matching to every part of the field. In my testing the current approach lends itself to speed and logical weighting.

## Publishing

1. Before opening a PR, run `yarn release:prep` locally to add changelog and increment version number on your branch
2. Open a PR from your feature back to master
3. When the development pipeline completes, hit merge and the publish pipeline will release your changes
4. If you want to deploy to GitHub pages then run `yarn release:ghp`. This should only be run from master so not before a PR is merged

## Testing

Athena currently has 100% test coverage.

## Prior art (and disclaimer)

I'm not an expert in any of these fields and have very much relied on a few prior projects to reach this point. There's a very high chance there are more efficient ways to accomplish this and I welcome PRs to help this!

That said, many thanks to: 

* [Mongoose Paginate v2](https://github.com/aravindnc/mongoose-paginate-v2/) for the pagination logic
* [Fuzzy Scoring Regex Mayhem](https://j11y.io/javascript/fuzzy-scoring-regex-mayhem/) for the guidance on how to weigh results (note this library does not currently support fuzzy searching)
* [Efficient Techniques for Fuzzy and Partial matching in mongoDB](http://ilearnasigoalong.blogspot.com/2013/10/efficient-techniques-for-fuzzy-and.html) for an approach to different fuzzy matching techniques and showing me it's harder than it seems at first!
* [Mongoose Fuzzy Searching](https://github.com/VassilisPallas/mongoose-fuzzy-searching) for the inspiration for the API
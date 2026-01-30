const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const graphql = require("graphql");
const fetch = require("node-fetch");

const app = express();

// AniList GraphQL types
const DateType = new graphql.GraphQLObjectType({
  name: "Date",
  fields: {
    year: { type: graphql.GraphQLInt },
  },
});

const CoverImageType = new graphql.GraphQLObjectType({
  name: "CoverImage",
  fields: {
    large: { type: graphql.GraphQLString },
  },
});

const TitleType = new graphql.GraphQLObjectType({
  name: "Title",
  fields: {
    english: { type: graphql.GraphQLString },
  },
});

const MediaType = new graphql.GraphQLObjectType({
  name: "Media",
  fields: {
    episodes: { type: graphql.GraphQLInt },
    seasonInt: { type: graphql.GraphQLInt },
    coverImage: { type: CoverImageType },
    title: { type: TitleType },
    genres: { type: new graphql.GraphQLList(graphql.GraphQLString) },
    startDate: { type: DateType },
    description: { type: graphql.GraphQLString },
  },
});

const QueryRoot = new graphql.GraphQLObjectType({
  name: "Query",
  fields: () => ({
    hello: {
      type: graphql.GraphQLString,
      resolve: () => "Hello world!",
    },
    Media: {
      type: MediaType,
      args: {
        episodes: { type: graphql.GraphQLInt },
      },
      resolve: async (parent, args) => {
        const query = `
          query AnimeQuery($episodes: Int) {
            Media(episodes: $episodes) {
              episodes
              seasonInt
              coverImage {
                large
              }
              title {
                english
              }
              genres
              startDate {
                year
              }
              description
            }
          }
        `;

        const variables = { episodes: args.episodes };

        const response = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query, variables }),
        });

        const json = await response.json();
        return json.data.Media;
      },
    },
  }),
});

const schema = new graphql.GraphQLSchema({ query: QueryRoot });

const PORT = process.env.PORT ?? 3000;

app.use(
  "/api",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  }),
);
app.listen(PORT, () => console.log(`Server running on PORT: ${PORT} 🚀`));

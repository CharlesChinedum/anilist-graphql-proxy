const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const graphql = require("graphql");
const fetch = require("node-fetch");

const app = express();

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

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
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 🎬 Media query initiated`);
        console.log(`Arguments:`, JSON.stringify(args, null, 2));

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

        try {
          console.log(`📡 Fetching from AniList API...`);
          const startTime = Date.now();

          const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ query, variables }),
          });

          const duration = Date.now() - startTime;
          console.log(`⏱️  AniList API responded in ${duration}ms`);
          console.log(`Status: ${response.status} ${response.statusText}`);

          const json = await response.json();

          if (json.errors) {
            console.error(
              `❌ GraphQL Errors:`,
              JSON.stringify(json.errors, null, 2),
            );
            throw new Error(json.errors[0].message);
          }

          console.log(
            `✅ Successfully fetched anime: ${json.data?.Media?.title?.english || "Unknown"}`,
          );
          return json.data.Media;
        } catch (error) {
          console.error(`❌ Error fetching from AniList:`, error.message);
          console.error(`Stack trace:`, error.stack);
          throw error;
        }
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
    customFormatErrorFn: (error) => {
      console.error(`❌ GraphQL Error:`, error.message);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
      };
    },
  }),
);

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`❌ Server Error:`, err.message);
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Hello Chief, server running on PORT: ${PORT}`);
  console.log(`📊 GraphiQL available at: http://localhost:${PORT}/api`);
  console.log(`📝 Logging enabled - monitoring all endpoints`);
});

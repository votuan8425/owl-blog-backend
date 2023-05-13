// import { ApolloServer } from '@apollo/server';
// import { buildSchema } from "type-graphql";
// import { HelloResolver } from "./resolvers";
// import { UserResolver } from "./resolvers/user";
// import { PostResolver } from "./resolvers/post";
// import { Context } from "./types/Context";
// import { buildDataLoaders } from "./utils/dataLoaders";
// import { createConnection } from "typeorm";
// import { __prod__ } from './contanst';
// import { User } from './entities/User';
// import { Post } from './entities/Post';
// import { Upvote } from './entities/Upvote';

// const startServerAndCreateLambdaHandler = async () => {
//     const connection = await createConnection({
//         type: "postgres",
//         database: __prod__ ? process.env.POSTGRES_DB : "Reddit",
//         username: process.env.DB_USERNAME,
//         password: process.env.DB_PASSWORD,
//         logging: true,
//         ...(__prod__
//             ? {
//                 extra: {
//                     ssl: {
//                         rejectUnauthorized: false
//                     }
//                 },
//                 ssl: true
//             }
//             : {}),
//         ...(__prod__ ? {} : { synchronize: true }),
//         synchronize: false,
//         entities: [User, Post, Upvote]
//     });

//     const server = new ApolloServer({
//         schema: await buildSchema({
//             resolvers: [HelloResolver, UserResolver, PostResolver],
//             validate: false,
//         }),
//     });

//     return server.createHandler({
//         cors: {
//             origin: '*',
//             credentials: true,
//         },
//     });
// };

// export const graphqlHandler = startServerAndCreateLambdaHandler();

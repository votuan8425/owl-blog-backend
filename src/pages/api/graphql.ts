import Cors from 'micro-cors';
import { ApolloServer } from 'apollo-server-micro';
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { User } from '../../entities/User';
import { Upvote } from '../../entities/Upvote';
import { Post } from '../../entities/Post';
import { __prod__ } from '../../contanst';
import { buildDataLoaders } from '../..//utils/dataLoaders';
import { HelloResolver } from '../..//resolvers';
import { UserResolver } from '../..//resolvers/user';
import { PostResolver } from '../..//resolvers/post';
import { Context } from '../..//types/Context';
import { ApolloServerPluginInlineTrace } from 'apollo-server-core';

const cors = Cors({
    allowMethods: ['POST', 'OPTIONS'],
});

const main = async () => {
    const connection = await createConnection({
        type: "postgres",
        database: __prod__ ? process.env.POSTGRES_DB : "Reddit",
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        logging: true,
        ...(__prod__
            ? {
                extra: {
                    ssl: {
                        rejectUnauthorized: false
                    }
                },
                ssl: true
            }
            : {}),
        ...(__prod__ ? {} : { synchronize: true }),
        synchronize: false,
        entities: [User, Post, Upvote]
    });

    if (__prod__) await connection.runMigrations()

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, UserResolver, PostResolver],
            validate: false,
        }),
        context: ({ req, res }): Context => ({
            req,
            res,
            connection,
            dataLoaders: buildDataLoaders(),
        }),
        introspection: true,
        plugins: [ApolloServerPluginInlineTrace()],
    });

    await apolloServer.start()

    return apolloServer.createHandler({ path: '/api/graphql' });
}

export default cors(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.end();
    } else {
        const handler = await main();
        return await handler(req, res);
    }
});


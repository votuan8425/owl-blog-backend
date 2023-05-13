require('dotenv').config()
import "reflect-metadata"
import express from "express"

import { createConnection } from "typeorm"
import { User } from "./entities/User"
import { Post } from "./entities/Post"
import { Upvote } from "./entities/Upvote"
import { ApolloServer } from "apollo-server-micro"
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers"
import { UserResolver } from "./resolvers/user"
import mongoose from "mongoose"

import MongoStore from "connect-mongo"

import session from "express-session"

import { COOKIE_NAME, __prod__ } from "./contanst"
import { PostResolver } from "./resolvers/post"
import cors from "cors"
import { Context } from "./types/Context"
import { buildDataLoaders } from "./utils/dataLoaders"

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
    })

    if (__prod__) await connection.runMigrations()

    const app = express()

    app.use(
        cors({
            origin: __prod__
                ? process.env.CORS_ORIGIN_PROD
                : process.env.CORS_ORIGIN_DEV,
            credentials: true
        })
    )

    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@reddit-fullstack.dtw9y9h.mongodb.net/?retryWrites=true&w=majority`

    await mongoose.connect(mongoUrl, {
    })

    console.log('🚀 MongoDB Connected')

    app.use(
        session({
            name: COOKIE_NAME,
            store: MongoStore.create({ mongoUrl }),
            cookie: {
                maxAge: 1000 * 60 * 60, // one hour
                httpOnly: true, // JS front end cannot access the cookie
                secure: __prod__ ? true : false, // cookie only works in https
                sameSite: __prod__ ? 'none' : 'lax'
            },
            secret: process.env.SESSION_SECRET_DEV_PROD as string,
            saveUninitialized: false, // don't save empty sessions, right from the start
            resave: false
        })
    )


    const PORT = process.env.PORT || 4000

 // Create a new Apollo Server instance
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
    });

    await apolloServer.start()
    const handler = apolloServer.createHandler({ path: '/api/graphql' });

    app.use(handler);

    app.listen(4000, () => console.log(`🚀🚀🚀 Server Started on port on ${PORT}, GraphQL server started on  ${PORT}${apolloServer.graphqlPath}`))

}
main().catch(error => console.log(error))

export default main;


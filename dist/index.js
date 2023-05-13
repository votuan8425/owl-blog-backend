"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Post_1 = require("./entities/Post");
const Upvote_1 = require("./entities/Upvote");
const apollo_server_micro_1 = require("apollo-server-micro");
const type_graphql_1 = require("type-graphql");
const resolvers_1 = require("./resolvers");
const user_1 = require("./resolvers/user");
const mongoose_1 = __importDefault(require("mongoose"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const express_session_1 = __importDefault(require("express-session"));
const contanst_1 = require("./contanst");
const post_1 = require("./resolvers/post");
const cors_1 = __importDefault(require("cors"));
const dataLoaders_1 = require("./utils/dataLoaders");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield (0, typeorm_1.createConnection)(Object.assign(Object.assign(Object.assign({ type: "postgres", database: contanst_1.__prod__ ? process.env.POSTGRES_DB : "Reddit", username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, logging: true }, (contanst_1.__prod__
        ? {
            extra: {
                ssl: {
                    rejectUnauthorized: false
                }
            },
            ssl: true
        }
        : {})), (contanst_1.__prod__ ? {} : { synchronize: true })), { synchronize: false, entities: [User_1.User, Post_1.Post, Upvote_1.Upvote] }));
    if (contanst_1.__prod__)
        yield connection.runMigrations();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: contanst_1.__prod__
            ? process.env.CORS_ORIGIN_PROD
            : process.env.CORS_ORIGIN_DEV,
        credentials: true
    }));
    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@reddit-fullstack.dtw9y9h.mongodb.net/?retryWrites=true&w=majority`;
    yield mongoose_1.default.connect(mongoUrl, {});
    console.log('🚀 MongoDB Connected');
    app.use((0, express_session_1.default)({
        name: contanst_1.COOKIE_NAME,
        store: connect_mongo_1.default.create({ mongoUrl }),
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            secure: contanst_1.__prod__ ? true : false,
            sameSite: contanst_1.__prod__ ? 'none' : 'lax'
        },
        secret: process.env.SESSION_SECRET_DEV_PROD,
        saveUninitialized: false,
        resave: false
    }));
    const PORT = process.env.PORT || 4000;
    const apolloServer = new apollo_server_micro_1.ApolloServer({
        schema: yield (0, type_graphql_1.buildSchema)({
            resolvers: [resolvers_1.HelloResolver, user_1.UserResolver, post_1.PostResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            connection,
            dataLoaders: (0, dataLoaders_1.buildDataLoaders)(),
        }),
    });
    yield apolloServer.start();
    const handler = apolloServer.createHandler({ path: '/api/graphql' });
    app.use(handler);
    app.listen(4000, () => console.log(`🚀🚀🚀 Server Started on port on ${PORT}, GraphQL server started on  ${PORT}${apolloServer.graphqlPath}`));
});
main().catch(error => console.log(error));
exports.default = main;
//# sourceMappingURL=index.js.map
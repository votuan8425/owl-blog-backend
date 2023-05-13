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
const micro_cors_1 = __importDefault(require("micro-cors"));
const apollo_server_micro_1 = require("apollo-server-micro");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const User_1 = require("../../entities/User");
const Upvote_1 = require("../../entities/Upvote");
const Post_1 = require("../../entities/Post");
const contanst_1 = require("../../contanst");
const dataLoaders_1 = require("../..//utils/dataLoaders");
const resolvers_1 = require("../..//resolvers");
const user_1 = require("../..//resolvers/user");
const post_1 = require("../..//resolvers/post");
const apollo_server_core_1 = require("apollo-server-core");
const cors = (0, micro_cors_1.default)({
    allowMethods: ['POST', 'OPTIONS'],
});
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
        introspection: true,
        plugins: [(0, apollo_server_core_1.ApolloServerPluginInlineTrace)()],
    });
    yield apolloServer.start();
    return apolloServer.createHandler({ path: '/api/graphql' });
});
exports.default = cors((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        res.end();
    }
    else {
        const handler = yield main();
        return yield handler(req, res);
    }
}));
//# sourceMappingURL=graphql.js.map
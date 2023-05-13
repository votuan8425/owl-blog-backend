"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const UpdatePostInput_1 = require("../types/UpdatePostInput");
const type_graphql_1 = require("type-graphql");
const Post_1 = require("../entities/Post");
const Upvote_1 = require("../entities/Upvote");
const CreatePostInput_1 = require("../types/CreatePostInput");
const PostMutationResponse_1 = require("../types/PostMutationResponse");
const checkAuth_1 = require("../middleware/checkAuth");
const User_1 = require("../entities/User");
const PaginatedPosts_1 = require("../types/PaginatedPosts");
const typeorm_1 = require("typeorm");
const VoteType_1 = require("../types/VoteType");
const apollo_server_core_1 = require("apollo-server-core");
(0, type_graphql_1.registerEnumType)(VoteType_1.VoteType, {
    name: 'VoteType'
});
let PostResolver = class PostResolver {
    textSnippet(root) {
        return root.text.slice(0, 50);
    }
    user(root, { dataLoaders: { userLoader } }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userLoader.load(root.userId);
        });
    }
    voteType(root, { req, dataLoaders: { voteTypeLoader } }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId)
                return 0;
            const existingVote = yield voteTypeLoader.load({
                postId: root.id,
                userId: req.session.userId
            });
            return existingVote ? existingVote.value : 0;
        });
    }
    createPost({ title, text }, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newPost = Post_1.Post.create({
                    title,
                    text,
                    userId: req.session.userId
                });
                yield newPost.save();
                return {
                    code: 200,
                    success: true,
                    message: 'Post created successfully',
                    post: newPost
                };
            }
            catch (error) {
                console.log(error);
                return {
                    code: 500,
                    success: false,
                    message: `Internal server error ${error.message}`
                };
            }
        });
    }
    posts(limit, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalPostCount = yield Post_1.Post.count();
                const realLimit = Math.min(10, limit);
                const findOptions = {
                    order: {
                        createdAt: 'DESC'
                    },
                    take: realLimit
                };
                let lastPost = [];
                if (cursor) {
                    findOptions.where = { createdAt: (0, typeorm_1.LessThan)(cursor) };
                    lastPost = yield Post_1.Post.find({ order: { createdAt: 'ASC' }, take: 1 });
                }
                const posts = yield Post_1.Post.find(findOptions);
                return {
                    totalCount: totalPostCount,
                    cursor: posts[posts.length - 1].createdAt,
                    hasMore: cursor
                        ? posts[posts.length - 1].createdAt.toString() !==
                            lastPost[0].createdAt.toString()
                        : posts.length !== totalPostCount,
                    paginatedPosts: posts
                };
            }
            catch (error) {
                console.log(error);
                return null;
            }
        });
    }
    post(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield Post_1.Post.findOne({ where: [{ id }] });
                if (!post) {
                    return undefined;
                }
                return post;
            }
            catch (error) {
                console.log(error);
                return undefined;
            }
        });
    }
    updatePost({ id, title, text }, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingPost = yield Post_1.Post.findOne({ where: [{ id }] });
            if (!existingPost)
                return {
                    code: 400,
                    success: false,
                    message: 'Post not found'
                };
            if (existingPost.userId !== req.session.userId) {
                return { code: 401, success: false, message: 'Unauthorised' };
            }
            existingPost.title = title;
            existingPost.text = text;
            yield existingPost.save();
            return {
                code: 200,
                success: true,
                message: 'Post updated successfully',
                post: existingPost
            };
        });
    }
    deletePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingPost = yield Post_1.Post.findOne({ where: [{ id }] });
            if (!existingPost)
                return {
                    code: 400,
                    success: false,
                    message: 'Post not found'
                };
            if (existingPost.userId !== req.session.userId) {
                return { code: 401, success: false, message: 'Unauthorised' };
            }
            yield Upvote_1.Upvote.delete({ postId: id });
            yield Post_1.Post.delete({ id });
            return { code: 200, success: true, message: 'Post deleted successfully' };
        });
    }
    vote(postId, inputVoteValue, { req: { session: { userId } }, connection }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield connection.transaction((transactionEntityManager) => __awaiter(this, void 0, void 0, function* () {
                let post = yield transactionEntityManager.findOne(Post_1.Post, {
                    where: { id: postId },
                });
                if (!post) {
                    throw new apollo_server_core_1.UserInputError('Post not found');
                }
                const existingVote = yield transactionEntityManager.findOne(Upvote_1.Upvote, {
                    where: {
                        postId,
                        userId
                    }
                });
                if (existingVote && existingVote.value !== inputVoteValue) {
                    yield transactionEntityManager.save(Upvote_1.Upvote, Object.assign(Object.assign({}, existingVote), { value: inputVoteValue }));
                    post = yield transactionEntityManager.save(Post_1.Post, Object.assign(Object.assign({}, post), { points: post.points + 2 * inputVoteValue }));
                }
                if (!existingVote) {
                    const newVote = transactionEntityManager.create(Upvote_1.Upvote, {
                        userId,
                        postId,
                        value: inputVoteValue
                    });
                    yield transactionEntityManager.save(newVote);
                    post.points = post.points + inputVoteValue;
                    post = yield transactionEntityManager.save(post);
                }
                return {
                    code: 200,
                    success: true,
                    message: 'Post voted',
                    post
                };
            }));
        });
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(_return => String),
    __param(0, (0, type_graphql_1.Root)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(_return => User_1.User),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "user", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(_return => type_graphql_1.Int),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "voteType", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => PostMutationResponse_1.PostMutationResponse),
    (0, type_graphql_1.UseMiddleware)(checkAuth_1.checkAuth),
    __param(0, (0, type_graphql_1.Arg)('createPostInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePostInput_1.CreatePostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    (0, type_graphql_1.Query)(_return => PaginatedPosts_1.PaginatedPosts, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('limit', _type => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('cursor', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    (0, type_graphql_1.Query)(_return => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('id', _type => type_graphql_1.ID)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => PostMutationResponse_1.PostMutationResponse),
    (0, type_graphql_1.UseMiddleware)(checkAuth_1.checkAuth),
    __param(0, (0, type_graphql_1.Arg)('updatePostInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdatePostInput_1.UpdatePostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => PostMutationResponse_1.PostMutationResponse),
    (0, type_graphql_1.UseMiddleware)(checkAuth_1.checkAuth),
    __param(0, (0, type_graphql_1.Arg)('id', _type => type_graphql_1.ID)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => PostMutationResponse_1.PostMutationResponse),
    (0, type_graphql_1.UseMiddleware)(checkAuth_1.checkAuth),
    __param(0, (0, type_graphql_1.Arg)('postId', _type => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('inputVoteValue', _type => VoteType_1.VoteType)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
PostResolver = __decorate([
    (0, type_graphql_1.Resolver)(_of => Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map
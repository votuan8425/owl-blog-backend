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
exports.buildDataLoaders = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const Upvote_1 = require("../entities/Upvote");
const User_1 = require("../entities/User");
const batchGetUsers = (userIds) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield User_1.User.findByIds(userIds);
    return userIds.map(userId => users.find(user => user.id === userId));
});
const batchGetVoteTypes = (voteTypeConditions) => __awaiter(void 0, void 0, void 0, function* () {
    const voteTypes = yield Upvote_1.Upvote.findByIds(voteTypeConditions);
    return voteTypeConditions.map(voteTypeCondition => voteTypes.find(voteType => voteType.postId === voteTypeCondition.postId &&
        voteType.userId === voteTypeCondition.userId));
});
const buildDataLoaders = () => ({
    userLoader: new dataloader_1.default(userIds => batchGetUsers(userIds)),
    voteTypeLoader: new dataloader_1.default(voteTypeConditions => batchGetVoteTypes(voteTypeConditions))
});
exports.buildDataLoaders = buildDataLoaders;
//# sourceMappingURL=dataLoaders.js.map
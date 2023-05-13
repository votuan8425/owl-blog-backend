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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const argon2_1 = __importDefault(require("argon2"));
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const UserMutationResponse_1 = require("../types/UserMutationResponse");
const RegisterInput_1 = require("../types/RegisterInput");
const validateRegisterInput_1 = require("../utils/validateRegisterInput");
const LoginInput_1 = require("../types/LoginInput");
const contanst_1 = require("../contanst");
const ForgotPassword_1 = require("../types/ForgotPassword");
const Token_1 = require("../models/Token");
const uuid_1 = require("uuid");
const sendEmail_1 = require("../utils/sendEmail");
const ChangePasswordInput_1 = require("../types/ChangePasswordInput");
let UserResolver = class UserResolver {
    email(user, { req }) {
        return req.session.userId === user.id ? user.email : "";
    }
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId)
                return null;
            let id = req.session.userId;
            const user = yield User_1.User.findOne({ where: [{ id }] });
            return user;
        });
    }
    register(registerInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateRegisterInputErrors = (0, validateRegisterInput_1.validateRegisterInput)(registerInput);
            if (validateRegisterInputErrors !== null) {
                return Object.assign({ code: 400, success: false }, validateRegisterInputErrors);
            }
            try {
                const { username, email, password } = registerInput;
                const existingUser = yield User_1.User.findOne({
                    where: [{ username }, { email }],
                });
                if (existingUser)
                    return {
                        code: 400,
                        success: false,
                        message: "Duplicated username or email",
                        errors: [
                            {
                                field: existingUser.username === username ? "Username" : "Email",
                                message: `${existingUser.username === username ? "Username" : "Email"} already taken`,
                            },
                        ],
                    };
                const hashedPassword = yield argon2_1.default.hash(password);
                const newUser = User_1.User.create({
                    username,
                    password: hashedPassword,
                    email,
                });
                req.session.userId = newUser.id;
                return {
                    code: 200,
                    success: true,
                    message: "User registration successful",
                    user: yield User_1.User.save(newUser),
                };
            }
            catch (error) {
                console.log(error);
                return {
                    code: 500,
                    success: false,
                    message: `Internal server error ${error.message}`,
                };
            }
        });
    }
    login({ usernameOrEmail, password }, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield User_1.User.createQueryBuilder("user")
                    .where(usernameOrEmail.includes("@")
                    ? "user.email = :email"
                    : "user.username = :username", {
                    email: usernameOrEmail,
                    username: usernameOrEmail,
                })
                    .getOne();
                if (!existingUser)
                    return {
                        code: 400,
                        success: false,
                        message: "User not found",
                        errors: [
                            {
                                field: "usernameOrEmail",
                                message: "Username or email incorrect",
                            },
                        ],
                    };
                const passwordValid = yield argon2_1.default.verify(existingUser.password, password);
                if (!passwordValid)
                    return {
                        code: 400,
                        success: false,
                        message: "Wrong password",
                        errors: [{ field: "password", message: "Wrong password" }],
                    };
                req.session.userId = existingUser.id;
                return {
                    code: 200,
                    success: true,
                    message: "Logged in successfully",
                    user: existingUser,
                };
            }
            catch (error) {
                console.log(error);
                return {
                    code: 500,
                    success: false,
                    message: `Internal server error ${error.message}`,
                };
            }
        });
    }
    logout({ req, res }) {
        return new Promise((resolve, _reject) => {
            res.clearCookie(contanst_1.COOKIE_NAME);
            req.session.destroy((error) => {
                if (error) {
                    console.log("DESTROYING SESSION ERROR", error);
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
    forgotPassword(forgotPasswordInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: [{ email: forgotPasswordInput.email }] });
            if (!user)
                return true;
            yield Token_1.TokenModel.findOneAndDelete({ where: [{ userId: `${user.id}` }] });
            const resetToken = (0, uuid_1.v4)();
            const hashedResetToken = yield argon2_1.default.hash(resetToken);
            yield new Token_1.TokenModel({
                userId: `${user.id}`,
                token: hashedResetToken
            }).save();
            yield (0, sendEmail_1.sendEmail)(forgotPasswordInput.email, `<a href="http://localhost:3000/change-password?token=${resetToken}&userId=${user.id}">Click here to reset your password</a>`);
            return true;
        });
    }
    changePassword(token, userId, changePasswordInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (changePasswordInput.newPassword.length <= 2) {
                return {
                    code: 400,
                    success: false,
                    message: 'Invalid password',
                    errors: [
                        { field: 'newPassword', message: 'Length must be greater than 2' }
                    ]
                };
            }
            try {
                const resetPasswordTokenRecord = yield Token_1.TokenModel.findOne({ userId });
                if (!resetPasswordTokenRecord) {
                    return {
                        code: 400,
                        success: false,
                        message: 'Invalid or expired password reset token',
                        errors: [
                            {
                                field: 'token',
                                message: 'Invalid or expired password reset token'
                            }
                        ]
                    };
                }
                const resetPasswordTokenValid = argon2_1.default.verify(resetPasswordTokenRecord.token, token);
                if (!resetPasswordTokenValid) {
                    return {
                        code: 400,
                        success: false,
                        message: 'Invalid or expired password reset token',
                        errors: [
                            {
                                field: 'token',
                                message: 'Invalid or expired password reset token'
                            }
                        ]
                    };
                }
                const userIdNum = parseInt(userId);
                const user = yield User_1.User.findOne({ where: [{ id: userIdNum }] });
                if (!user) {
                    return {
                        code: 400,
                        success: false,
                        message: 'User no longer exists',
                        errors: [{ field: 'token', message: 'User no longer exists' }]
                    };
                }
                const updatedPassword = yield argon2_1.default.hash(changePasswordInput.newPassword);
                yield User_1.User.update({ id: userIdNum }, { password: updatedPassword });
                yield resetPasswordTokenRecord.deleteOne();
                req.session.userId = user.id;
                return {
                    code: 200,
                    success: true,
                    message: 'User password reset successfully',
                    user
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
};
__decorate([
    (0, type_graphql_1.FieldResolver)(_return => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User_1.User, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "email", null);
__decorate([
    (0, type_graphql_1.Query)((_return) => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)("registerInput")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterInput_1.RegisterInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)("loginInput")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginInput_1.LoginInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => Boolean),
    __param(0, (0, type_graphql_1.Arg)('forgotPasswordInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPassword_1.ForgotPasswordInput]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(_return => UserMutationResponse_1.UserMutationResponse),
    __param(0, (0, type_graphql_1.Arg)('token')),
    __param(1, (0, type_graphql_1.Arg)('userId')),
    __param(2, (0, type_graphql_1.Arg)('changePasswordInput')),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ChangePasswordInput_1.ChangePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(_of => User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map
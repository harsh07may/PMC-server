"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExistingUserError = exports.FailedLoginError = exports.AccessDeniedError = exports.AuthenticationError = void 0;
class GenericError extends Error {
    constructor(message, type = "GenericError", statusCode = 500) {
        super();
        this.message = message;
        this.name = type;
        this.statusCode = statusCode;
    }
}
class AuthenticationError extends GenericError {
    constructor(message) {
        super(message, "AuthenticationError", 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AccessDeniedError extends GenericError {
    constructor(message) {
        super(message, "AccessDeniedError", 403);
    }
}
exports.AccessDeniedError = AccessDeniedError;
class FailedLoginError extends GenericError {
    constructor(message) {
        super(message, "FailedLoginError", 400);
    }
}
exports.FailedLoginError = FailedLoginError;
class ExistingUserError extends GenericError {
    constructor(message) {
        super(message, "ExistingUserError", 400);
    }
}
exports.ExistingUserError = ExistingUserError;

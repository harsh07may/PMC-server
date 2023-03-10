"use strict";
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
class AccessDeniedError extends GenericError {
    constructor(message) {
        super(message, "AccessDeniedError", 403);
    }
}
class FailedLoginError extends GenericError {
    constructor(message) {
        super(message, "FailedLoginError", 400);
    }
}
class ExistingUserError extends GenericError {
    constructor(message) {
        super(message, "ExistingUserError", 400);
    }
}
module.exports = {
    AuthenticationError,
    AccessDeniedError,
    FailedLoginError,
    ExistingUserError,
};

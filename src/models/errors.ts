export class GenericError extends Error {
  public statusCode: number;

  constructor(message: string, type = "GenericError", statusCode = 500) {
    super();
    this.message = message;
    this.name = type;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends GenericError {
  constructor(message: any) {
    super(message, "AuthenticationError", 401);
  }
}

export class AccessDeniedError extends GenericError {
  constructor(message: any) {
    super(message, "AccessDeniedError", 403);
  }
}

export class FailedLoginError extends GenericError {
  constructor(message: any) {
    super(message, "FailedLoginError", 400);
  }
}

export class ExistingUserError extends GenericError {
  constructor(message: any) {
    super(message, "ExistingUserError", 400);
  }
}

export class ValidationError extends GenericError {
  constructor(message: string) {
    super(message, "ValidationError", 403);
  }
}

export class BadRequestError extends GenericError {
  constructor(message: any) {
    super(message, "BadRequestError", 400);
  }
}
export class ResourceNotFoundError extends GenericError {
  constructor(message: string) {
    super(message, "ResourceNotFoundError", 404);
  }
}
export class InternalError extends GenericError {
  constructor(message: string) {
    super(message, "InternalError", 500);
  }
}

class GenericError extends Error {
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

export class FileNotFoundError extends GenericError {
  constructor(message: any) {
    super(message, "FileNotFoundError", 404);
  }
}


// Classes d'errors personalitzades per a l'aplicació

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurs no trobat') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autoritzat') {
    super(message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Petició incorrecta') {
    super(message, 400);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Error intern del servidor') {
    super(message, 500);
  }
}

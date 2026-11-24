export class ApplicationError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

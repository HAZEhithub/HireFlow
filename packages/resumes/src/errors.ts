export class ResumeError extends Error {
  readonly code: string;
  readonly httpStatus: 400 | 403 | 404 | 409 | 413 | 415 | 422 | 429;

  constructor(code: string, message: string, httpStatus: ResumeError["httpStatus"] = 400) {
    super(message);
    this.name = "ResumeError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

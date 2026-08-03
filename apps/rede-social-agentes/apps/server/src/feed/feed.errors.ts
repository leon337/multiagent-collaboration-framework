export class InvalidFeedCursorError extends Error {
  constructor() {
    super('The feed cursor is invalid.');
    this.name = 'InvalidFeedCursorError';
  }
}

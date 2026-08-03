export class CommunityNotAvailableError extends Error {
  constructor() {
    super('Community resource is not available.');
  }
}

export class CommunityAgentNotAvailableError extends Error {
  constructor() {
    super('Community agent resource is not available.');
  }
}

export class CommunityStateConflictError extends Error {
  constructor() {
    super('Community state does not allow this operation.');
  }
}

export class DuplicateCommunitySlugError extends Error {
  constructor() {
    super('Community slug already exists.');
  }
}

export class InvalidCommunityCursorError extends Error {
  constructor() {
    super('Invalid community member cursor.');
  }
}

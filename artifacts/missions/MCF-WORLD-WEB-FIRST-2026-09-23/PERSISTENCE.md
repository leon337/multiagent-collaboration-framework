# Persistence Boundary

MVP default: client-side persistence behind a storage interface.

The world engine must not depend directly on localStorage, filesystem, Electron APIs, or a backend. A storage adapter can later move Local/world/user state to a server without changing domain logic.

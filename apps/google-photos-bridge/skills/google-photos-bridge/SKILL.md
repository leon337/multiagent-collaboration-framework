---
name: google-photos-bridge
description: Use when the user wants to connect Google Photos, choose photos or videos from their Google Photos library, list the selected items, or visually inspect a photo they explicitly selected.
---

Use the Google Photos Bridge tools in this order:

1. Call `photos_bridge_status` before starting a new connection.
2. If the account is not connected, call `photos_connect` and direct the user only to the official Google authorization URL returned by the tool.
3. After authorization, call `photos_connection_status`.
4. Call `photos_picker_start` and let the user choose media in the official Google Photos Picker. Do not claim access to media that was not selected.
5. Poll with `photos_picker_status` only when appropriate; after completion call `photos_list_items`.
6. When visual analysis is needed, call `photos_get_image` only for an ID returned by `photos_list_items` for the same connection and Picker session.
7. Close the Picker session with `photos_picker_close` when its selected media is no longer needed.
8. If the user asks to disconnect, call `photos_disconnect`.

Safety and accuracy rules:

- Never claim unrestricted Google Photos library access.
- Never ask the user to paste OAuth tokens or client secrets into chat.
- Do not infer that an unselected photo exists.
- Do not build or claim biometric face recognition from the selected media.
- Treat connection IDs, session IDs, and media IDs as opaque identifiers.

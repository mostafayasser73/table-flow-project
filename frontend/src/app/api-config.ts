// The backend runs on its own port (see PORT in the backend .env file).
// Every request in this app is built on top of this address.
export const API_BASE_URL = 'http://localhost:5001/api/v1';

// Uploaded pictures are served by the backend as static files.
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

// Builds the address of a picture that Multer saved on the backend.
// "users" and "menu-items" are the two folders it writes into.
export const uploadedImage = (
  folder: 'users' | 'menu-items',
  fileName?: string,
): string => `${UPLOADS_URL}/${folder}/${fileName}`;

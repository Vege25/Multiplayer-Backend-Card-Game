import { Lobby, UserWithNoPassword } from './DBTypes';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

// type MediaResponse = MessageResponse & {
//   media: MediaItem | MediaItem[];
// };

// for auth server
type LoginResponse = MessageResponse & {
  token: string;
  message: string;
  user: UserWithNoPassword;
};

type LobbyResponse = {
  lobby: Lobby;
  players: UserWithNoPassword[]; // List of players in the lobby
  // You can add more fields as needed
};

type UserResponse = MessageResponse & {
  user: UserWithNoPassword;
};

type UserDeleteResponse = MessageResponse & {
  user: { user_id: number };
};

// for upload server
type UploadResponse = MessageResponse & {
  data: {
    filename: string;
    media_type: string;
    filesize: number;
  };
};

export type {
  MessageResponse,
  ErrorResponse,
  // MediaResponse,
  LoginResponse,
  UploadResponse,
  UserResponse,
  UserDeleteResponse,
  LobbyResponse,
};

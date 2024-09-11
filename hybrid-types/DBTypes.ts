type Rank = {
  rank_id: number;
  rank_name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
  required_experience: number;
  created_at: Date | string;
};
type CardRarity = {
  rarity_id: number;
  rarity_name: 'common' | 'rare' | 'legendary';
  created_at: Date | string;
};

type User = {
  user_id: number;
  username: string;
  password: string;
  email: string;
  in_game_currency: number;
  experience: number;
  user_rank_id: number;
  created_at: Date | string;
};

type Lobby = {
  lobby_id: number;
  creator_id: number;
  opponent_id: number;
  status: 'waiting' | 'ongoing' | 'finished';
  created_at: Date | string;
};

type Card = {
  card_id: number;
  card_name: string;
  card_type: 'troop' | 'spell' | 'structure' | 'item';
  cost: number;
  north: number;
  east: number;
  south: number;
  west: number;
  description: string | null;
  rarity_id: number;
  shiny: boolean;
  created_at: Date | string;
};

type UserCard = {
  user_card_id: number;
  user_id: number;
  card_id: number;
  quantity: number;
  created_at: Date | string;
};

type Deck = {
  deck_id: number;
  user_id: number;
  deck_name: string;
  is_active: boolean;
  created_at: Date | string;
};

type DeckCard = {
  deck_card_id: number;
  deck_id: number;
  card_id: number;
  created_at: Date | string;
};

type Trade = {
  trade_id: number;
  requester_id: number;
  recipient_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date | string;
};

type TradeCard = {
  trade_card_id: number;
  trade_id: number;
  card_id: number;
  quantity: number;
  created_at: Date | string;
};

type Game = {
  game_id: number;
  lobby_id: number;
  player1_id: number;
  player2_id: number;
  player1_mana: number;
  player2_mana: number;
  recent_played_card: number;
  player1_troops_killed: number;
  player2_troops_killed: number;
  player1_structures_killed: number;
  player2_structures_killed: number;
  game_status: 'ongoing' | 'finished';
  current_turn: number;
  turn_number: number;
  created_at: Date | string;
};

type GameHand = {
  game_hand_id: number;
  game_id: number;
  card_id: number;
  owner_id: number;
  created_at: Date | string;
};

type GameGrid = {
  game_grid_id: number;
  game_id: number;
  card_id: number;
  owner_id: number;
  grid_x: number;
  grid_y: number;
  is_just_placed: boolean;
  created_at: Date | string;
};

// User with rank and user_rank_id removed
type UserWithRank = Omit<User, 'user_rank_id'> & { rank: Rank };

type UserWithNoPassword = Omit<UserWithRank, 'password'>;

type TokenContent = Pick<User, 'user_id'> & Pick<Rank, 'rank_name'>;

export type {
  User,
  Rank,
  CardRarity,
  Lobby,
  Card,
  UserCard,
  Deck,
  DeckCard,
  Trade,
  TradeCard,
  Game,
  GameHand,
  GameGrid,
  UserWithRank,
  UserWithNoPassword,
  TokenContent,
};

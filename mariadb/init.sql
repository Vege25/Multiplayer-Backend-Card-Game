-- Drop the Godot database if it exists and create a new one
DROP DATABASE IF EXISTS Godot;
CREATE DATABASE Godot;
\c Godot

-- Rank Table
CREATE TABLE Ranks (
    rank_id SERIAL PRIMARY KEY,
    rank_name VARCHAR(50) UNIQUE NOT NULL,
    required_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ranks
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Bronze', 0);
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Silver', 100);
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Gold', 200);
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Platinum', 300);
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Diamond', 400);
INSERT INTO Ranks (rank_name, required_experience) VALUES ('Master', 500);

-- Users Table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    in_game_currency INT DEFAULT 0,
    experience INT DEFAULT 0,
    rank_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rank_id) REFERENCES Ranks(rank_id)
);

-- Insert default players
INSERT INTO Users (username, password, email) VALUES ('player1', 'password1', 'player1@mail.com');
INSERT INTO Users (username, password, email) VALUES ('player2', 'password2', 'player2@mail.com');

-- Lobby Table
CREATE TABLE Lobbies (
    lobby_id SERIAL PRIMARY KEY,
    creator_id INT,
    opponent_id INT,
    status VARCHAR(50) DEFAULT 'waiting', -- Possible values: waiting, ongoing, finished
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(user_id),
    FOREIGN KEY (opponent_id) REFERENCES Users(user_id)
);

-- Insert default lobbies
INSERT INTO Lobbies (creator_id, opponent_id) VALUES (1, 2);

-- CardRarity Table
CREATE TABLE CardRarity (
    rarity_id SERIAL PRIMARY KEY,
    rarity_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default rarities
INSERT INTO CardRarity (rarity_name) VALUES ('common');
INSERT INTO CardRarity (rarity_name) VALUES ('rare');
INSERT INTO CardRarity (rarity_name) VALUES ('legendary');

-- Cards Table
CREATE TABLE Cards (
    card_id SERIAL PRIMARY KEY,
    card_name VARCHAR(255) NOT NULL,
    card_type VARCHAR(50) NOT NULL, -- Possible values: troop, spell, structure, item
    cost INT NOT NULL,
    north INT NOT NULL,
    east INT NOT NULL,
    south INT NOT NULL,
    west INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    rarity_id INT,
    shiny BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rarity_id) REFERENCES CardRarity(rarity_id)
);

-- Insert default cards
INSERT INTO Cards (card_name, card_type, cost, north, east, south, west, description, rarity_id, shiny) VALUES
('Bob', 'Troop', 4, 2, 3, 1, 1, 'Attacks and moves once in every direction', 1, FALSE),
('Zig', 'Troop', 4, 2, 2, 1, 1, 'Attacks and moves once in every direction', 1, FALSE);

-- UserCards Table
CREATE TABLE UserCards (
    user_card_id SERIAL PRIMARY KEY,
    user_id INT,
    card_id INT,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Insert default user cards
INSERT INTO UserCards (user_id, card_id, quantity) VALUES (1, 1, 1);
INSERT INTO UserCards (user_id, card_id, quantity) VALUES (1, 2, 1);

-- Decks Table
CREATE TABLE Decks (
    deck_id SERIAL PRIMARY KEY,
    user_id INT,
    deck_name VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Insert default decks
INSERT INTO Decks (user_id, deck_name, is_active) VALUES (1, 'Deck 1', TRUE);
INSERT INTO Decks (user_id, deck_name, is_active) VALUES (2, 'Deck 2', TRUE);

-- DeckCards Table
CREATE TABLE DeckCards (
    deck_card_id SERIAL PRIMARY KEY,
    deck_id INT,
    card_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES Decks(deck_id),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Insert default deck cards
INSERT INTO DeckCards (deck_id, card_id) VALUES (1, 1);
INSERT INTO DeckCards (deck_id, card_id) VALUES (1, 2);

-- Trades Table
CREATE TABLE Trades (
    trade_id SERIAL PRIMARY KEY,
    requester_id INT,
    recipient_id INT,
    status VARCHAR(50) DEFAULT 'pending', -- Possible values: pending, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES Users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES Users(user_id)
);

-- TradeCards Table
CREATE TABLE TradeCards (
    trade_card_id SERIAL PRIMARY KEY,
    trade_id INT,
    card_id INT,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trade_id) REFERENCES Trades(trade_id),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Games Table
CREATE TABLE Games (
    game_id SERIAL PRIMARY KEY,
    lobby_id INT,
    player1_id INT,
    player2_id INT,
    player1_connected BOOLEAN DEFAULT TRUE,
    player2_connected BOOLEAN DEFAULT TRUE,
    player1_mana INT DEFAULT 0,
    player2_mana INT DEFAULT 0,
    recent_played_card INT,
    player1_troops_killed INT DEFAULT 0,
    player2_troops_killed INT DEFAULT 0,
    player1_structures_killed INT DEFAULT 0,
    player2_structures_killed INT DEFAULT 0,
    game_status VARCHAR(50) DEFAULT 'ongoing', -- Possible values: ongoing, finished
    current_turn INT,
    turn_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lobby_id) REFERENCES Lobbies(lobby_id),
    FOREIGN KEY (player1_id) REFERENCES Users(user_id),
    FOREIGN KEY (player2_id) REFERENCES Users(user_id),
    FOREIGN KEY (recent_played_card) REFERENCES Cards(card_id)
);

-- Insert initial game for lobby 0
INSERT INTO Games (lobby_id, player1_id, player2_id) VALUES (1, 1, 2);

-- GameHand Table
CREATE TABLE GameHand (
    game_hand_id SERIAL PRIMARY KEY,
    game_id INT,
    card_id INT,
    owner_id INT, -- player1 or player2
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Insert default game hand
INSERT INTO GameHand (game_id, card_id, owner_id) VALUES (1, 1, 1);
INSERT INTO GameHand (game_id, card_id, owner_id) VALUES (1, 2, 1);

-- GameGrid Table
CREATE TABLE GameGrid (
    game_grid_id SERIAL PRIMARY KEY,
    game_id INT,
    grid_x INT,
    grid_y INT,
    card_id INT,
    owner_id INT, -- player1 or player2
    is_just_placed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (card_id) REFERENCES Cards(card_id)
);

-- Insert default game grid
INSERT INTO GameGrid (game_id, grid_x, grid_y, card_id, owner_id) VALUES (1, 0, 0, 1, 1);

-- Table tracks small amounts of information about the game as it has ended, all other game information will be deleted
CREATE TABLE GameResults (
    game_result_id SERIAL PRIMARY KEY,
    game_id INT,
    game_result VARCHAR(50) DEFAULT 'draw', -- Possible values: draw, player1, player2
    winner_id INT,
    loser_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (winner_id) REFERENCES Users(user_id),
    FOREIGN KEY (loser_id) REFERENCES Users(user_id)
);

-- Disconnects Table
CREATE TABLE Disconnects (
    disconnect_id SERIAL PRIMARY KEY,
    game_id INT,
    player_id INT,
    timer INT DEFAULT 0,
    max_timer INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (player_id) REFERENCES Users(user_id)
);
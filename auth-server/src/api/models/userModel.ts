import {PoolClient, QueryResult} from 'pg';
import {UserWithRank, User, UserWithNoPassword} from '@sharedTypes/DBTypes';
import {UserDeleteResponse} from '@sharedTypes/MessageTypes';
import pool from '../../lib/db';

// Get user by ID
const getUserById = async (id: number): Promise<UserWithNoPassword | null> => {
  try {
    const result: QueryResult<UserWithNoPassword> = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.created_at,
        r.rank_name
      FROM users u
      JOIN ranks r ON u.rank_id = r.rank_id
      WHERE u.user_id = $1
      `,
      [id]
    );
    return result.rowCount! > 0 ? result.rows[0] : null; // Asserting rowCount is not null
  } catch (e) {
    console.error('getUserById error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Get all users
const getAllUsers = async (): Promise<UserWithNoPassword[] | null> => {
  try {
    const result: QueryResult<UserWithNoPassword> = await pool.query(
      `
      SELECT
        user_id,
        username,
        created_at
      FROM users
      `
    );
    return result.rowCount! > 0 ? result.rows : null;
  } catch (e) {
    console.error('getAllUsers error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Get user by email
const getUserByEmail = async (email: string): Promise<UserWithRank | null> => {
  try {
    const result: QueryResult<UserWithRank> = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.password,
        u.created_at,
        r.rank_name
      FROM users u
      JOIN ranks r ON u.rank_id = r.rank_id
      WHERE u.email = $1
      `,
      [email]
    );
    return result.rowCount! > 0 ? result.rows[0] : null;
  } catch (e) {
    console.error('getUserByEmail error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Get user by username
const getUserByUsername = async (
  username: string
): Promise<UserWithRank | null> => {
  try {
    const result: QueryResult<UserWithRank> = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.password,
        u.created_at,
        COALESCE(r.rank_name, 'Unranked') AS rank_name
      FROM users u
      LEFT JOIN ranks r ON u.rank_id = r.rank_id
      WHERE u.username = $1
      `,
      [username]
    );
    return result.rowCount! > 0 ? result.rows[0] : null;
  } catch (e) {
    console.error('getUserByUsername error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Create a new user
const createUser = async (user: User): Promise<UserWithNoPassword | null> => {
  try {
    const result: QueryResult = await pool.query(
      `
      INSERT INTO users (username, password, email, rank_id)
      VALUES ($1, $2, $3, 1) -- Default rank_id 1 (bronze)
      RETURNING user_id
      `,
      [user.username, user.password, user.email]
    );

    if (result.rowCount! === 0) {
      return null;
    }

    const newUser = await getUserById(result.rows[0].user_id);
    return newUser;
  } catch (e) {
    console.error('createUser error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Modify user information
const modifyUser = async (
  user: User,
  id: number
): Promise<UserWithNoPassword | null> => {
  try {
    const setClause = Object.keys(user)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(user);

    const result: QueryResult = await pool.query(
      `
      UPDATE users
      SET ${setClause}
      WHERE user_id = $${values.length + 1}
      `,
      [...values, id]
    );

    if (result.rowCount! === 0) {
      return null;
    }

    const updatedUser = await getUserById(id);
    return updatedUser;
  } catch (e) {
    console.error('modifyUser error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Delete user
const deleteUser = async (id: number): Promise<UserDeleteResponse | null> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deleting related data before deleting user
    await client.query('DELETE FROM user_cards WHERE user_id = $1', [id]);
    await client.query('DELETE FROM decks WHERE user_id = $1', [id]);
    await client.query(
      'DELETE FROM lobbies WHERE creator_id = $1 OR opponent_id = $1',
      [id]
    );

    // Delete the user
    const result = await client.query('DELETE FROM users WHERE user_id = $1', [
      id,
    ]);

    await client.query('COMMIT');

    return result.rowCount! > 0
      ? {message: 'User deleted', user: {user_id: id}}
      : null;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('deleteUser error', (e as Error).message);
    throw new Error((e as Error).message);
  } finally {
    client.release();
  }
};

export {
  getUserById,
  getAllUsers,
  getUserByEmail,
  getUserByUsername,
  createUser,
  modifyUser,
  deleteUser,
};

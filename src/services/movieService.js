const { pool } = require('../configs/database');

class MovieService {
  async findAllMovies({ search = '', page = 1, limit = 10, sortBy = 'id', sortOrder = 'ASC' } = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];
      
      if (search) {
        whereClause = 'WHERE title LIKE ? OR genre LIKE ?';
        params = [`%${search}%`, `%${search}%`];
      }      
      const countQuery = `SELECT COUNT(*) as total FROM movies ${whereClause}`;
      const [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0].total;      
      const query = `
        SELECT * FROM movies 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.execute(query, [...params, limit, offset]);
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error finding movies: ${error.message}`);
    }
  }

  async findMovieById(id) {
    try {
      const query = 'SELECT * FROM movies WHERE id = ?';
      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding movie by ID: ${error.message}`);
    }
  }

  async createMovie(payload) {
    try {
      const { title, year, genre, rating } = payload;
      
      const query = `
        INSERT INTO movies (title, year, genre, rating) 
        VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(query, [title, year, genre, rating]);
      const createdMovie = await this.findMovieById(result.insertId);
      return createdMovie;
    } catch (error) {
      throw new Error(`Error creating movie: ${error.message}`);
    }
  }

  async updateMovie(id, payload) {
    try {
      const movie = await this.findMovieById(id);
      if (!movie) {
        return null;
      }
      
      const { title, year, genre, rating } = payload;
      
      const query = `
        UPDATE movies 
        SET title = COALESCE(?, title),
            year = COALESCE(?, year),
            genre = COALESCE(?, genre),
            rating = COALESCE(?, rating)
        WHERE id = ?
      `;
      
      await pool.execute(query, [title, year, genre, rating, id]);
      const updatedMovie = await this.findMovieById(id);
      return updatedMovie;
    } catch (error) {
      throw new Error(`Error updating movie: ${error.message}`);
    }
  }

  async deleteMovie(id) {
    try {
      const movie = await this.findMovieById(id);
      if (!movie) {
        return false;
      }
      
      const query = 'DELETE FROM movies WHERE id = ?';
      await pool.execute(query, [id]);
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting movie: ${error.message}`);
    }
  }
}

module.exports = new MovieService();

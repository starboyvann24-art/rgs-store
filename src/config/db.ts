import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host: 'localhost',
  user: 'tgevicsg_rgs_user',
  password: 'Dumai124.#',
  database: 'tgevicsg_rgs_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default db

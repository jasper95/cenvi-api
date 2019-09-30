import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'

class AuthModel {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async authenticateUser(user) {
    const session = await this.DB.insert('user_session', { user_id: user.id, status: 'Online', device_type: 'Web' })
    return this.generateToken({
      payload: {
        ...session,
        hasura_claims: {
          'x-hasura-allowed-roles': ['user'],
          'x-hasura-default-role': 'user',
          'x-hasura-user-id': user.id,
          'x-hasura-session-id': session.id
        }
      },
      insert_db: false
    })
  }

  async generateToken(params) {
    const {
      payload, insert_db = true, type, has_expiry = true
    } = params
    if (insert_db) {
      const result = await this.DB.insert('token', {
        type,
        expiry: has_expiry ? dayjs().add(process.env.TOKEN_EXPIRY_DAYS, 'day').toISOString() : null
      })
      payload.id = result.id
      payload.hasura_claims = {
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-default-role': 'user',
        'x-hasura-token-id': result.id
      }
    }
    const token = jwt.sign(
      payload,
      process.env.AUTH_SECRET,
      has_expiry ? { expiresIn: `${process.env.TOKEN_EXPIRY_DAYS}d` } : {}
    )
    return token
  }
}

export default AuthModel

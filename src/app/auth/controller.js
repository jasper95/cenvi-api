import {
  generateHash,
  generateSalt,
  formatHTML,
  generateSlug,
  getPortalLink,
  sendEmailNodemailer
} from 'utils'
import jwt from 'jsonwebtoken'

export default class UserController {
  constructor({
    DB, knex, Model, serviceLocator
  }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
    this.serviceLocator = serviceLocator
  }

  async getSession({ user }) {
    return user
  }

  async validateToken({ params }) {
    const { token, type: type_param } = params
    try {
      const { id, expiry, user_id } = jwt.verify(token, process.env.AUTH_SECRET)
      const record = await this.DB.find('token', id)
      if (!record || type_param !== record.type) {
        console.log('type: ', type, type_param);
        throw { success: false, message: 'Invalid Token'}
      }
      if (expiry && isAfter(new Date(expiry), new Date())) {
        throw { success: false, message: 'Token expired'}
      }
      if (record?.used) {
        throw { success: false, message: 'Token Already used'}
      }
      return { success: true }
    } catch (err) {
      throw { success: false, message: 'Invalid Token' }
    }
  }

  async signup({ params, headers }) {
    // validate email
    const [user_exists] = await this.Model.base.validateUnique('user', { email: params.email })
    if (user_exists) {
      throw { success: false, message: 'Email already taken.' }
    }
    params.slug = generateSlug(params.first_name, params.last_name)

    const user = await this.DB.insert('user', params)
    // const sendgrid = this.serviceLocator.get('sendgrid')
    const { first_name: name } = params
    const token = await this.Model.auth.generateToken({
      payload: {
        user_id: user.id
      },
      type: 'activate',
      has_expiry: false
    })
    const html = await formatHTML('activate', { confirm_link: `${getPortalLink(headers)}/activate?token=${token}`, name })
    await sendEmailNodemailer({
      html,
      from: `"CENVI" ${process.env.EMAIL_FROM}`,
      subject: 'Verify CENVI Account',
      to: user.email,
    });

    return {
      success: true
    }
  }

  async login({ params }) {
    const { email, password } = params
    const [user] = await this.DB.filter('user', { email })
    if (!user) {
      throw { success: false, message: 'Email does not exists' }
    }
    if (!user.verified) {
      throw { success: false, message: 'Please verify email to login' }
    }
    const { id } = user
    const [{ salt, password: hash_password }] = await this.DB.filter('user_auth', { user_id: id })
    const hash = generateHash(password, salt)
    if (hash !== hash_password) {
      throw { success: false, message: 'Incorrect Password' }
    }
    const token = await this.Model.auth.authenticateUser(user)
    return {
      ...user,
      token
    }
  }

  async forgotPassword({ params }) {
    const { email } = params
    const user = await this.DB.find('user', email, [], 'email')
    if (!user) {
      throw { success: false, message: 'Email does not exists' }
    }
    const token = await this.Model.auth.generateToken({
      payload: {
        user_id: user.id
      },
      type: 'reset-password'
    })
    const html = await formatHTML(
      'reset-password',
      { reset_link: `${process.env.PORTAL_LINK}/reset-password?token=${token}`, name: user.first_name }
    )
    await sendEmailNodemailer({
      html,
      from: `"CENVI" ${process.env.EMAIL_FROM}`,
      subject: 'Reset CENVI Account Password',
      to: email,
    });
    return { success: true }
  }

  async resetPassword({ params }) {
    const { token, password } = params
    const { user_id, id } = jwt.verify(token, process.env.AUTH_SECRET)
    const salt = generateSalt()
    await Promise.all([
      this.DB.updateByFilter(
        'user_auth',
        { user_id, password: generateHash(password, salt), salt },
        { user_id }
      ),
      this.DB.updateById('token', { id, used: true })
    ])
    return { success: true }
  }

  async verifyAccount({ params }) {
    const { token } = params
    const { user_id, id } = jwt.verify(token, process.env.AUTH_SECRET)
    const salt = generateSalt()
    await Promise.all([
      this.DB.insert('user_auth', { user_id, password: generateHash(params.password, salt), salt }),
      this.DB.updateById('user', { id: user_id, verified: true }),
      this.DB.updateById('token', { id, used: true })
    ])
    return { success: true }
  }

  async logout({ session }) {
    return this.DB.deleteById('user_session', { id: session.id })
  }
}

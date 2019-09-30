import {
  generateHash,
  generateSalt,
  formatHTML,
  generateSlug
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

  async getSession({ session }) {
    const { user_id, token } = session
    let [user] = await this.DB.filter('user', { id: user_id })
    user = await this.Model.auth.getUserData(user)
    return {
      ...user,
      token
    }
  }

  async signup({ params }) {
    // validate email
    const [user_exists] = await this.Model.base.validateUnique('user', { email: params.email })
    if (user_exists) {
      throw { success: false, message: 'Email already taken.' }
    }

    if (params.role === 'ADMIN') {
      const [company_exists] = await this.Model.base.validateUnique('company', { name: params.company_name })
      if (company_exists) {
        throw { success: false, message: 'Company name already taken' }
      }
      const company = await this.DB.insert('company', { ...params, name: params.company_name })
      params.company_id = company.id
      params.slug = generateSlug(company.name)
    } else {
      params.slug = generateSlug(params.first_name, params.last_name)
    }

    const user = await this.DB.insert('user', params)
    const salt = generateSalt()
    this.DB.insert('user_auth',
      { user_id: user.id, password: generateHash(params.password, salt), salt })
    const sendgrid = this.serviceLocator.get('sendgrid')
    const { first_name: name } = params
    const token = await this.Model.auth.generateToken({
      payload: {
        user_id: user.id
      },
      type: 'signup',
      has_expiry: false
    })
    const html = await formatHTML('signup', { confirm_link: `${process.env.PORTAL_LINK}/verify?token=${token}`, name })
    await sendgrid.send({
      from: {
        name: 'RAMONS',
        email: process.env.EMAIL_FROM
      },
      to: user.email,
      subject: 'Verify RAMONS Account',
      html
    })

    return {
      success: true
    }
  }

  async createUser({ params }) {
    const { email } = params
    const [user_exists] = await this.Model.base.validateUnique('user', { email })
    if (user_exists) {
      throw { success: false, message: 'Email already taken.' }
    }
    const user = await this.DB.insert('user', params)
    const sendgrid = this.serviceLocator.get('sendgrid')
    const { first_name: name } = params
    const token = await this.Model.auth.generateToken({
      payload: {
        user_id: user.id
      },
      type: 'activate',
      has_expiry: false
    })
    const html = await formatHTML('activate', { confirm_link: `${process.env.PORTAL_LINK}/activate?token=${token}`, name })
    await sendgrid.send({
      from: {
        name: 'RAMONS',
        email: process.env.EMAIL_FROM
      },
      to: user.email,
      subject: 'Verify RAMONS Account',
      html
    })
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
    const sendgrid = this.serviceLocator.get('sendgrid')
    await sendgrid.send({
      from: {
        name: 'RAMONS',
        email: process.env.EMAIL_FROM
      },
      to: email,
      subject: 'Reset RAMONS Account Password',
      html
    })
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

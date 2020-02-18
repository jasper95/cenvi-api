import { upperFirst, camelCase } from 'lodash'

class BaseModel {
  constructor({ DB, knex }) {
    this.DB = DB
    this.knex = knex
  }

  getTable(node) {
    return `tbl_${upperFirst(camelCase(node))}`
  }

  async filter(
    table,
    filter = {},
    options = {},
  ) {
    const pagination = options.pagination || {}
    const sort = options.sort || [{ column: 'created_date', direction: 'asc' }]
    const fields = options.fields || []
    const search = options.search || { fields: [], value: '' }
    const { page, size } = pagination
    let query = this.knex(table).where(filter)
    const { value: search_value = '', fields: search_fields = [] } = search || {}
    if (search_value && search_fields.length) {
      query = query.andWhere(builder => search_fields
        .filter(e => e !== 'id')
        .reduce((q, field) => q.orWhere(field, 'ilike', `%${search_value}%`), builder))
    }
    if (![page, size].includes(undefined)) {
      const count = query
        .clone()
        .count()
        .then(response => Number(response[0].count))
      query = sort.reduce((q, sortEl) => q.orderBy(sortEl.column, sortEl.direction), query)
      query = query
        .offset(Number(page) * Number(size))
        .limit(Number(size))
        .select(...fields)

      return Promise.props({
        data: query,
        count
      })
    }
    return sort.reduce((q, sortEl) => q.orderBy(sortEl.column, sortEl.direction), query.select(...fields))
  }

  validateUnique(table, filters) {
    const query = this.knex(table)
    return Object.entries(filters)
      .reduce((acc, [key, val], index) => {
        const where = index === 0 ? 'where' : 'orWhere'
        if (typeof val === 'string') {
          val = val.toLowerCase()
          acc = acc[where](
            this.knex.raw(`LOWER("${key}") = ?`, val)
          )
        } else {
          acc = acc[where](
            this.knex.raw(`${key} = ?`, val)
          )
        }
        return acc
      }, query)
  }
}

export default BaseModel

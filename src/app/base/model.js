import { upperFirst, camelCase } from 'lodash'

class BaseModel {
  constructor({ DB, knex }) {
    this.DB = DB
    this.knex = knex
  }

  getTable(node) {
    return `tbl_${upperFirst(camelCase(node))}`
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

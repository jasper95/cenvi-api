export default class ShapefileController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createShapefile({ params, user, files }) {
    const {
      id
    } = params
    const { file, sld } = files
    params.user_id = user.id
    const original_name = file.name.split('.').slice(0, -1).join('.')
    const extension = file.name.split('.').pop()
    const shape_path = await this.Model.shapefile
      .packageShapefile(file.path, id, original_name, extension)
    await this.Model.shapefile
      .publishGeoData(shape_path, id)
    if (sld) {
      const sld_string = await this.Model.shapefile
        .extractSld(sld.path, id, sld.name.split('.').pop())
      await this.Model.shapefile.publishStyle(sld_string, id, original_name)
    }
    return this.DB.insert('shapefile', params)
  }
}

import xmldom from 'xmldom'; // 'xmldom' doesn't 'export' the DOMParser
import WMSCapabilities from 'wms-capabilities';
import get from 'lodash/get'
import { geoServerClient } from '../../utils'


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
      const sld_name = sld.name.split('.').slice(0, -1).join('.')
      const sld_string = await this.Model.shapefile
        .extractSld(sld.path, id, sld.name.split('.').pop())
      await this.Model.shapefile.publishStyle(sld_string, id, original_name)
    }
    return this.DB.insert('shapefile', { ...params, is_public: Boolean(params.is_public === 'true') })
  }

  async updateShapefile({ params, files }) {
    const { file, sld } = files
    const { id } = params
    if (file) {
      const original_name = sld.name.split('.').slice(0, -1).join('.')
      const extension = file.name.split('.').pop()
      const shape_path = await this.Model.shapefile
        .packageShapefile(file.path, id, original_name, extension)
      await this.Model.shapefile
        .publishGeoData(shape_path, id)
    }
    if (sld) {
      const sld_name = sld.name.split('.').slice(0, -1).join('.')
      const sld_string = await this.Model.shapefile
        .extractSld(sld.path, id, sld.name.split('.').pop())
      await this.Model.shapefile.publishStyle(sld_string, id, sld_name)
    }
    return this.DB.updateById('shapefile', { ...params, is_public: Boolean(params.is_public === 'true') })
  }

  getBoundingBox({ params }) {
    return geoServerClient({
      baseURL: 'http://202.92.153.55/geoserver',
      url: `/wms?service=WMS&layers=${process.env.GEOSERVER_WORKSPACE}:${params.id}&request=GetCapabilities&srs=4326`
    }).then(e => new WMSCapabilities(e, xmldom.DOMParser).toJSON()).then(e => get(e, 'Capability.Layer.EX_GeographicBoundingBox'))
  }
}

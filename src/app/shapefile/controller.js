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
      id,
      tags = '',
    } = params
    const { file, sld } = files
    params.user_id = user.id
    const extension = file.name.split('.').pop()
    const shape_path = await this.Model.shapefile
      .packageShapefile(file.path, id, extension)
    await this.Model.shapefile
      .publishGeoData(shape_path, id)
    if (sld) {
      await this.Model.shapefile.publishStyle(sld.path, id)
    }
    return this.DB.insert('shapefile', { ...params, tags: tags.split(','), is_public: Boolean(params.is_public === 'true') })
  }

  async updateShapefile({ params, files }) {
    const { file, sld } = files
    const { id, tags = '', } = params
    if (file) {
      const extension = file.name.split('.').pop()
      const shape_path = await this.Model.shapefile
        .packageShapefile(file.path, id, extension)
      await this.Model.shapefile
        .publishGeoData(shape_path, id)
    }
    if (sld) {
      await this.Model.shapefile.updateStyle(sld.path, id)
    }
    return this.DB.updateById('shapefile', { ...params, tags: tags.split(','), is_public: Boolean(params.is_public === 'true') })
  }

  getBoundingBox({ params }) {
    return geoServerClient({
      baseURL: process.env.GEOSERVER_URL,
      url: `/wms?service=WMS&layers=${process.env.GEOSERVER_WORKSPACE}:${params.id}&request=GetCapabilities&srs=4326`
    }).then(e => new WMSCapabilities(e, xmldom.DOMParser).toJSON()).then(e => get(e, 'Capability.Layer.EX_GeographicBoundingBox'))
  }
}

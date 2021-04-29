import gdal from 'gdal'
import JSZip from 'jszip'
import fse from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import {
  geoServerClient
} from 'utils'

class ShapefileModel {
  constructor({ DB, knex }) {
    this.DB = DB
    this.knex = knex
  }

  async extractKmz(src, des) {
    const buffer = await fs.readFileAsync(src)
    const zip = new JSZip();
    const { files } = await zip.loadAsync(buffer)

    const result = await files['doc.kml'].async('nodebuffer')
    return fs.writeFileAsync(des, result)
  }


  async kmlToShapefile(src, des) {
    const ds = gdal.open(src)
    const driver = gdal.drivers.get('ESRI Shapefile')
    const dscopy = driver.createCopy(des, ds, { COMPRESS: 'NONE', TILED: 'NONE' })
    ds.close();
    dscopy.close()
  }

  async unzipAndValidate(src, des, exts = [], options = { write: true }) {
    const src_buffer = await fs.readFileAsync(src)
    const zip = new JSZip()
    const { files } = await zip.loadAsync(src_buffer)
    const zip_buffer = await Promise.reduce(Object.keys(files), async (acc, file_name) => {
      const buffer = await files[file_name].async('nodebuffer')
      return {
        ...acc,
        [file_name]: buffer
      }
    }, {})
    if (options.write) {
      await Promise.map(
        Object.entries(zip_buffer).filter(([filename]) => !filename.includes('__MACOSX')),
        ([filename, buffer]) => fs.writeFileAsync(path.join(des, filename), buffer)
      )
    }
    return zip_buffer
  }

  async packageShapefile(src, id, ext) {
    let des = path.join(process.env.TMP_DIR, id)
    await fse.ensureDir(path.join(des, 'shapefile'))
    if (['zip', 'rar'].includes(ext)) {
      des = path.join(des, 'shapefile')
      await this.unzipAndValidate(src, des, [])
    } if (ext === 'kmz') {
      await this.unzipAndValidate(src, des, ['kml'], { write: true })
      this.kmlToShapefile(path.join(des, 'doc.kml'), path.join(des, 'shapefile'))
      des = path.join(des, 'shapefile')
    } else if (ext === 'kml') {
      path.join(des, 'shapefile')
      this.kmlToShapefile(src, path.join(des, id))
    }
    // rename files
    const files = await fs.readdirAsync(des)
    await Promise.map(
      files,
      (fname) => {
        const extension = fname.split('.').pop()
        return fs.renameAsync(path.join(des, fname), path.join(des, `${id}.${extension}`))
      }
    )
    const shape_path = `${des}.zip`
    await this.archiveFolder(des, shape_path)
    return shape_path
  }

  async extractSld(src, id, ext) {
    const des = path.join(process.env.TMP_DIR, id, 'style')
    await fse.ensureDir(des)
    if (['zip', 'rar'].includes(ext)) {
      const zip_buffer = await this.unzipAndValidate(src, des)
      const [, sld_buffer] = Object.entries(zip_buffer).find(([fname]) => fname.includes('.sld'))
      if (sld_buffer) { return sld_buffer.toString() }
    }
    if (ext === 'sld') {
      return fs.readFileAsync(src, 'utf-8')
    }
    throw { success: false, message: 'SLD extension is required' }
  }

  archiveFolder(src, des) {
    const zip = archiver('zip');
    const output = fs.createWriteStream(des);
    return new Promise((resolve, reject) => {
      zip.directory(src, '')
      zip.finalize();
      zip.pipe(output)
      zip.on('error', reject)
      zip.on('end', resolve)
    })
  }

  async publishGeoData(shape_path, id) {
    const shape_stat = await fs.statAsync(shape_path)

    return geoServerClient.request({
      method: 'PUT',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/datastores/${id}/file.shp?filename=${id}`,
      data: fs.createReadStream(shape_path),
      headers: {
        'Content-Type': 'application/zip',
        'Content-length': shape_stat.size
      }
    })
  }


  async publishStyle(sld_path, id) {
    const shape_stat = await fs.statAsync(sld_path)
    await geoServerClient.request({
      method: 'POST',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/styles?name=${id}`,
      data: fs.createReadStream(sld_path),
      headers: {
        'Content-Type': 'application/vnd.ogc.se+xml',
        'Content-length': shape_stat.size
      }
    })
    await geoServerClient.request({
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/layers/${id}`,
      data: `
          <layer>
            <defaultStyle>
              <name>${process.env.GEOSERVER_WORKSPACE}:${id}</name>
            </defaultStyle>
          </layer>
        `,
      headers: {
        'Content-Type': 'application/xml'
      },
      method: 'PUT'
    })
  }

  async updateStyle(sld_path, id) {
    const shape_stat = await fs.statAsync(sld_path)
    await geoServerClient.request({
      method: 'PUT',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/styles/${id}`,
      data: fs.createReadStream(sld_path),
      headers: {
        'Content-Type': 'application/vnd.ogc.se+xml',
        'Content-length': shape_stat.size
      }
    })
  }

  deleteDataStore(id) {
    return geoServerClient.request({
      method: 'DELETE',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/datastores/${id}?recurse=true`,
    }).catch(() => {
      // does not exist
    })
  }

  async updateShapeFile(shape_path, id) {
    // delete existing
    await this.deleteDataStore(id)
    // create new
    return this.publishGeoData(shape_path, id)
  }

  async deleteShapefile(id) {
    await this.deleteDataStore(id)
    const styleId = `${process.env.GEOSERVER_WORKSPACE}:${id}`
    await geoServerClient.request({
      method: 'DELETE',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/styles/${styleId}?purge=true&recurse=true`,
    })
    .catch(err => {
      // does not exists
    })
  }
}

export default ShapefileModel

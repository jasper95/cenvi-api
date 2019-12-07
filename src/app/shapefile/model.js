import gdal from 'gdal'
import JSZip from 'jszip'
import parseShp from 'shpjs/lib/parseShp'
import proj4 from 'proj4'
import fse from 'fs-extra'
import parseDbf from 'parsedbf'
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
    // const files = await fs.readdirAsync(des)
    // return Promise.map(files, (fname) => {
    //   const ext = fname.split('.').pop()
    //   return fs
    //     .renameAsync(path.join(des, fname), path.join(des, `${new_name}.${ext}`))
    // })
  }

  async unzipAndValidate(src, des, exts = [], options = { write: true }) {
    const src_buffer = await fs.readFileAsync(src)
    const zip = new JSZip()
    const { files } = await zip.loadAsync(src_buffer)
    // const required_files = Object.keys(files).filter((e) => {
    //   const ext = e.split('.').pop()
    //   return exts.includes(ext)
    // })
    const zip_buffer = await Promise.reduce(Object.keys(files), async (acc, file_name) => {
      const buffer = await files[file_name].async('nodebuffer')
      const ext = file_name.split('.').pop()
      return {
        ...acc,
        [file_name]: buffer
      }
    }, {})
    if (options.write) {
      await Promise.map(
        Object.entries(zip_buffer),
        ([filename, buffer]) => fs.writeFileAsync(path.join(des, filename), buffer)
      )
    }
    return zip_buffer
  }

  async packageShapefile(src, id, original_name, ext) {
    const des = path.join(process.env.TMP_DIR, id, 'shapefile')
    await fse.ensureDir(des)
    if (['zip', 'rar'].includes(ext)) {
      await this.unzipAndValidate(src, des, [])
    } if (ext === 'kmz') {
      await this.unzipAndValidate(src, des, ['kml'], { write: true })
      this.kmlToShapefile(path.join(des, 'doc.kml'), path.join(des, id))
    } else if (ext === 'kml') {
      this.kmlToShapefile(src, path.join(des, id))
    }
    // rename files
    const files = await fs.readdirAsync(des)
    await Promise.map(
      files,
      fname => fs
        .renameAsync(path.join(des, fname), path.join(des, fname.replace(original_name, id)))
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

  async publishStyle(sld_string, id, original_name) {
    const sld = sld_string
      .replace(/<\?xml.+\?>|<!DOCTYPE.+]>/g, '')
      .replace(new RegExp(`>${original_name}</`, 'g'), `>${id}</`).trim()
    await geoServerClient.request({
      method: 'POST',
      url: `/workspaces/${process.env.GEOSERVER_WORKSPACE}/styles?name=${id}`,
      data: sld,
      headers: {
        'Content-Type': 'application/vnd.ogc.sld+xml'
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
}

export default ShapefileModel

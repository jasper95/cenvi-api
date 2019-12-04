import fse from 'fs-extra'
import path from 'path'
import {
  uploadToS3,
  geoServerClient
} from 'utils'
import gdal from 'gdal'
import JSZip from 'jszip'
import unzip from 'shpjs/lib/unzip'
import parseShp from 'shpjs/lib/parseShp'
import proj4 from 'proj4'
import parseDbf from 'parsedbf'

export default class FileModel {
  constructor({ DB, knex }) {
    this.DB = DB
    this.knex = knex
  }

  async moveFile(des_dir, src, des) {
    await fse.ensureDir(des_dir)
    return fse.move(src, des, { overwrite: true })
  }

  async moveUploadedFile(file, file_des) {
    if (process.env.UPLOAD_TO_S3) {
      const blob = await fs.readFileAsync(file.path)
      await uploadToS3(blob, file_des)
      await this.DB.insert('photo', { file_path: file_des })
      return file_des
    }
    return this.moveFile(process.env.MOUNT_DIR, file.path, file_des);
  }

  storeChunk(file_path, uuid, index, chunk_num) {
    const des_dir = path.join(process.env.MOUNT_DIR, uuid, process.env.CHUNK_DIR)
    const chunk_filename = this.getChunkFilename(index, chunk_num);
    const file_des = path.join(des_dir, chunk_filename);

    return this.moveFile(des_dir, file_path, file_des);
  }

  async combineChunks(file_name, uuid) {
    const des_dir = path.join(process.env.MOUNT_DIR, uuid);
    const chunk_dir = path.join(process.env.MOUNT_DIR, uuid, process.env.CHUNK_DIR)
    const file_des = path.join(des_dir, file_name);
    const file_names = await fs.readdirAsync(chunk_dir)

    file_names.sort()
    const des_stream = fs.createWriteStream(file_des, { flags: 'a' });
    await new Promise((resolve, reject) => {
      function appendToStream(des_stream_param, src_dir, src_filenames, index) {
        if (index < src_filenames.length) {
          fs.createReadStream(path.join(src_dir, src_filenames[index]))
            .on('end', () => {
              appendToStream(des_stream_param, src_dir, src_filenames, index + 1);
            })
            .on('error', (error) => {
              des_stream_param.end();
              reject(new Error(`Problem appending chunk! ${error}`))
            })
            .pipe(des_stream_param, { end: false });
        } else {
          des_stream_param.end();
          resolve();
        }
      }
      appendToStream(des_stream, chunk_dir, file_names, 0)
    })
    const file_path = path.join('uploads', file_des.split('/').slice(1).join('/'))
    if (process.env.UPLOAD_TO_S3) {
      const blob = await fs.readFileAsync(file_des)
      await uploadToS3(blob, file_path)
    }
    await fse.remove(chunk_dir)
    return file_path
  }

  getChunkFilename(index, count) {
    const digits = (`${count}`).length
    const zeros = new Array(digits + 1).join('0');
    return (zeros + index).slice(-digits);
  }

  async extractKmz(src, des) {
    const buffer = await fs.readFileAsync(src)
    const zip = new JSZip();
    const { files } = await zip.loadAsync(buffer)

    const result = await files['doc.kml'].async('nodebuffer')
    return fs.writeFileAsync(des, result)
  }

  async convertToGeoJson(src, des) {
    const ds = gdal.open(src)
    const driver = gdal.drivers.get('GeoJSON')
    const dscopy = driver.createCopy(des, ds, { COMPRESS: 'NONE', TILED: 'NONE' })
    ds.close();
    dscopy.close()
    return fs.readFileAsync(des, 'utf-8').then(e => JSON.parse(e))
  }


  async getZipGeodata(buffer, whiteList = []) {
    const zip = unzip(buffer);
    const names = []
    Object.keys(zip)
      .forEach((key) => {
        if (key.indexOf('__MACOSX') !== -1) {
        // continue;
        } else if (key.slice(-3).toLowerCase() === 'shp') {
          names.push(key.slice(0, -4));
          zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
        } else if (key.slice(-3).toLowerCase() === 'prj') {
          zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(zip[key]);
        } else if (key.slice(-4).toLowerCase() === 'json' || whiteList.indexOf(key.split('.').pop()) > -1) {
          names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
        } else if (key.slice(-3).toLowerCase() === 'dbf' || key.slice(-3).toLowerCase() === 'cpg') {
          zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
        }
      })
    if (!names.length) {
      throw { success: false, message: 'no layers founds' }
    }
    const geojson = names.map((name) => {
      let parsed,
        dbf;
      const lastDotIdx = name.lastIndexOf('.');
      if (lastDotIdx > -1 && name.slice(lastDotIdx).indexOf('json') > -1) {
        parsed = JSON.parse(zip[name]);
        parsed.fileName = name.slice(0, lastDotIdx);
      } else if (whiteList.indexOf(name.slice(lastDotIdx + 1)) > -1) {
        parsed = zip[name];
        parsed.fileName = name;
      } else {
        if (zip[`${name}.dbf`]) {
          dbf = parseDbf(zip[`${name}.dbf`], zip[`${name}.cpg`]);
        }
        parsed = combine([parseShp(zip[`${name}.shp`], zip[`${name}.prj`]), dbf]);
        parsed.fileName = name;
      }
      return parsed;
    });
    if (geojson.length === 1) {
      return geojson[0];
    }
    return geojson;
    function combine(arr) {
      const out = {};
      out.type = 'FeatureCollection';
      out.features = [];
      let i = 0;
      const len = arr[0].length;
      while (i < len) {
        out.features.push({
          type: 'Feature',
          geometry: arr[0][i],
          properties: arr[1][i]
        });
        i++;
      }
      return out;
    }
  }

  async unzipAndValidate(src, des, exts = [], options = { write: true }) {
    const src_buffer = await fs.readFileAsync(src)
    const zip = new JSZip()
    const { files } = await zip.loadAsync(src_buffer)
    const required_files = Object.keys(files).filter((e) => {
      const ext = e.split('.').pop()
      return exts.includes(ext)
    })
    if (required_files.length === 0) {
      throw { success: false, message: `Must contain all required extensions: ${exts.join(', ')}` }
    }
    if (options.write) {
      await Promise.map(required_files, async (file_name) => {
        const buffer = await files[file_name].async('nodebuffer')
        return fs.writeFileAsync(path.join(des, file_name), buffer)
      })
    }
    return required_files
  }

  async loadToPostGis(geojson, uuid) {
    const table_name = `postgis_${uuid}`

    // generate features sql insert statements
    const features = geojson.features.map(feature => ({
      geom: this.knex.raw(`st_setsrid(st_geomfromgeojson('${JSON.stringify(feature.geometry)}'), 4326)`),
      properties: feature.properties
    }));

    // create postgis table
    await this.knex.schema.createTable(table_name, (table) => {
      table.jsonb('properties').defaultTo('{}');
      table.specificType('geom', 'geometry').notNullable();
    })

    // insert features
    await this.knex(table_name).insert(features)
    return table_name
  }

  async uploadGeoData(src, id, ext) {
    const des = path.join(process.env.TMP_DIR, id)
    await fse.ensureDir(des)
    let geojson
    if (['zip', 'rar'].includes(ext)) {
      const buffer = await fs.readFileAsync(src)
      geojson = await this.getZipGeodata(buffer)
    } else if (ext === 'kmz') {
      const [kml_name] = await this.unzipAndValidate(src, des, ['kml'], { write: true })
      geojson = await this.convertToGeoJson(path.join(des, kml_name), path.join(des, 'result.geojson'))
    } else if (ext === 'kml') {
      geojson = await this.convertToGeoJson(src, path.join(des, 'result.geojson'))
    }
    const postgis_table = await this.loadToPostGis(geojson, id)
    // publish to geoserver
    return geoServerClient.request({
      method: 'POST',
      url: `workspaces/${process.env.GEOSERVER_WORKSPACE}/datastores/${process.env.GEOSERVER_STORE}/featuretypes`,
      data: {
        featureType: {
          name: postgis_table
        }
      }
    })
  }
}

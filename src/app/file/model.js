import fse from 'fs-extra'
import path from 'path'
import {
  uploadToS3
} from 'utils'
import parseDbf from 'parsedbf'
import parseShp from 'shpjs/lib/parseShp'
import unzip from 'shpjs/lib/unzip'
import proj4 from 'proj4'
import togeojson from 'togeojson'
import { DOMParser } from 'xmldom'
import util from 'util'
import zlib from 'zlib'

const topojson = require('topojson-server')
// import topojson from 'topojson-server'

export default class FileModel {
  constructor({ DB }) {
    this.DB = DB
  }

  async getKmlGeodata(kml_path) {
    const string = await fs.readFileAsync(kml_path, 'utf-8')
    const kml = new DOMParser().parseFromString(string)
    return togeojson.kml(kml, { styles: true });
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

  async uploadGeoJson(file, extension, file_des) {
    const geodata = await this.getGeodata(file, extension)
    if (process.env.UPLOAD_TO_S3) {
      const gzip = util.promisify(zlib.gzip)
      const encoded = await gzip(Buffer.from(JSON.stringify(geodata)))
      await uploadToS3(encoded, file_des, { enconding: 'gzip', content_type: 'application/json' })
    }
  }

  async getGeodata(file, extension) {
    let geojson
    const buffer = await fs.readFileAsync(file.path)
    geojson = await this.getZipGeodata(buffer)
    // return geojson
    // if (extension === 'zip') {
    // }
    // geojson = await this.getKmlGeodata(file.path)
    return topojson.topology({ data: geojson })
  }

  async getGeoDataFromUrl(url) {
    const buffer = await fetch(url)
      .then(res => res.buffer())
    return this.getZipGeodata(buffer)
  }

  async moveFile(des_dir, src, des) {
    await fse.ensureDir(des_dir)
    return fse.move(src, des, { overwrite: true })
  }

  async moveUploadedFile(file, uuid) {
    const des_dir = path.join(process.env.MOUNT_DIR, uuid)
    const file_des = path.join(des_dir, file.name);

    if (process.env.UPLOAD_TO_S3) {
      const blob = await fs.readFileAsync(file.path)
      const file_path = path.join('uploads', file_des.split('/').slice(1).join('/'))
      await uploadToS3(blob, file_path)
      await this.DB.insert('photo', { id: uuid, file_path })
      return file_path
    }
    return this.moveFile(des_dir, file.path, file_des);
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
}

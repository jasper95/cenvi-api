import fse from 'fs-extra'
import path from 'path'
import {
  uploadToS3
} from 'utils'
import gdal from 'gdal'
import archiver from 'archiver'
import JSZip from 'jszip'
import uuid from 'uuid/v4'

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

  async kmlToShapefile(src, des, new_name) {
    const ds = gdal.open(src)
    const driver = gdal.drivers.get('ESRI Shapefile')
    const dscopy = driver.createCopy(des, ds, { COMPRESS: 'NONE', TILED: 'NONE' })
    ds.close();
    dscopy.close()
    const files = await fs.readdirAsync(des)
    return Promise.map(files, (fname) => {
      const ext = fname.split('.').pop()
      return fs
        .renameAsync(path.join(des, fname), path.join(des, `${new_name}.${ext}`))
    })
  }

  async extractKmz(src, des) {
    const buffer = await fs.readFileAsync(src)
    const zip = new JSZip();
    const { files } = await zip.loadAsync(buffer)

    const result = await files['doc.kml'].async('nodebuffer')
    return fs.writeFileAsync(des, result)
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

  async uploadGeoData(src, id, ext) {
    let shapefile_final
    if (ext === 'zip') {
      const buffer = await fs.readFileAsync(src)
      const zip = new JSZip();
      const { files } = await zip.loadAsync(buffer)
      const filenames = Object.keys(files)
      const extensions = filenames.map(e => e.split('.').pop())
      const required_extensions = ['shp', 'shx', 'dbf', 'prj']
      required_extensions.forEach((e) => {
        if (!extensions.includes(e)) {
          throw { success: false, message: `Unable to find ${e} extension` }
        }
      })
      // check if shp dbf prj exists
      shapefile_final = path.join(process.env.TMP_DIR, id)
      await fse.ensureDir(shapefile_final)
      await Promise.map(filenames, async (filename) => {
        const extension = filename.split('.').pop()
        const name = `${id}.${extension}`
        const file_buffer = await files[filename].async('nodebuffer')
        return fs.writeFileAsync(path.join(shapefile_final, name), file_buffer)
      })
      await this.archiveFolder(shapefile_final, `${shapefile_final}.zip`)
      shapefile_final = `${shapefile_final}.zip`
    } else if (ext === 'kml') {
      // shapefile_final = `${shapefile_final}.zip`
      // await this.kmlToShapefile(src, shapefile_des, id)
      // await this.archiveFolder(shapefile_des, shapefile_final)
    } else if (ext === 'kmz') {
      // const kml_src = path.join(process.env.TMP_DIR, 'kml', id)
      // await this.extractKmz(src, kml_src)
      // await this.kmlToShapefile(kml_src, shapefile_des, id)
      // await this.archiveFolder(shapefile_des, shapefile_final)
    }
    return this.uploadToGeoServer(shapefile_final, id)
  }

  uploadToGeoServer(src, datastore) {
    const WORKSPACE = 'topp';
    const PUBLISHSHAPEURL = `${process.env.GEOSERVER_URL}/workspaces/${WORKSPACE}/datastores/${datastore}/file.shp`;
    const stats = fs.statSync(src);
    const fileSizeInBytes = stats.size;
    const readStream = fs.createReadStream(src);
    const config = {
      headers: {
        Authorization: `Basic ${Buffer.from('admin:geoserver').toString('base64')}`,
        'Content-Type': 'application/zip',
        Accept: 'application/json',
        'Content-length': fileSizeInBytes
      },
      method: 'PUT',
      body: readStream
    }
    return fetch(PUBLISHSHAPEURL, config)
  }
}

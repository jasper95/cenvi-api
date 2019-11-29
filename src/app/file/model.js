import fse from 'fs-extra'
import path from 'path'
import {
  uploadToS3
} from 'utils'
import gdal from 'gdal'
import archiver from 'archiver'
import JSZip from 'jszip'

export default class FileModel {
  constructor({ DB }) {
    this.DB = DB
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

  kmlToShapefile(src, des) {
    const ds = gdal.open(src)
    const driver = gdal.drivers.get('ESRI Shapefile')
    const dscopy = driver.createCopy(des, ds, { COMPRESS: 'NONE', TILED: 'NONE' })
    ds.close();
    dscopy.close();
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
    const shapefile_des = path.join(process.env.TMP_DIR, id)
    if (ext === 'zip') {
      shapefile_final = src
      // return this.uploadToGeoServer(src, id)
    }
    // else if (ext === 'kml') {
    //   shapefile_final = `${shapefile_final}.zip`
    //   this.kmlToShapefile(src, shapefile_des)
    //   await this.archiveFolder(shapefile_des, shapefile_final)
    // } else if (ext === 'kmz') {
    //   const kml_src = path.join(process.env.TMP_DIR, 'kml', id)
    //   await this.extractKmz(src, kml_src)
    //   this.kmlToShapefile(kml_src, shapefile_des)
    //   await this.archiveFolder(shapefile_des, shapefile_final)
    // }
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

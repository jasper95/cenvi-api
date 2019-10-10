import fse from 'fs-extra'
import path from 'path'
import {
  uploadToS3
} from 'utils'

export default class FileModel {
  async moveFile(des_dir, src, des) {
    await fse.ensureDir(des_dir)
    return fse.move(src, des, { overwrite: true })
  }

  async moveUploadedFile(file, uuid) {
    const des_dir = path.join(process.env.MOUNT_DIR, uuid)
    const file_des = path.join(des_dir, file.name);

    if (process.env.UPLOAD_TO_S3) {
      const blob = await fs.readFileAsync(file.path)
      return uploadToS3(blob, file_des.slice(1).join('/'))
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

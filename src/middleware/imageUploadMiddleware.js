import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/images')
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now()
      const mathRandom = Math.round(Math.random() * 1E9)
      const extention = path.extname(file.originalname)
      cb(null, `${timestamp}-${mathRandom}${extention}`)
    }
  })

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg'
      ){
        cb(null, true)
    } else {
        cb(null, false)
    }
}

export const uploads = multer({storage: storage, fileFilter: fileFilter, limits: {fileSize: 1 * 1024 * 1024 }})
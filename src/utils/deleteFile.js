import fs from "fs"
export const deleteFile=(fileName)=>{
    const filePath="public\\temp\\"+fileName
    fs.unlinkSync(filePath)
}
// s3 전용 타임
const getTime = () => {
   const date = new Date(new Date() + 3240 * 10000).toISOString().split("T")[0].replace(/-/g, "");
   const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "");
   return date + '_' + time
}

module.exports = {
   getTime
}
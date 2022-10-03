const respondWithError = (req, res, message, data, statuscode) => {
    return res.json({
        errors: data,
        status: 'failed',
        statuscode,
        msg: message
    });
}
const respondWithSuccess = (req, res, message, data, statuscode) => {
    return res.json({
        data: data,
        status: 'success',
        statuscode,
        msg: message
    });
}
function slugify(string) {
    return string
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
  const convertTime12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');

    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '0';
    }

    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
}
module.exports = {
    respondWithError,
    respondWithSuccess,
    slugify,
    convertTime12to24
}
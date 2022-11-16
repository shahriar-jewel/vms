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
function dhm(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const daysms = ms % (24 * 60 * 60 * 1000);
    const hours = Math.floor(daysms / (60 * 60 * 1000));
    const hoursms = ms % (60 * 60 * 1000);
    const minutes = Math.floor(hoursms / (60 * 1000));
    const minutesms = ms % (60 * 1000);
    const sec = Math.floor(minutesms / 1000);
    return days + " d : " + hours + " h : " + minutes + " m";
}
module.exports = {
    respondWithError,
    respondWithSuccess,
    slugify,
    convertTime12to24,
    dhm
}
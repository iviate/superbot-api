function parseDateIso(date) {
    if (typeof date === 'string') {
        return new Date(date).toISOString();
    }

    if (date instanceof Date) {
        return date.toISOString();
    }

    throw new Error('Invalid date format');
}

module.exports = {
    parseDateIso
};

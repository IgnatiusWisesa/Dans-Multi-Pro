const paginate = ( array, itemsPerPage, page ) => {
    const startIndex = (parseInt(page) - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return array.slice(startIndex, endIndex);
}

module.exports = {
    paginate
}
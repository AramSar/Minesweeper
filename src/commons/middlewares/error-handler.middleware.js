

module.exports = {
    handleError(err, req, res, next) {
        if (!err.statusCode) {
            console.error(err);
        }

        return res.status(err.statusCode || 500).json({ message: err.message });
    }
}
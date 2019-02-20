const path = require('path');

module.exports = {
    from_current: (add_path) => path.join(path.resolve(path.join(__dirname, '../..')), add_path)
};

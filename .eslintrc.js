module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "semi": 0,
        "comma-dangle": ["error", "never"],
        "class-methods-use-this": 0,
        "camelcase": 0,
        "no-param-reassign": 0,
        "import/prefer-default-export": 0,
        "no-throw-literal": 0
    },
    "globals": {
        "Promise": true,
        "util": true
    },
    "settings": { "import/resolver": { "node": { "paths": ["./src"] } } }
};
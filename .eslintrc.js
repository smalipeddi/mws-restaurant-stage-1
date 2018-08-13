module.exports = {
    "env": {
        "browser": true
    },
    // "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 6
    },
    "rules": {
        "indent": [ "error", 2 ],
        "linebreak-style": [
            "error",
            "unix"
        ],
         "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "globals": {
        "DBHelper": false,
        "event" : false,
        "L": true , 
        "newMap" : true,
        "initMap" : true,
        "map" :false,
        "idb" : true

    }
};
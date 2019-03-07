module.exports = {
    "roots": [
        "<rootDir>/hooks_sources"
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    "setupFilesAfterEnv": [
        "<rootDir>/jest_setup_files/testdouble.js"
    ],
    "collectCoverageFrom": [
        "<rootDir>/hooks_sources/evm-events/EventBridge.ts",
        "<rootDir>/hooks_sources/evm-events/EventFetcher.ts",
        "!<rootDir>/hooks_sources/evm-events/events/*.ts",
        "!<rootDir>/hooks_sources/ethereum_utils/**/*.ts",
    ]
};

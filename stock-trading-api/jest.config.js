module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/frontend/"],
  roots: ["<rootDir>/__tests__"],
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  }
};
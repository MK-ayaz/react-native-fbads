module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: 'android/app',
        packageImportPath: 'import suraj.tiwari.reactnativefbads.FBAdsPackage;',
        packageInstance: 'new FBAdsPackage()',
      },
    },
  },
};

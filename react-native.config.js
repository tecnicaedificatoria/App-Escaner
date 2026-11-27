// En Android el escaneo lo hace el módulo propio de modules/document-scanner (ML Kit),
// así que la librería solo se enlaza en iOS (VisionKit).
module.exports = {
  dependencies: {
    'react-native-document-scanner-plugin': {
      platforms: { android: null },
    },
  },
};

const sharp = require('sharp');

sharp('public/images/gsn-logo.png')
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png()
  .toFile('public/images/gsn-logo-transparent.png',
    (err, info) => {
      if (err) console.error(err);
      else console.log('Done:', info);
  });

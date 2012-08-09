var config = module.exports = {

  secret: 'keyboard cat',

  hostname: process.env.FB_URL || 'http://wintermute.local:3000',

  port: process.env.PORT || 3000,

  fb: {
    id: process.env.FB_ID,
    secret: process.env.FB_SECRET
  },

  github: {
    id: process.env.GH_ID || 'c91b8e7b7224c9792f9d',
    secret: process.env.GH_SECRET || '65f1cde915127490be2d269aed0b135aa4f43382'
  },

  s3: {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: 'i.wookiehangover.com'
  },

  types: {
    json: { 'Content-type': 'application/json' }
  }

};


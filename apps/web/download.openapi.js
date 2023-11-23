const fetch = require('node-fetch')
const fs = require('fs')

const urlOpenAPI = 'http://localhost:3050/docs/swagger.json'

fetch(urlOpenAPI)
  .then((res) => res.buffer())
  .then((buffer) => {
    fs.writeFileSync('openapi.json', buffer)
    console.log('Téléchargement du fichier OpenAPI terminé.')
  })
  .catch((err) => console.error('Échec du téléchargement du fichier OpenAPI :', err))

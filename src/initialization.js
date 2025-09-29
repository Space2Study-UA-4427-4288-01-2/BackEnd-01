// initialization.js
const path = require('path')
const fs = require('fs')
const jsYaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')

module.exports = function init(app) {
  const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml')

  let swaggerSpec = {}
  try {
    const file = fs.readFileSync(openApiPath, 'utf8')
    swaggerSpec = jsYaml.load(file)
  } catch (err) {
    console.warn('Cannot load openapi.yaml:', err.message)
  }

  const swaggerOptions = {
    explorer: true
  }

  app.set('swaggerSpec', swaggerSpec)
  app.set('swaggerOptions', swaggerOptions)

  const enabled = process.env.SWAGGER_ENABLED !== 'false'
  if (enabled && Object.keys(swaggerSpec || {}).length) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions))

    app.get('/docs/openapi.json', (req, res) => res.json(swaggerSpec))
  }
}

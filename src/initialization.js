// initialization.js
const path = require('path')
const fs = require('fs')
const jsYaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')

module.exports = function init(app) {
  // 1) шлях до openapi-файлу
  const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml')

  // 2) читаємо YAML у JS-об'єкт (JSON)
  let swaggerSpec = {}
  try {
    const file = fs.readFileSync(openApiPath, 'utf8')
    swaggerSpec = jsYaml.load(file)
  } catch (err) {
    console.warn('Cannot load openapi.yaml:', err.message)
  }

  // 3) опції для swagger-ui (можна додавати додаткові)
  const swaggerOptions = {
    explorer: true // показати поле пошуку у UI
    // інші опції — за потреби
  }

  // 4) Зберігаємо у налаштуваннях Express (виконати вимогу: "set them as settings")
  app.set('swaggerSpec', swaggerSpec)
  app.set('swaggerOptions', swaggerOptions)

  // 5) Включаємо UI тільки коли файл успішно прочитано (і за бажанням тільки в dev)
  const enabled = process.env.SWAGGER_ENABLED !== 'false' // можна контролювати через env
  if (enabled && Object.keys(swaggerSpec || {}).length) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions))

    // додатково — віддати JSON версію спеки (корисно для CI / перевірок)
    app.get('/docs/openapi.json', (req, res) => res.json(swaggerSpec))
  }
}

export default class MetaTagsController {
  constructor({
    DB, knex, Model, serviceLocator
  }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
    this.serviceLocator = serviceLocator
  }

  async getMetaTags({ params, headers }, res, next) {
    const log = this.serviceLocator.get('logger')
    const { slug } = params
    const post = await this.DB.find('post', slug, [], 'slug')
    const singular_types = ['news']
    let { type } = post
    if (!singular_types.includes(type)) {
      type = `${type}s`
    }
    const ua = headers['user-agent']
    log('info', 'User agent: %s', ua)
    if (ua.match(/bot|crawler|spider|crawling|facebookexternalhit/i)) {
      const body = `
        <html>
          <head>
            <meta property="og:type" content="article" />
            <meta property="og:url": content="${[process.env.PORTAL_LINK, 'api', 'meta', slug].join('/')}"/>
            <meta property="og:title" content="${post.name}" />
            <meta property="og:description" content="${post.excerpt}" />
            <meta property="og:image" content="${[process.env.STATIC_URL, post.image_url].join('/')}" />
          </head>
          <body></body>
        </html>
      `
      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'text/html'
      });
      res.write(body);
      res.end();
      return
    }
    res.redirect([process.env.PORTAL_LINK, type, slug].join('/'), next);
  }
}

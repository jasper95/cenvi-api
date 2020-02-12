export default class MetaTagsController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async getMetaTags({ params, userAgent }, res, next) {
    const singular_types = ['news']
    let { type } = post
    if (!singular_types.includes(type)) {
      type = `${type}s`
    }
    if (!userAgent.test(/bot|crawler|spider|crawling/i)) {
      res.redirect(301, [process.env.PORTAL_LINK, type, slug], next);
      return
    }
    const { slug } = params
    const post = await this.DB.find('post', slug, [], 'slug')
    const body = `
      <html>
        <head>
          <meta property="og:type" content="article" />
          <meta property="og:url": content="${['https://cenvi-api.herokuapp.com', 'meta', slug].join('/')}"/>
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
  }
}

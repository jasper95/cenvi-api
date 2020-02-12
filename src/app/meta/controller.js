export default class MetaTagsController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async getMetaTags({ params, userAgent }, res) {
    console.log('userAgent: ', userAgent);
    const { slug } = params
    const post = await this.DB.find('post', slug, [], 'slug')
    const singular_types = ['news']
    let { type } = post
    if (!singular_types.includes(type)) {
      type = `${type}s`
    }
    res.header('Content-Type', 'text/html');
    res.send(
      `
      <html>
        <head>
          <meta property="og:type" content="article" />
          <meta property="og:url": content="${[process.env.PORTAL_LINK, type, slug].join('/')}"/>
          <meta property="og:title" content="${post.title}" />
          <meta property="og:description" content="${post.excerpt}" />
          <meta property="og:image" content="${[process.env.STATIC_URL, post.image_url].join('/')}" />
        </head>
        <body></body>
      </html>
    `
    )
  }
}

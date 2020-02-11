import axios from 'axios'

export default class PostModel {
  constructor() {
    const client = axios.create({
      baseURL: `https://graph.facebook.com/${process.env.FB_PAGE_ID}/feed`
    })
    client.interceptors.response.use(response => response.data, err => Promise.reject(err))
    this.fb_client = client
  }

  async createFacebookPost(post, portal_link) {
    return this.fb_client.request({
      method: 'POST',
      data: {
        message: post.excerpt,
        link: `${portal_link}/${post.type}/${post.slug}`,
        access_token: process.env.FB_PAGE_ACCESS_TOKEN
      }
    })
  }
}

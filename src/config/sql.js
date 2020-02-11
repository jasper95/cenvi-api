export const views = [
  {
    name: 'published_blog',
    query: `
      select p.*, concat_ws(' ', "user".first_name, "user".last_name) as author
        from post p
      left join "user" on
        (p.user_id = "user".id)
      where status = 'published' and published_date <= NOW() and type = 'blog'
    `
  },
  {
    name: 'published_news',
    query: `
      select p.*, concat_ws(' ', "user".first_name, "user".last_name) as author
        from post p
      left join "user" on
        (p.user_id = "user".id)
      where status = 'published' and published_date <= NOW() and type = 'news'
    `
  },
  {
    name: 'published_album',
    query: `
      select b.*, concat_ws(' ', "user".first_name, "user".last_name) as author
        from album b
      left join "user" on
        (b.user_id = "user".id)
      where status = 'published' and published_date <= NOW()
    `
  }
]
export const functions = [
]

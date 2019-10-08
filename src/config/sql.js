export const views = [
  {
    name: 'published_blog',
    query: `
      select b.*, concat_ws(' ', "user".first_name, "user".last_name) as author
        from blog b
      left join "user" on
        (b.user_id = "user".id)
      where status = 'published' and published_date <= NOW()
    `
  }
]
export const functions = [
]

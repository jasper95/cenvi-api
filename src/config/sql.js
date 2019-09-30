export const views = [
  {
    name: 'risk_dashboard',
    query: `
      select
        r.*,
        EXISTS(select * from request where risk_id = r.id and type = 'DONE_TREATMENT_RISK') as has_treatment_request,
        EXISTS(select * from request where risk_id = r.id and type = 'EDIT_INHERENT_RISK') as has_inherent_request,
        EXISTS(select * from request where risk_id = r.id and type = 'DELETE_RISK') as has_delete_request,
        c.name as classification_name
      from risk r
      left join classification c
        on r.classification_id = c.id
    `
  },
  {
    name: 'user_dashboard',
    query: `
      select "user".*, concat_ws(' ', "user".first_name, "user".last_name) as full_name
      from "user"
    `
  },
  {
    name: 'business_unit_srmp',
    query: `
        SELECT b.*, count(r.business_unit_id) as risk_count
        from business_unit b
        left join (select * from risk rr where rr."type" = 'srmp') r
          on (r.business_unit_id = b.id)
        group by
          b.id
    `
  },
  {
    name: 'business_unit_ormp',
    query: `
        SELECT b.*, count(r.business_unit_id) as risk_count
        from business_unit b
        left join (select * from risk rr where rr."type" = 'ormp') r
          on (r.business_unit_id = b.id)
        group by
          b.id
    `
  },
  {
    name: 'business_unit_prmp',
    query: `
        SELECT b.*, count(r.business_unit_id) as risk_count
        from business_unit b
        left join (select * from risk rr where rr."type" = 'prmp') r
          on (r.business_unit_id = b.id)
        group by
          b.id
    `
  },
  {
    name: 'project_risk',
    query: `
      SELECT p.*, count(r.project_id) as risk_count, so.name as sub_operation_name
      from project p
      left join risk r
        on (r.project_id = p.id)
      inner join sub_operation so
        on (p.sub_operation_id = so.id)
      group by
        p.id, so.name
    `
  },
  {
    name: 'operation_sub_operation',
    query: `
      SELECT o.*, count(so.operation_id) as sub_operation_count
      from operation o
      left join sub_operation so
        on (so.operation_id = o.id)
      group by
        o.id
    `
  },
  {
    name: 'sub_operation_project',
    query: `
      SELECT so.*, count(p.sub_operation_id) as project_count, count(r.sub_operation_id) as risk_count, o.name as operation_name
      from sub_operation so
      left join project p
        on (p.sub_operation_id = so.id)
      left join risk r
        on (r.sub_operation_id = so.id)
      left join operation o
        on (so.operation_id = o.id)
      group by
        so.id, o.name
    `
  }
]
export const functions = [
  {
    param_signature: 'search_users(search text)',
    return_signature: 'setof "user"',
    query: `
      select "user".*
      from "user"
      where "first_name" ilike ('%' || search || '%') OR "last_name" ilike ('%' || search || '%')
    `
  }
]

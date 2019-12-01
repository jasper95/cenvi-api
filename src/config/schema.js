module.exports = {
  tables: [
    {
      table_name: 'user',
      columns: [
        {
          column_name: 'email',
          type: 'string',
          required: true,
          index: true
        },
        {
          column_name: 'verified',
          type: 'boolean',
          default: false
        },
        {
          column_name: 'avatar',
          type: 'string',
          default: ''
        },
        {
          column_name: 'first_name',
          type: 'string',
          // required: true,
          default: ''
        },
        {
          column_name: 'last_name',
          type: 'string',
          // required: true,
          default: ''
        },
        {
          column_name: 'role',
          type: 'string',
          required: true,
          default: ''
        }
      ]
    },
    {
      table_name: 'user_auth',
      columns: [
        {
          column_name: 'user_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'user',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'password',
          type: 'string',
          default: '',
          required: true
        },
        {
          column_name: 'salt',
          type: 'string',
          required: true
        }
      ]
    },
    {
      table_name: 'user_session',
      columns: [
        {
          column_name: 'user_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'user',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'status',
          type: 'string',
          default: 'Online',
          required: true
        },
        {
          column_name: 'device_type',
          type: 'string',
          default: 'Web',
          required: true
        }
      ]
    },
    {
      table_name: 'token',
      columns: [
        {
          column_name: 'type',
          type: 'string',
          required: true
        },
        {
          column_name: 'expiry',
          type: 'timestamp',
          type_params: [{ useTz: true }]
        },
        {
          column_name: 'used',
          type: 'boolean',
          default: false
        }
      ]
    },
    {
      table_name: 'blog',
      slug: true,
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'content',
          type: 'jsonb',
          default: '{}'
        },
        {
          column_name: 'excerpt',
          type: 'string',
          required: true
        },
        {
          column_name: 'tags',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'image_url',
          type: 'string',
          required: true
        },
        {
          column_name: 'status',
          type: 'string',
          required: true
        },
        {
          column_name: 'published_date',
          type: 'timestamp',
          type_params: [{ useTz: true }],
          required: true
        },
        {
          column_name: 'user_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'user',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    },
    {
      table_name: 'photo',
      columns: [
        {
          column_name: 'file_path',
          type: 'string',
          required: true
        }
      ]
    },
    {
      table_name: 'album',
      slug: true,
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'photos',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'excerpt',
          type: 'string',
          required: true
        },
        {
          column_name: 'status',
          type: 'string',
          required: true
        },
        {
          column_name: 'published_date',
          type: 'timestamp',
          type_params: [{ useTz: true }],
          required: true
        },
        {
          column_name: 'user_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'user',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'tags',
          type: 'jsonb',
          default: '[]'
        }
      ]
    },
    {
      table_name: 'category',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        }
      ]
    },
    {
      table_name: 'shapefile',
      slug: true,
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'description',
          type: 'string',
          default: ''
        },
        {
          column_name: 'tags',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'file_path',
          type: 'string',
          default: ''
          // required: true
        },
        {
          column_name: 'category_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'category',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    }
  ]
}

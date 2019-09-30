module.exports = {
  tables: [
    {
      table_name: 'business_unit',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'order',
          type: 'integer',
          required: true
        }
      ]
    },
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
        },
        {
          column_name: 'srmp_role',
          type: 'string',
          default: ''
        },
        {
          column_name: 'ormp_role',
          type: 'string',
          default: ''
        },
        {
          column_name: 'prmp_role',
          type: 'string',
          default: ''
        },
        {
          column_name: 'srmp_business_units',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'ormp_business_units',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'prmp_business_units',
          type: 'jsonb',
          default: '[]'
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
      table_name: 'classification',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        }
      ]
    },
    {
      table_name: 'risk',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'definition',
          type: 'string',
          required: true
        },
        {
          column_name: 'user_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'user',
          reference_column: 'id'
        },
        {
          column_name: 'type',
          type: 'string',
          default: 'srmp'
        },
        {
          column_name: 'residual_vulnerability',
          type: 'string'
        },
        {
          column_name: 'business_unit_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'business_unit',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'sub_operation_id',
          type: 'uuid'
        },
        {
          column_name: 'project_id',
          type: 'uuid'
        },
        {
          column_name: 'classification_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'classification',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        // http://putco.de/MTIxMjI.matlab
        {
          column_name: 'basis',
          type: 'string',
          required: true
        },
        {
          column_name: 'previous_details',
          type: 'jsonb'
        },
        {
          column_name: 'impact_details',
          type: 'jsonb'
        },
        {
          column_name: 'target_impact_driver',
          type: 'string'
        },
        {
          column_name: 'target_likelihood',
          type: 'integer',
          default: 1
        },
        {
          column_name: 'target_rating',
          type: 'integer'
        },
        {
          column_name: 'inherent_impact_driver',
          type: 'string'
        },
        {
          column_name: 'inherent_likelihood',
          type: 'integer'
        },
        {
          column_name: 'inherent_rating',
          type: 'integer'
        },
        {
          column_name: 'residual_impact_driver',
          type: 'string'
        },
        {
          column_name: 'residual_likelihood',
          type: 'integer',
          default: 1
        },
        {
          column_name: 'residual_rating',
          type: 'integer'
        },
        {
          column_name: 'causes',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'stakeholders',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'impacts',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'current_treatments',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'future_treatments',
          type: 'jsonb',
          default: '[]'
        },
        {
          column_name: 'recent_changes',
          type: 'jsonb',
          default: '{}'
        },
        {
          column_name: 'reason',
          type: 'jsonb',
          default: '{}'
        }
      ]
    },
    {
      table_name: 'notification',
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
          column_name: 'risk_id',
          type: 'uuid',
          foreign_key: true,
          reference_table: 'risk',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'business_unit_id',
          type: 'uuid',
          foreign_key: true,
          reference_table: 'business_unit',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'details',
          type: 'jsonb',
          default: '{}'
        },
        {
          column_name: 'receivers',
          type: 'jsonb',
          default: '[]'
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
      table_name: 'request',
      columns: [
        {
          column_name: 'type',
          type: 'string',
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
          column_name: 'risk_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'risk',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'business_unit_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'business_unit',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        },
        {
          column_name: 'treatment_details',
          type: 'jsonb'
        },
        {
          column_name: 'risk_details',
          type: 'jsonb'
        }
      ]
    },
    {
      table_name: 'operation',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'business_unit_id',
          type: 'uuid',
          required: true,
          foreign_key: true,
          reference_table: 'business_unit',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    },
    {
      table_name: 'sub_operation',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'operation_id',
          type: 'uuid',
          required: true,
          foreign_key: true,
          reference_table: 'operation',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    },
    {
      table_name: 'project',
      columns: [
        {
          column_name: 'name',
          type: 'string',
          required: true
        },
        {
          column_name: 'sub_operation_id',
          type: 'uuid',
          required: true,
          foreign_key: true,
          reference_table: 'sub_operation',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    },
    {
      table_name: 'comment',
      columns: [
        {
          column_name: 'body',
          type: 'jsonb',
          default: '{}'
        },
        {
          column_name: 'type',
          type: 'string',
          default: 'risk'
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
          column_name: 'risk_id',
          type: 'uuid',
          foreign_key: true,
          required: true,
          reference_table: 'risk',
          reference_column: 'id',
          on_update: 'CASCADE',
          on_delete: 'CASCADE'
        }
      ]
    }
  ]
}

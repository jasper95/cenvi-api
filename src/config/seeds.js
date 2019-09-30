module.exports = [
  {
    table_name: 'business_unit',
    data: [{
      id: '871637c4-5510-4500-8e78-984fce5001ff',
      name: 'RAFI',
      order: 1
    }, {
      id: 'd79f8707-3f9d-44c6-af5a-e44d27c22d28',
      name: 'RMF',
      order: 2
    }, {
      id: '2184c63d-0f4f-4d68-aa76-4816a7e24b63',
      name: 'CHU',
      order: 3
    }, {
      id: 'a7fe8e1a-732d-4ea6-a8e7-fd1e2e0d8ea3',
      name: 'EDU',
      order: 4
    }, {
      id: '3dd65363-0981-44c3-a4f1-b94982d1c225',
      name: 'BIOCON',
      order: 5
    }, {
      id: 'eaea63b5-fb13-4cee-b328-3fcc76447cd7',
      name: 'KAC',
      order: 6
    }, {
      id: '94c28908-4f4c-4745-b283-1ee4bb3e5caf',
      name: 'AFO',
      order: 7
    }, {
      id: 'ac422fa3-e143-491a-ac01-a8a6093d6e6d',
      name: 'DACF',
      order: 8
    }]
  },
  {
    table_name: 'classification',
    data: [{
      name: 'Strategic',
      id: 'ce52ae0c-005e-4673-84f5-c05430f59eb8'
    }, {
      name: 'Operational',
      id: 'f83c986a-ca4e-42b1-ab8c-3928b3e8bf84'
    }, {
      name: 'Financial',
      id: '1681ee70-f146-4f5f-9d4e-c90b29e63407'
    }, {
      name: 'Legal or Compliance',
      id: '3ee4a7e0-c500-4378-a3d5-bba012e0ebb5'
    }]
  },
  {
    table_name: 'user',
    data: [
      {
        id: '4cf57f7b-f029-48fe-ba6a-96535d8d5fd7',
        created_date: '2019-08-25T14:29:17Z',
        updated_date: '2019-09-08T03:43:12Z',
        email: 'ramons@mailinator.com',
        verified: true,
        avatar: '',
        first_name: 'Ramon',
        last_name: 'Aboitiz',
        role: 'ADMIN',
        business_unit_id: null,
        srmp_role: '',
        ormp_role: '',
        srmp_business_units: ['871637c4-5510-4500-8e78-984fce5001ff', '2184c63d-0f4f-4d68-aa76-4816a7e24b63'],
        orpm_business_units: []
      }
    ]
  },
  {
    table_name: 'user_auth',
    data: [
      {
        id: '3cb92377-4150-4144-ad1b-7557a8b3517a',
        created_date: '2019-08-25T14:30:08Z',
        updated_date: '2019-08-25T14:30:08Z',
        user_id: '4cf57f7b-f029-48fe-ba6a-96535d8d5fd7',
        password: '640f0dff3f9828ffe4441de0c0edfb8ca61b69a998dc6c0d22d7dbc3e8b3df8547acd23d28729dc7282f041da1df9a7dd723236d6715ed537d638e09ca4e25ab',
        salt: 'f5137d35bf001df3'
      }
    ]
  }
]
